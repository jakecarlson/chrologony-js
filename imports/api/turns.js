import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Promise } from 'meteor/promise';
import { NonEmptyString } from "../startup/validations";

import { Games } from '../api/games';
import { Cards } from '../api/cards';

export const Turns = new Mongo.Collection('turns');

if (Meteor.isServer) {
    Meteor.publish('turns', function turnPublication(gameId) {
        if (this.userId && gameId) {
            return Turns.find({gameId: gameId}, {sort: {createdAt: -1}, limit: 2});
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

    // Update
    'turn.update'(attrs) {

        check(attrs._id, NonEmptyString);
        // check(attrs.currentCardId, Match.Maybe(String)); // This must be a bug with Meteor; it always fails
        // check(attrs.lastCardCorrect, Match.Maybe(Boolean)); // ditto

        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Update Turn: ' + attrs._id + ' ' + JSON.stringify(attrs));

        return Turns.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    currentCardId: attrs.currentCardId,
                    lastCardCorrect: attrs.lastCardCorrect,
                    updatedAt: new Date(),
                }
            }
        );

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Next Turn
        'turn.end'(gameId) {

            check(gameId, NonEmptyString);

            // Make sure the user is logged in
            if (! Meteor.userId()) {
                throw new Meteor.Error('not-authorized');
            }

            // Set the game
            const game = Games.findOne(gameId);

            // End the current turn
            if (game.currentTurnId) {
                let updated = Turns.update(
                    {
                        _id: game.currentTurnId
                    },
                    {
                        $set: {
                            endedAt: new Date(),
                            updatedAt: new Date(),
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
            const turnCards = Cards.find({turnId: game.currentTurnId});
            const correctCards = Cards.find({turnId: game.currentTurnId, correct: true});
            if (turnCards.count() === correctCards.count()) {
                correctCards.forEach(function(card) {
                    Meteor.call('card.lock', card._id, function(error, updated) {
                        if (!error) {
                            Logger.log("Locked Card: " + updated);
                        }
                    });
                });
            }

            // Create an array of user IDs of players currently in the room
            const roomUsers = Meteor.users.find({currentRoomId: game.roomId}).fetch();
            let playerPool = [];
            roomUsers.forEach(function(user) {
                playerPool.push(user._id);
            });

            // Get turn counts for players who have had turns in the current game and are still in the room
            const sorts = [-1, 1];
            const randomSort = sorts[Math.floor(Math.random() * sorts.length)];
            const players = Promise.await(
                Turns.rawCollection().aggregate(
                    [
                        {$match: {gameId: gameId, userId: {$in: playerPool}}},
                        {$group: {_id: "$userId", turns: {$sum: 1}, lastTurn: {$max: "$createdAt"}}},
                        {$sort: {turns: -1, lastTurn: -1, userId: randomSort}}
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
                    $sort: {
                        userId: -1,
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
                userId: lastPlayer._id,
                currentCardId: null,
                startedAt: new Date(),
                endedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            console.log(turnId);

            Meteor.call('game.update', {_id: gameId, currentTurnId: turnId}, function(error, updated) {
                if (!error) {
                    Logger.log("Updated Game: " + updated);
                }
            });

            Meteor.call('card.draw', {turnId: turnId, gameId: gameId}, function(error, id) {
                if (!error) {
                    Logger.log("Created Card: " + id);
                }
            });

            return turnId;

        },

    });

}