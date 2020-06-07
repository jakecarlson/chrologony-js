import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Promise } from 'meteor/promise';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Games } from './Games';
import { Cards } from './Cards';

export const Turns = new Mongo.Collection('turns');

Turns.schema = new SimpleSchema({
    gameId: {type: String, regEx: SimpleSchema.RegEx.Id},
    ownerId: {type: String, regEx: SimpleSchema.RegEx.Id, optional: true},
    owner: {type: String, regEx: SimpleSchema.RegEx.Id, optional: true},
    currentCardId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    lastCardCorrect: {type: Boolean, defaultValue: null, optional: true},
});
Turns.schema.extend(Schemas.timestampable);
Turns.schema.extend(Schemas.endable);
Turns.attachSchema(Turns.schema);

Turns.helpers({

    game() {
        return Games.findOne(this.gameId);
    },

    cards(correct = null) {
        let selector = {
            turnId: this._id,
        };
        if (correct !== null) {
            selector.correct = correct;
        }
        return Cards.find(
            selector,
            {
                sort: {
                    pos: 1,
                    createdAt: -1,
                }
            }
        );
    },

    currentCard() {
        return Cards.findOne(this.currentCardId);
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

});

if (Meteor.isServer) {

    Meteor.publish('turns', function turnPublication(gameId) {
        if (this.userId && gameId) {
            return Turns.find(
                {
                    gameId: gameId,
                },
                {
                    fields: {
                        _id: 1,
                        gameId: 1,
                        currentCardId: 1,
                        ownerId: 1,
                        lastCardCorrect: 1,
                    },
                    sort: {
                        createdAt: -1,
                    },
                    limit: 2,
                }
            );
        } else {
            return this.ready();
        }
    });

    Turns.deny({
        insert() { return true; },
        remove() { return true; },
    });

}

Meteor.methods({

    // Update
    'turn.setCard'(id, cardId, lastCardCorrect) {

        check(id, RecordId);
        check(cardId, Match.OneOf(null, RecordId));
        check(lastCardCorrect, Match.OneOf(null, Boolean));
        Permissions.authenticated();

        Logger.log('Update Turn ' + id + ' Card to ' + cardId);

        return Turns.update(
            id,
            {
                $set: {
                    currentCardId: cardId,
                    lastCardCorrect: lastCardCorrect,
                }
            }
        );

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Next Turn
        'turn.next'(gameId) {

            check(gameId, RecordId);
            Permissions.authenticated();

            // Set the game
            const game = Games.findOne(gameId);

            // End the current turn
            if (game.currentTurnId) {
                const updated = Turns.update(
                    game.currentTurnId,
                    {
                        $set: {
                            endedAt: new Date(),
                        }
                    }
                );
                if (updated) {
                    Logger.log('Ended Turn: ' + game.currentTurnId)
                } else {
                    Logger.log('Error Ending Turn: ' + game.currentTurnId, 3);
                }
            }

            // Lock all current turn cards
            if (game && game.currentTurnId) {
                const turn = game.currentTurn();
                const cards = turn.cards();
                const correctCards = turn.cards(true);
                if (cards.count() === correctCards.count()) {
                    correctCards.forEach(function(card) {
                        Meteor.call('card.lock', card._id, function(err, updated) {
                            if (!err) {
                                Logger.log("Locked Card: " + updated);
                            }
                        });
                    });
                }
            }

            // Create an array of user IDs of players currently in the room
            let playerPool = [];
            game.room().players().forEach(function(user) {
                playerPool.push(user._id);
            });

            // Get turn counts for players who have had turns in the current game and are still in the room
            const players = Promise.await(
                Turns.rawCollection().aggregate(
                    [
                        {$match: {gameId: gameId, ownerId: {$in: playerPool}}},
                        {$group: {_id: "$ownerId", turns: {$sum: 1}, lastTurn: {$max: "$createdAt"}}},
                        {$sort: {turns: -1, lastTurn: -1}}
                    ]
                ).toArray()
            );

            // Create an array of users who have already had turns
            const alreadyPlayed = [];
            players.forEach(function(player) {
                alreadyPlayed.push(player._id);
            });

            // Get all players in the room that haven't had turns yet
            const users = Meteor.users.find(
                {
                    currentRoomId: game.roomId,
                    _id: {$nin: alreadyPlayed},
                },
                {
                    sort: {
                        joinedRoomAt: 1,
                    }
                }
            ).fetch();
            users.forEach(function(user) {
                players.push({
                    _id: user._id,
                    turns: 0,
                });
            });

            // Sort the object by turn counts
            Logger.log('Player Turn Counts: ' + JSON.stringify(players));

            const lastPlayer = players[players.length-1];
            Logger.log("Next Turn Belongs To: " + lastPlayer._id);
            const turnId = Turns.insert({
                gameId: gameId,
                ownerId: lastPlayer._id,
                startedAt: new Date(),
            });

            Meteor.call('game.setTurn', gameId, turnId, function(err, updated) {
                if (!err) {
                    Logger.log("Updated Game: " + updated);
                }
            });

            Meteor.call('card.draw', turnId, function(err, id) {
                if (!err) {
                    Logger.log("Created Card: " + id);
                }
            });

            return turnId;

        },

    });

}