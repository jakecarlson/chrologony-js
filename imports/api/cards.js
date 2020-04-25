import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Games } from "./games";
import { Clues } from "./clues";
import {Turns} from "./turns";

export const Cards = new Mongo.Collection('cards');

if (Meteor.isServer) {

    Meteor.publish('cards', function cardsPublication(gameId) {
        if (this.userId && gameId) {
            return Cards.find({gameId: gameId});
            /*
            if (game) {
                let selector = {
                    gameId: game._id,
                };
                if (game.currentTurnId) {
                    selector.$or = [
                        {turnId: turnId},
                        {lockedAt: {$ne: null}}
                    ];
                } else {
                    selector.lockedAt = {$ne: null};
                }
                return Cards.find(selector);
            } else {
                return [];
            }
            */
        } else {
            return this.ready();
        }
    });

}

Meteor.methods({

    // Draw Card
    'card.draw'(attrs) {

        check(attrs.turnId, String);
        check(attrs.gameId, String);

        // Make sure the user is logged in
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Get a random card that hasn't been drawn this game
        let game = Games.findOne(attrs.gameId);
        let lockedCards = Cards.find({gameId: attrs.gameId, lockedAt: {$ne: null}}).map(function(i) { return i.clueId; });
        let turnCards = Cards.find({turnId: attrs.turnId}).map(function(i) { return i.clueId; });
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
        // let unlockedClue = Clues.findOne(selector/*, {sort: {_id:Random.choice([1,-1])}}*/);
        let randomClue = Clues.findOne(selector);

        // Set the card doc
        let card = {
            turnId: attrs.turnId,
            gameId: attrs.gameId,
            clueId: randomClue._id,
            clue: randomClue,
            userId: this.userId,
            correct: null,
            lockedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        // Figure out whether this is the first card
        const userCards = Cards.find({gameId: attrs.gameId, userId: this.userId}).fetch();
        const firstCard = (userCards.length == 0);

        // If it's the first card, automatically mark it correct
        if (firstCard) {
            card.correct = true;
            card.lockedAt = new Date();
        }

        // Add the card
        let cardId = Cards.insert(card);

        if (firstCard) {
            Meteor.call('card.draw', attrs, function(error, id) {
                if (!error) {
                    console.log("Created Card: " + id);
                }
            });
        } else {
            console.log("UPDATE TURN");
            console.log(attrs.turnId);
            console.log(cardId);
            Meteor.call('turn.update', {_id: attrs.turnId, currentCardId: cardId}, function(error, updated) {
                if (!error) {
                    console.log("Updated Turn: " + updated);
                }
            });
        }

        return cardId;

    },

    // Lock
    'card.lock'(id) {

        check(id, String);

        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
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
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Get the previously correct cards + the current card in the correct order
        let card = Cards.find(
            {
                gameId: args.gameId,
                /*$or: [
                    {correct: true},
                    {_id: args.cardId},
                ],*/
            },
            {
                sort: {
                    'clue.date': 1,
                },
                skip: args.pos,
                limit: 1,
            }
        ).fetch()[0];
        console.log(card);

        // Validate that the card is in the correct position
        let correct = (args.cardId === card._id);

        console.log("Card Guess Correct: " + correct.toString());

        // Null out the current card ID
        Meteor.call('turn.update', {_id: args.turnId, currentTurnId: null}, function(error, updated) {
            if (!error) {
                console.log("Updated Turn: " + updated);
            }
        });

        // Update the card
        return Cards.update(
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

    },

});