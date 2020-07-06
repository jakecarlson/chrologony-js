import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import { Promise } from "meteor/promise";
import SimpleSchema from 'simpl-schema';
import { Schemas } from '../modules/Schemas';

import { Games } from "./Games";
import { Clues } from "./Clues";
import { Turns } from "./Turns";

export const Cards = new Mongo.Collection('cards');

Cards.schema = new SimpleSchema({
    gameId: {type: String, regEx: SimpleSchema.RegEx.Id},
    turnId: {type: String, regEx: SimpleSchema.RegEx.Id},
    clueId: {type: String, min: 17, max: 24},
    ownerId: {type: String, regEx: SimpleSchema.RegEx.Id, optional: true},
    owner: {type: String, regEx: SimpleSchema.RegEx.Id, optional: true},
    correct: {type: Boolean, defaultValue: null, optional: true},
    lockedAt: {type: Date, defaultValue: null, optional: true},
    pos: {type: SimpleSchema.Integer, defaultValue: 0},
});
Cards.schema.extend(Schemas.timestampable);
Cards.attachSchema(Cards.schema);

Cards.helpers({

    game() {
        return Games.findOne(this.gameId);
    },

    turn() {
        return Turns.findOne(this.turnId);
    },

    clue() {
        return Clues.findOne(this.clueId);
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

});

if (Meteor.isServer) {

    Meteor.publish('cards', function cardsPublication(gameId) {
        if (this.userId && gameId) {
            return Cards.find(
                {
                    gameId: gameId
                },
                {
                    fields: {
                        _id: 1,
                        gameId: 1,
                        turnId: 1,
                        clueId: 1,
                        correct: 1,
                        lockedAt: 1,
                        pos: 1,
                        ownerId: 1,
                        createdAt: 1,
                    }
                }
            );
        } else {
            return this.ready();
        }
    });

    publishComposite('cardClues', function(gameId) {
        return {
            find() {
                if (this.userId && gameId) {
                    const clueIds = Promise.await(
                        Cards.rawCollection().distinct('clueId', {gameId: gameId})
                    );
                    const unsubmittedClueIds = Promise.await(
                        Cards.rawCollection().distinct('clueId', {gameId: gameId, correct: null})
                    );
                    return Clues.find(
                        {
                            _id: {$in: clueIds},
                        },
                        {
                            fields: {
                                _id: 1,
                                date: 1,
                                description: 1,
                                categories: 1,
                                hint: 1,
                                thumbnailUrl: 1,
                                imageUrl: 1,
                                latitude: 1,
                                longitude: 1,
                                externalId: 1,
                                externalUrl: 1,
                                moreInfo: 1,
                            },
                            transform: function(doc) {
                                if (unsubmittedClueIds.includes(doc._id)) {
                                    doc.date = null;
                                    doc.hint = null;
                                    doc.thumbnailUrl = null;
                                    doc.imageUrl = null;
                                    doc.latitude = null;
                                    doc.longitude = null;
                                    doc.externalId = null;
                                    doc.externalUrl = null;
                                    doc.moreInfo = null;
                                }
                                return doc;
                            },
                        }
                    );
                } else {
                    return this.ready();
                }
            }
        };
    });

    Cards.deny({
        insert() { return true; },
        update() { return true; },
        remove() { return true; },
    });

}

Meteor.methods({

    // Set the card positions
    'card.setPositions'(cards) {

        check(cards, Object);
        Permissions.check(Permissions.authenticated());

        Logger.log("Card Positions: " + JSON.stringify(cards));

        let numUpdated = 0;
        for (const [id, pos] of Object.entries(cards)) {
            check(id, RecordId);
            check(pos, Match.Integer);
            Permissions.check(Permissions.owned(Cards.findOne(id)));
            numUpdated += Cards.update(
                {
                    _id: id,
                    ownerId: Meteor.userId(),
                },
                {
                    $set: {
                        pos: pos,
                    }
                }
            );
        }

        return numUpdated;

    },

    // Lock Card
    'card.lock'(id) {

        check(id, RecordId);
        Permissions.check(Permissions.authenticated());

        // Double check that the card was correct before locking
        const card = Cards.findOne(id);
        Permissions.check(card.correct);

        Logger.log('Lock Card: ' + id);

        // If there is an ID, this is an update
        return Cards.update(
            {
                _id: id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    lockedAt: new Date(),
                }
            }
        );

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Draw Card
        'card.draw'(turnId) {

            check(turnId, RecordId);
            Permissions.check(Permissions.authenticated());
            const turn = Turns.findOne(turnId);
            Permissions.check((turn.game().roomId == Meteor.user().currentRoomId));

            // Draw the card -- defer this to a helper defined below because it's recursive
            const cardId = drawCard(turnId);
            Logger.log("Card ID: " + cardId);

            Meteor.call('turn.setCard', turnId, cardId, null, function(err, updated) {
                if (!err) {
                    Logger.log("Updated Turn: " + updated);
                }
            });

            return cardId;

        },

        // Submit Guess
        'card.submitGuess'(id, pos) {

            check(id, RecordId);
            check(pos, Match.Integer);
            Permissions.check(Permissions.authenticated());

            // Get the card and determine if the guess is correct
            const card = Cards.findOne(id);
            Permissions.check(Permissions.owned(card));
            const correct = guessIsCorrect(card, pos);

            Logger.log("Card Guess Correct?: " + JSON.stringify(correct));

            // Null out the current card ID
            Meteor.call('turn.setCard', card.turn()._id, null, correct, function(err, updated) {
                if (!err) {
                    Logger.log("Updated Turn: " + updated);
                }
            });

            Logger.log('Update Card: ' + id + ' ' + JSON.stringify({correct: correct}));

            // Update the card
            Cards.update(
                id,
                {
                    $set: {
                        correct: correct,
                    }
                }
            );

            return correct;

        },

    });

    // Draw a new card
    function drawCard(turnId) {

        // Get a random card that hasn't been drawn this game
        const turn = Turns.findOne(turnId);
        const lockedCards = Cards.find({gameId: turn.gameId, lockedAt: {$ne: null}}).map(function(i) { return i.clueId; });
        const turnCards = Cards.find({turnId: turnId}).map(function(i) { return i.clueId; });
        const usedCards = lockedCards.concat(turnCards);

        Logger.log('Used Cards: ' + JSON.stringify(usedCards));

        let selector = {
            active: true,
            categories: turn.game().categoryId,
        };
        if (usedCards.length > 0) {
            selector._id = {$nin: usedCards};
        }
        const possibleClues = Promise.await(
            Clues.rawCollection().aggregate(
                [
                    {$match: selector},
                    {$sample: {size: 1}},
                ]
            ).toArray()
        );
        if (possibleClues.length == 0) {
            Logger.log("No more cards to draw!!!");
            return null;
        }
        const randomClue = possibleClues[0];

        // Set the card doc
        const card = {
            gameId: turn.gameId,
            turnId: turnId,
            clueId: randomClue._id,
            ownerId: turn.ownerId,
            correct: null,
            lockedAt: null,
        };

        // Figure out whether this is the first card
        const userCards = Cards.find(
            {
                gameId: turn.gameId,
                ownerId: turn.ownerId,
            }
        ).fetch();
        const firstCard = (userCards.length == 0);

        // If it's the first card, automatically mark it correct
        if (firstCard) {
            card.correct = true;
            card.lockedAt = new Date();
        }

        Logger.log('Insert Card: ' + JSON.stringify(card));

        // Add the card
        const cardId = Cards.insert(card);

        // If it's the first card, draw another
        if (firstCard) {
            return drawCard(turnId);
        } else {
            return cardId;
        }

    }

    // Determine if the guess is correct
    function guessIsCorrect(card, pos) {

        const cards = Cards.find(
            {
                gameId: card.turn().gameId,
                ownerId: Meteor.userId(),
                $or: [
                    {turnId: card.turn()._id},
                    {lockedAt: {$ne: null}},
                ],
            },
            {
                sort: {
                    pos: 1,
                    createdAt: -1,
                }
            }
        ).fetch();

        // Save the guess date
        const guessDate = cards[pos].clue().dateObj();

        // If there is a previous card, validate the guess against it
        if (pos > 0) {
            const previousDate = cards[pos-1].clue().dateObj();
            if (guessDate.isBefore(previousDate)) {
                return false;
            }
        }

        // If there is a next card, validate the guess against it
        if (pos < (cards.length-1)) {
            const nextDate = cards[pos+1].clue().dateObj();
            if (guessDate.isAfter(nextDate)) {
                return false;
            }
        }

        // If both validations passed, this is correct!
        return true;

    }

}