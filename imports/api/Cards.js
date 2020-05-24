import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
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
    // clueId: {type: String, regEx: SimpleSchema.RegEx.idOfLength()}, // Doesn't work for imported IDs
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
            return Cards.find({gameId: gameId});
        } else {
            return this.ready();
        }
    });

    Meteor.publish('cardClues', function cardCluesPublication(gameId) {
        if (this.userId && gameId) {
            const clueIds = Promise.await(
                Cards.rawCollection().distinct('clueId', {gameId: gameId})
            );
            return Clues.find({_id: {$in: clueIds}});
        } else {
            return this.ready();
        }
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
        Permissions.authenticated();

        Logger.log("Card Positions: " + JSON.stringify(cards));

        let numUpdated = 0;
        for (const [id, pos] of Object.entries(cards)) {
            check(id, RecordId);
            check(pos, Match.Integer);
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
        Permissions.authenticated();

        // Double check that the card was correct before locking
        const card = Cards.findOne(id);
        if (!card.correct) {
            throw new Meteor.Error('not-authorized');
        }

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
            Permissions.authenticated();

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
            Permissions.authenticated();

            // Get the previously correct cards + the current card in the correct order
            const card = Cards.findOne(id);
            const clueIds = Promise.await(
                Cards.rawCollection().distinct(
                    'clueId',
                    {
                        gameId: card.turn().gameId,
                        ownerId: Meteor.userId(),
                        $or: [
                            {lockedAt: {$ne: null}},
                            {turnId: card.turn()._id, correct: true},
                            {_id: id},
                        ],
                    }
                )
            );
            const guess = Clues.find(
                {
                    _id: {$in: clueIds},
                },
                {
                    sort: {
                        date: 1,
                    },
                    skip: pos,
                    limit: 1,
                }
            ).fetch()[0];

            // Validate that the card is in the correct position
            const correct = (card.clueId === guess._id);

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

}

// Helpers
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
                {$sample: {size: 1 }},
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