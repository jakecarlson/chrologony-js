import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Promise } from "meteor/promise";
import SimpleSchema from 'simpl-schema';
import { Schema } from './Schema';

import { Games } from "./games";
import { Clues } from "./clues";
import { Turns } from "./turns";

export const Cards = new Mongo.Collection('cards');

Cards.schema = new SimpleSchema({
    turnId: {type: String, regEx: SimpleSchema.RegEx.Id},
    gameId: {type: String, regEx: SimpleSchema.RegEx.Id},
    clueId: {type: String, regEx: SimpleSchema.RegEx.Id},
    clue: {type: Clues.schema},
    userId: {type: String, regEx: SimpleSchema.RegEx.Id},
    correct: {type: Boolean, defaultValue: null, optional: true},
    lockedAt: {type: Date, defaultValue: null, optional: true},
    pos: {type: SimpleSchema.Integer, defaultValue: 0},
});
Cards.schema.extend(Schema.timestamps);
Cards.attachSchema(Cards.schema);

if (Meteor.isServer) {

    Meteor.publish('cards', function cardsPublication(gameId) {
        if (this.userId && gameId) {
            return Cards.find({gameId: gameId});
        } else {
            return this.ready();
        }
    });

    Cards.deny({
        insert() { return true; },
        update() { return true; },
        remove() { return true; },
    });

    /*
    Meteor.publish('playerCardCounts', function playerCardsCountPublication(gameId) {
        if (this.userId && gameId) {
            return Promise.await(
                Cards.rawCollection().aggregate(
                    [
                        {$match: {gameId: gameId, lockedAt: {$ne: null}}},
                        {$group: {_id: "$userId", cards: {$sum: 1}}}
                    ]
                ).toArray()
            );
        } else {
            return this.ready();
        }
    });
    */

}

Meteor.methods({

    // Set the card positions
    'card.setPositions'(cards) {

        check(cards, Object);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log("Card Positions: " + JSON.stringify(cards));

        let numUpdated = 0;
        for (const [id, pos] of Object.entries(cards)) {
            check(id, RecordId);
            check(pos, Match.Integer);
            numUpdated += Cards.update(
                id,
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

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Double check that the card was correct before locking
        const card = Cards.findOne(id);
        if (!card.correct) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Lock Card: ' + id);

        // If there is an ID, this is an update
        return Cards.update(
            id,
            {
                $set: {
                    lockedAt: new Date(),
                }
            }
        );

    },

    // Submit Guess
    'card.submitGuess'(id, pos) {

        check(id, RecordId);
        check(pos, Match.Integer);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Get the previously correct cards + the current card in the correct order
        const card = Cards.findOne(id)
        let turn = Turns.findOne(card.turnId);
        let guess = Cards.find(
            {
                gameId: turn.gameId,
                userId: turn.userId,
                $or: [
                    {lockedAt: {$ne: null}},
                    {turnId: turn._id, correct: true},
                    {_id: id},
                ],
            },
            {
                sort: {
                    'clue.date': 1,
                },
                skip: pos,
                limit: 1,
            }
        ).fetch()[0];

        // Validate that the card is in the correct position
        let correct = (id === card._id);

        Logger.log("Card Guess Correct?: " + JSON.stringify(correct));

        // Null out the current card ID
        Meteor.call('turn.setCard', turn._id, null, correct, function(error, updated) {
            if (!error) {
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

if (Meteor.isServer) {

    Meteor.methods({

        // Draw Card
        'card.draw'(turnId) {

            check(turnId, RecordId);

            // Make sure the user is logged in
            if (! Meteor.userId()) {
                throw new Meteor.Error('not-authorized');
            }

            // Draw the card -- defer this to a helper defined below because it's recursive
            let cardId = drawCard(turnId);
            Logger.log("Card ID: " + cardId);

            Meteor.call('turn.setCard', turnId, cardId, null, function(error, updated) {
                if (!error) {
                    Logger.log("Updated Turn: " + updated);
                }
            });

            return cardId;

        },

    });

}

// Helpers
function drawCard(turnId) {

    // Get a random card that hasn't been drawn this game
    let turn = Turns.findOne(turnId);
    let game = Games.findOne(turn.gameId);
    let lockedCards = Cards.find({gameId: turn.gameId, lockedAt: {$ne: null}}).map(function(i) { return i.clueId; });
    let turnCards = Cards.find({turnId: turnId}).map(function(i) { return i.clueId; });
    let usedCards = lockedCards.concat(turnCards);

    Logger.log('Used Cards: ' + JSON.stringify(usedCards));

    let selector = {
        active: true,
        categories: game.categoryId,
    };
    if (usedCards.length > 0) {
        selector._id = {$nin: usedCards};
    }
    let possibleClues = Promise.await(
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
    let randomClue = possibleClues[0];

    // Set the card doc
    let card = {
        turnId: turnId,
        gameId: turn.gameId,
        clueId: randomClue._id,
        clue: randomClue,
        userId: turn.userId,
    };

    // Figure out whether this is the first card
    const userCards = Cards.find({gameId: turn.gameId, userId: turn.userId}).fetch();
    const firstCard = (userCards.length == 0);

    // If it's the first card, automatically mark it correct
    if (firstCard) {
        card.correct = true;
        card.lockedAt = new Date();
    }

    Logger.log('Insert Card: ' + JSON.stringify(card));

    // Add the card
    let cardId = Cards.insert(card);

    // If it's the first card, draw another
    if (firstCard) {
        return drawCard(turnId);
    } else {
        return cardId;
    }

}