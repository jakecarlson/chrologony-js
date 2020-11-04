import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Match, check } from 'meteor/check';
import { Promise } from "meteor/promise";
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Rooms } from './Rooms';
import { Turns } from './Turns';
import { Cards } from "./Cards";

export const Games = new Mongo.Collection('games');

Games.PRECISION_OPTIONS = [
    'second',
    'minute',
    'hour',
    'date',
    'month',
    'year',
    'decade',
    'century',
    'millennium',
];

Games.schema = new SimpleSchema({
    roomId: {type: String, max: 17},
    categoryId: {type: String, regEx: SimpleSchema.RegEx.Id},
    currentTurnId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    currentRound: {type: Number, defaultValue: 1},
    currentLeaderId: {type: String, max: 17, defaultValue: null, optional: true},
    winnerId: {type: String, max: 17, defaultValue: null, optional: true},
    winPoints: {type: SimpleSchema.Integer, defaultValue: 10},
    equalTurns: {type: Boolean, defaultValue: false},
    minDifficulty: {type: Number, defaultValue: 0},
    maxDifficulty: {type: Number, defaultValue: 0},
    minScore: {type: SimpleSchema.Integer, defaultValue: 0},
    cardLimit: {type: SimpleSchema.Integer, defaultValue: 0},
    autoProceed: {type: Boolean, defaultValue: false},
    cardTime: {type: SimpleSchema.Integer, defaultValue: 0},
    turnOrder: {type: String, defaultValue: 'sequential'},
    recycleCards: {type: Boolean, defaultValue: false},
    showHints: {type: Boolean, defaultValue: false},
    displayPrecision: {type: String, defaultValue: 'date'},
    comparisonPrecision: {type: String, defaultValue: 'date'},
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

    currentLeader() {
        return (this.currentLeaderId ? Meteor.users.findOne(this.currentLeaderId) : null);
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

    calculateCurrentLeader() {
        const players = this.playersWithCounts();
        return players[0];
    },

    calculateCurrentRound() {
        const players = this.getPlayerTurnCounts();
        return players[0].turns;
    },

    getPlayerTurnCounts() {

        // Create an array of user IDs of players currently in the room
        let playerPool = [];
        this.room().players().forEach(function(user) {
            playerPool.push(user._id);
        });

        // Get turn counts for players who have had turns in the current game and are still in the room
        let sort = {
            turns: -1,
        };
        if (this.turnOrder != 'random') {
            sort.lastTurn = (this.turnOrder == 'snake') ? 1 : -1;
        }

        const players = Promise.await(
            Turns.rawCollection().aggregate(
                [
                    {$match: {gameId: this._id, ownerId: {$in: playerPool}}},
                    {$group: {_id: "$ownerId", turns: {$sum: 1}, lastTurn: {$max: "$createdAt"}}},
                    {$sort: sort},
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
                currentRoomId: this.roomId,
                _id: {$nin: alreadyPlayed},
            },
            {
                sort: {
                    joinedRoomAt: -1,
                }
            }
        ).fetch();
        users.forEach(function(user) {
            players.push({
                _id: user._id,
                turns: 0,
                lastTurn: null,
            });
        });

        return players;

    },

    getNextPlayer() {

        // Get players sorted by turn count descending
        const players = this.getPlayerTurnCounts();
        Logger.log('Player Turn Counts: ' + JSON.stringify(players));

        // If the turn order is random, randomly select one of the players with the fewest turns
        let nextPlayer = null;
        if (this.turnOrder == 'random') {
            let leastTurnPlayers = [];
            const lastIndex = players.length-1;
            const minTurns = players[players.length-1].turns;
            for (let i = lastIndex; i >= 0; --i) {
                if (players[i].turns != minTurns) break;
                leastTurnPlayers.push(players[i]);
            }
            nextPlayer = leastTurnPlayers[Math.floor(Math.random() * leastTurnPlayers.length)];

            // Otherwise just pluck the bottom player
        } else {
            nextPlayer = players[players.length-1];
        }

        return nextPlayer;

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
                        currentRound: 1,
                        currentLeaderId: 1,
                        winnerId: 1,
                        startedAt: 1,
                        endedAt: 1,
                        winPoints: 1,
                        turnOrder: 1,
                        minScore: 1,
                        minDifficulty: 1,
                        maxDifficulty: 1,
                        equalTurns: 1,
                        recycleCards: 1,
                        cardLimit: 1,
                        autoProceed: 1,
                        cardTime: 1,
                        showHints: 1,
                        comparisonPrecision: 1,
                        displayPrecision: 1,
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
    'game.update'(id, attrs) {

        check(id, RecordId);
        check(
            attrs,
            {
                currentTurnId: RecordId,
                currentRound: Match.Integer,
                currentLeaderId: Match.OneOf(String, null),
            }
        );

        Permissions.authenticated()
        checkPlayerIsInRoom(id);
        Logger.log('Update Game: ' + id + ': ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Games.update(id, {$set: attrs});

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Insert
        'game.create'(attrs) {

            check(
                attrs,
                {
                    roomId: String,
                    categoryId: RecordId,
                    winPoints: Match.Integer,
                    equalTurns: Boolean,
                    minDifficulty: Match.Integer,
                    maxDifficulty: Match.Integer,
                    minScore: Match.Integer,
                    cardLimit: Match.Integer,
                    autoProceed: Boolean,
                    cardTime: Match.Integer,
                    turnOrder: NonEmptyString,
                    recycleCards: Boolean,
                    showHints: Boolean,
                    comparisonPrecision: NonEmptyString,
                    displayPrecision: NonEmptyString,
                }
            );
            Permissions.authenticated()

            // Set the room
            const room = Rooms.findOne(attrs.roomId);
            Permissions.owned(room);

            // Check the precision values
            Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.comparisonPrecision));
            Permissions.check(Games.PRECISION_OPTIONS.includes(attrs.displayPrecision));

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
                autoProceed: attrs.autoProceed,
                cardTime: attrs.cardTime,
                turnOrder: attrs.turnOrder,
                recycleCards: attrs.recycleCards,
                showHints: attrs.showHints,
                comparisonPrecision: attrs.comparisonPrecision,
                displayPrecision: attrs.displayPrecision,
            });

            Logger.audit('start', {collection: 'Games', documentId: gameId});

            if (!Helpers.isAnonymous()) {
                Meteor.call('room.setGame', attrs.roomId, gameId, function(err, updated) {
                    if (!err) {
                        Logger.log("Updated Room: " + updated);
                    }
                });
            }


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
            Permissions.authenticated()
            checkPlayerIsInRoom(id);
            const game = Games.findOne(id);
            if (!Helpers.isAnonymous()) {
                Permissions.check((id == game.room().currentGameId));
            }

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
                const winner = game.calculateCurrentLeader();
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

            Logger.log('End Game: ' + id);
            Logger.audit((abandon ? 'abandon' : 'end'), {collection: 'Games', documentId: id});

            // If the game was abandoned, null out the room's current game
            if (abandon) {
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