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

    hasReachedCardLimit() {
        const game = this.game();
        return ((game.cardLimit > 0) && (this.cards().count() >= game.cardLimit));
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
        Permissions.check(Permissions.authenticated());
        if (cardId) {
            Permissions.check((Turns.findOne(id).ownerId == Cards.findOne(cardId).ownerId));
        }

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
            Permissions.check(Permissions.authenticated());

            // Check that the user is allowed
            const game = Games.findOne(gameId);
            const turn = game.currentTurn();
            Permissions.check((
                Permissions.owned(game.room()) ||
                (turn && Permissions.owned(turn))
            ));

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

            // If a win condition is defined, see if we've met it
            if (game.winPoints) {
                const numLockedCards = game.playerCards(turn.ownerId, true).count();
                if (numLockedCards >= game.winPoints) {

                    Meteor.call('game.end', game._id, function(err, updated) {
                        if (!err) {
                            Logger.log("Ended Game: " + game._id);
                        }
                    });

                    // Short circuit with game end
                    return null;

                }
            }

            // If not short-circuited by game end, continue on to start the next turn ...

            // Get players sorted by turn count descending
            const players = getPlayerTurnCounts(game);
            Logger.log('Player Turn Counts: ' + JSON.stringify(players));

            // If the turn order is random, randomly select one of the players with the fewest turns
            let nextPlayer = null;
            if (game.turnOrder == 'random') {
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

            Logger.log("Next Turn Belongs To: " + nextPlayer._id);
            const turnId = Turns.insert({
                gameId: gameId,
                ownerId: nextPlayer._id,
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

function getPlayerTurnCounts(game) {

    // Create an array of user IDs of players currently in the room
    let playerPool = [];
    game.room().players().forEach(function(user) {
        playerPool.push(user._id);
    });

    // Get turn counts for players who have had turns in the current game and are still in the room
    let sort = {
        turns: -1,
    };
    if (game.turnOrder != 'random') {
        sort.lastTurn = (game.turnOrder == 'snake') ? 1 : -1;
    }

    const players = Promise.await(
        Turns.rawCollection().aggregate(
            [
                {$match: {gameId: game._id, ownerId: {$in: playerPool}}},
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
            currentRoomId: game.roomId,
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

}