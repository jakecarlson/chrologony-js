import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { Promise } from 'meteor/promise';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from './Permissions';
import SimpleSchema from "simpl-schema";
import { Schema } from "./Schema";

import { Games } from '../api/games';
import { Cards } from '../api/cards';

export const Turns = new Mongo.Collection('turns');

Turns.schema = new SimpleSchema({
    gameId: {type: String, regEx: SimpleSchema.RegEx.Id},
    userId: {type: String, regEx: SimpleSchema.RegEx.Id},
    currentCardId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    lastCardCorrect: {type: Boolean, defaultValue: null, optional: true},
});
Turns.schema.extend(Schema.timestamps);
Turns.attachSchema(Turns.schema);

if (Meteor.isServer) {

    Meteor.publish('turns', function turnPublication(gameId) {
        if (this.userId && gameId) {
            return Turns.find({gameId: gameId}, {sort: {createdAt: -1}, limit: 2});
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
                let updated = Turns.update(
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
                        {$sort: {turns: -1, lastTurn: 1, userId: randomSort}}
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
                startedAt: new Date(),
            });

            Meteor.call('game.setTurn', gameId, turnId, function(error, updated) {
                if (!error) {
                    Logger.log("Updated Game: " + updated);
                }
            });

            Meteor.call('card.draw', turnId, function(error, id) {
                if (!error) {
                    Logger.log("Created Card: " + id);
                }
            });

            return turnId;

        },

    });

}