import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Match, check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Rooms } from './Rooms';
import { Turns } from './Turns';
import {Cards} from "./Cards";
import {Promise} from "meteor/promise";

export const Games = new Mongo.Collection('games');

Games.schema = new SimpleSchema({
    roomId: {type: String, regEx: SimpleSchema.RegEx.Id},
    categoryId: {type: String, regEx: SimpleSchema.RegEx.Id},
    currentTurnId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    winnerId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    winPoints: {type: SimpleSchema.Integer, defaultValue: 0},
    equalTurns: {type: Boolean, defaultValue: false},
    minDifficulty: {type: Number, defaultValue: 0},
    maxDifficulty: {type: Number, defaultValue: 0},
    minScore: {type: SimpleSchema.Integer, defaultValue: 0},
    cardLimit: {type: SimpleSchema.Integer, defaultValue: 0},
    cardTime: {type: SimpleSchema.Integer, defaultValue: 0},
    turnOrder: {type: String, defaultValue: 'sequential'},
    recycleCards: {type: Boolean, defaultValue: false},
});
Games.schema.extend(Schemas.timestampable);
Games.schema.extend(Schemas.endable);
Games.schema.extend(Schemas.softDeletable);
Games.attachSchema(Games.schema);

Games.helpers({

    room() {
        return Rooms.findOne(this.roomId);
    },

    category() {
        return Categories.findOne(this.categoryId);
    },

    currentTurn() {
        return Turns.findOne(this.currentTurnId);
    },

    turns() {
        return Turns.find({gameId: this._id});
    },

    winner() {
        return Meteor.users.findOne(this.winnerId);
    },

    playerCards(userId, lockedOnly = false) {
        let selector = {
            gameId: this._id,
            ownerId: userId,
        };
        if (lockedOnly) {
            selector.lockedAt = {$ne: null};
        } else {
            selector.$or = [
                {lockedAt: {$ne: null}},
                {turnId: this.currentTurnId},
            ];
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

    playersWithCounts() {
        const userIds = Meteor.users.find({currentRoomId: this.roomId}).map(function(i) { return i._id; });
        const players = Promise.await(
            Cards.rawCollection().aggregate(
                [
                    {
                        $match: {
                            gameId: this._id,
                            ownerId: {$in: userIds},
                        }
                    },
                    {
                        $group: {
                            _id: "$ownerId",
                            lastCardTime: {$max: "$createdAt"},
                            lockedCards: {$addToSet: "$lockedAt"},
                            uniqueTurns: {$addToSet: "$turnId"},
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            lastCardTime: 1,
                            turns: {$size:"$uniqueTurns"},
                            cards: {
                                $size: {
                                    $filter: {
                                        input: "$lockedCards",
                                        as: "item",
                                        cond: {$ne: ["$$item", null]}
                                    }
                                }
                            }
                        }
                    },
                    {
                        $sort: {
                            cards: -1,
                            lastCardTime: 1,
                        }
                    },
                ]
            ).toArray()
        );
        return players;
    },

});

if (Meteor.isServer) {

    Meteor.publish('games', function gamePublication(roomId) {
        if (this.userId && roomId) {
            return Games.find(
                {
                    roomId: roomId,
                },
                {
                    fields: {
                        _id: 1,
                        roomId: 1,
                        categoryId: 1,
                        currentTurnId: 1,
                        winnerId: 1,
                        cardLimit: 1,
                        startedAt: 1,
                        endedAt: 1,
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

    Games.deny({
        insert() { return true; },
        remove() { return true; },
    });

}

Meteor.methods({

    // Update
    'game.setTurn'(id, turnId) {

        check(id, RecordId);
        if (turnId) {
            check(turnId, RecordId);
        }
        Permissions.check(Permissions.authenticated());
        checkPlayerIsInRoom(id);

        Logger.log('Update Game Turn: ' + id + ': ' + turnId);

        // If there is an ID, this is an update
        return Games.update(
            id,
            {
                $set: {
                    currentTurnId: turnId,
                }
            }
        );

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Insert
        'game.create'(attrs) {

            check(
                attrs,
                {
                    roomId: RecordId,
                    categoryId: RecordId,
                    winPoints: Match.Integer,
                    equalTurns: Boolean,
                    minDifficulty: Number,
                    maxDifficulty: Number,
                    minScore: Match.Integer,
                    cardLimit: Match.Integer,
                    cardTime: Match.Integer,
                    turnOrder: String,
                    recycleCards: Boolean,
                }
            );
            Permissions.check(Permissions.authenticated());

            // Set the room
            const room = Rooms.findOne(attrs.roomId);
            Permissions.check(Permissions.owned(room));

            Logger.log('Create Game: ' + JSON.stringify(attrs));

            // Create the new game
            const gameId = Games.insert({
                roomId: attrs.roomId,
                categoryId: attrs.categoryId,
                winPoints: attrs.winPoints,
                equalTurns: attrs.equalTurns,
                minDifficulty: attrs.minDifficulty,
                maxDifficulty: attrs.maxDifficulty,
                minScore: attrs.minScore,
                cardLimit: attrs.cardLimit,
                cardTime: attrs.cardTime,
                turnOrder: attrs.turnOrder,
                recycleCards: attrs.recycleCards,
            });

            Meteor.call('room.setGame', attrs.roomId, gameId, function(err, updated) {
                if (!err) {
                    Logger.log("Updated Room: " + updated);
                }
            });

            Meteor.call('turn.next', gameId, function(err, id) {
                if (!err) {
                    Logger.log("First Turn: " + id);
                }
            });

            return gameId;

        },

        // End
        'game.end'(id, abandon = false) {

            check(id, RecordId);
            Permissions.check(Permissions.authenticated());
            checkPlayerIsInRoom(id);
            const game = Games.findOne(id);
            Permissions.check((id == game.room().currentGameId));

            // Initialize game end attributes
            let attrs = {
                endedAt: new Date(),
                currentTurnId: null,
            }

            // Treat the game as deleted if it is being abandoned
            if (abandon) {
                attrs.deletedAt = new Date();

            // Only award a win if there were actually any turns and someone met the criteria
            } else if (game.currentTurnId) {
                const players = game.playersWithCounts();
                const winner = players[0];
                if (!game.winPoints || (winner.cards >= game.winPoints)) {
                    attrs.winnerId = winner._id;
                }
            }

            // Update the game
            const updated = Games.update(
                id,
                {
                    $set: attrs,
                }
            );

            // If the game was abandoned, null out the room's current game
            if (abandon) {
                Meteor.call('game.setTurn', game._id, null, function(err, updated) {
                    if (!err) {
                        Logger.log("Updated Game: " + updated);
                    }
                });
                Meteor.call('room.setGame', game.roomId, null, function(err, updated) {
                    if (!err) {
                        Logger.log("Updated Room: " + updated);
                    }
                });
            }

            return updated;

        },

    });

}

function checkPlayerIsInRoom(gameId) {
    const roomPlayers = Helpers.getIds(Games.findOne(gameId).room().players());
    Permissions.check(roomPlayers.includes(Meteor.userId()));
}