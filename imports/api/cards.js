import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString } from "../startup/validations";
import { Promise } from "meteor/promise";

import { Games } from "./games";
import { Clues } from "./clues";
import { Turns } from "./turns";

export const Cards = new Mongo.Collection('cards');

if (Meteor.isServer) {

    Meteor.publish('cards', function cardsPublication(gameId) {
        if (this.userId && gameId) {
            return Cards.find({gameId: gameId});
        } else {
            return this.ready();
        }
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
    'card.pos'(cards) {

        check(cards, Object);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log("Card Positions:");
        console.log(cards);

        let numUpdated = 0;
        for (const [id, pos] of Object.entries(cards)) {
            numUpdated += Cards.update(
                {
                    _id: id,
                },
                {
                    $set: {
                        pos: pos,
                        updatedAt: new Date(),
                    }
                }
            );
        }

        return numUpdated;

    },

    // Lock
    'card.lock'(id) {

        check(id, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Double check that the card was correct before locking
        const card = Cards.findOne(id);
        if (!card.correct) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Lock Card: ' + id);

        // If there is an ID, this is an update
        return Cards.update(
            {
                _id: id,
            },
            {
                $set: {
                    lockedAt: new Date(),
                    updatedAt: new Date(),
                }
            }
        );

    },

    // Submit Cards
    'card.submit'(args) {

        check(args.gameId, String);
        check(args.turnId, String);
        check(args.cardId, String);
        check(args.pos, Number);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Get the previously correct cards + the current card in the correct order
        let turn = Turns.findOne(args.turnId);
        let card = Cards.find(
            {
                gameId: args.gameId,
                userId: turn.userId,
                $or: [
                    {lockedAt: {$ne: null}},
                    {turnId: args.turnId, correct: true},
                    {_id: args.cardId},
                ],
            },
            {
                sort: {
                    'clue.date': 1,
                },
                skip: args.pos,
                limit: 1,
            }
        ).fetch()[0];

        // Validate that the card is in the correct position
        let correct = (args.cardId === card._id);

        console.log("Card Guess Correct?: " + correct.toString());

        // Null out the current card ID
        Meteor.call('turn.update', {_id: args.turnId, currentCardId: null, lastCardCorrect: correct}, function(error, updated) {
            if (!error) {
                console.log("Updated Turn: " + updated);
            }
        });

        console.log('Update Card: ' + args.cardId);
        console.log({correct: correct});

        // Update the card
        Cards.update(
            {
                _id: args.cardId,
            },
            {
                $set: {
                    correct: correct,
                    updatedAt: new Date(),
                }
            }
        );

        return correct;

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Draw Card
        'card.draw'(attrs) {

            check(attrs.turnId, NonEmptyString);
            check(attrs.gameId, NonEmptyString);

            // Make sure the user is logged in
            if (! Meteor.userId()) {
                throw new Meteor.Error('not-authorized');
            }

            // Draw the card -- defer this to a helper defined below because it's recursive
            let cardId = drawCard(attrs.gameId, attrs.turnId);
            console.log("Card ID: " + cardId);

            Meteor.call('turn.update', {_id: attrs.turnId, currentCardId: cardId, lastCardCorrect: null}, function(error, updated) {
                if (!error) {
                    console.log("Updated Turn: " + updated);
                }
            });

            return cardId;

        },

    });

}

// Helpers
function drawCard(gameId, turnId) {

    // Get a random card that hasn't been drawn this game
    let game = Games.findOne(gameId);
    let lockedCards = Cards.find({gameId: gameId, lockedAt: {$ne: null}}).map(function(i) { return i.clueId; });
    let turnCards = Cards.find({turnId: turnId}).map(function(i) { return i.clueId; });
    let usedCards = lockedCards.concat(turnCards);

    console.log('Used Cards:');
    console.log(usedCards);

    let selector = {
        active: true,
        categoryId: game.categoryId,
    };
    if (usedCards.length > 0) {
        selector._id = {$nin: usedCards};
    }
    let possibleClues = Clues.find(selector).fetch();
    if (possibleClues.length == 0) {
        console.log("No more cards to draw!!!");
        return null;
    }
    let randomClue = possibleClues[Math.floor(Math.random() * possibleClues.length)];

    // Set the card doc
    let turn = Turns.findOne(turnId);
    let card = {
        turnId: turnId,
        gameId: gameId,
        clueId: randomClue._id,
        clue: randomClue,
        userId: turn.userId,
        correct: null,
        lockedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Figure out whether this is the first card
    const userCards = Cards.find({gameId: gameId, userId: turn.userId}).fetch();
    const firstCard = (userCards.length == 0);

    // If it's the first card, automatically mark it correct
    if (firstCard) {
        card.correct = true;
        card.pos = 0;
        card.lockedAt = new Date();
    }

    // Add the card
    let cardId = Cards.insert(card);

    // If it's the first card, draw another
    if (firstCard) {
        return drawCard(gameId, turnId);
    } else {
        return cardId;
    }

}