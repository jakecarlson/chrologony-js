import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Promise } from 'meteor/promise';

import { Games } from '../api/games';
import { Cards } from '../api/cards';

export const Turns = new Mongo.Collection('turns');

if (Meteor.isServer) {
    Meteor.publish('turns', function turnsPublication(gameId) {
        if (this.userId && gameId) {
            return Turns.find({gameId: gameId});
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

    // Next Turn
    'turn.next'(gameId) {

        check(gameId, String);

        // Make sure the user is logged in
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Lock all current turn cards
        const game = Games.findOne(gameId);
        const turnCards = Cards.find({turnId: game.currentTurnId});
        const correctCards = Cards.find({turnId: game.currentTurnId, correct: true});
        if (turnCards.count() === correctCards.count()) {
            correctCards.forEach(function(card) {
                Meteor.call('card.lock', card._id, function(error, updated) {
                    if (!error) {
                        console.log("Locked Card: " + updated);
                    }
                });
            });
        }

        // Find the player in this room with the least amount of turns for this game
        if (Meteor.isServer) {

            // Get turn counts for players who have had turns in the current game
            const sorts = [-1, 1];
            const randomSort = sorts[Math.floor(Math.random() * sorts.length)];
            const players = Promise.await(
                Turns.rawCollection().aggregate(
                    [
                        {$match: {gameId: gameId}},
                        {$group: {_id: "$userId", turns: {$sum: 1}, lastTurn: {$max: "$createdAt"}}},
                        {$sort: {turns: -1, lastTurn: -1, userId: randomSort}}
                    ]
                ).toArray()
            );
            // console.log(players);

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
            console.log("Player Turn Counts:");
            console.log(players);

            const lastPlayer = players[players.length-1];
            console.log("Next Turn Belongs To: " + lastPlayer._id);
            const turnId = Turns.insert({
                gameId: gameId,
                userId: lastPlayer._id,
                currentCardId: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            Meteor.call('game.update', {_id: gameId, currentTurnId: turnId}, function(error, updated) {
                if (!error) {
                    console.log("Updated Game: " + updated);
                }
            });

            Meteor.call('card.draw', {turnId: turnId, gameId: gameId}, function(error, id) {
                if (!error) {
                    console.log("Created Card: " + id);
                }
            });

            return turnId;

        }

    },

    // Update
    'turn.update'(attrs) {

        check(attrs._id, String);
        // check(attrs.currentCardId, Match.Maybe(String)); // This must be a bug with Meteor; it always fails
        // check(attrs.lastCardCorrect, Match.Maybe(Boolean)); // ditto

        // Make sure the user is logged in before inserting a task
        if (!Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Update Turn: ' + attrs._id);
        console.log(attrs);

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