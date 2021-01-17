import { Meteor } from 'meteor/meteor';
import { Promise } from "meteor/promise";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

import { Turns } from '../Turns';
import { Cards } from "../Cards";
import { Categories } from "../Categories";
import { Games } from "./index";

Games.helpers({

    title() {
        if (this.name) {
            return this.name;
        } else {
            const category = Categories.findOne(this.categoryId);
            if (category) {
                return category.name;
            }
        }
        return 'Unknown';
    },

    playersWithNames() {
        const userIds = this.players;
        let players = Meteor.users.find(
            {
                _id: {$in: userIds},
            },
            {
                sort: {'profile.name': 1},
            }
        ).fetch();
        return _.sortBy(players, function(doc) {
            return userIds.indexOf(doc._id);
        });
    },

    numPlayers() {
        return this.players.length;
    },

    hasPlayer(userId) {
        if (!userId) {
            userId = Meteor.userId();
        }
        return this.players.includes(userId);
    },

    isOwner(userId = false) {
        if (!userId) {
            userId = Meteor.userId();
        }
        return (userId == this.ownerId);
    },

    isTurnOwner(userId = false) {
        if (!userId) {
            userId = Meteor.userId();
        }
        if (this.currentTurnId) {
            const turn = this.currentTurn();
            return (turn && (userId == turn.ownerId));
        }
        return false;
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

    link() {
        return FlowRouter.url('game', {id: this._id, token: this.token});
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
        const players = Promise.await(
            Cards.rawCollection().aggregate(
                [
                    {
                        $match: {
                            gameId: this._id,
                            ownerId: {$in: this.players},
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

        // Get turn counts for players who have had turns in the current game and are still in the game
        let sort = {
            turns: -1,
        };
        if (this.turnOrder != 'random') {
            sort.lastTurn = (this.turnOrder == 'snake') ? 1 : -1;
        }

        const players = Promise.await(
            Turns.rawCollection().aggregate(
                [
                    {$match: {gameId: this._id, ownerId: {$in: this.players}}},
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

        // Get all players in the game that haven't had turns yet
        const notPlayed = _.difference(this.players, alreadyPlayed);
        if (notPlayed.length > 0) {
            const users = Meteor.users.find(
                {_id: {$in: notPlayed}},
                {sort: {joinedGameAt: -1}}
            ).fetch();
            const sortedUsers = _.sortBy(users, function(doc) {
                return notPlayed.indexOf(doc._id);
            });
            sortedUsers.forEach(function(user) {
                players.push({
                    _id: user._id,
                    turns: 0,
                    lastTurn: null,
                });
            });
        }

        return players;

    },

    getNextPlayer() {

        // Get players sorted by turn count descending
        Logger.log('Getting turn counts ...');
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