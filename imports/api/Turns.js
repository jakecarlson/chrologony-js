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

        Logger.log('Update Turn ' + id + ' Card: ' + cardId);

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
            if (game.currentTurnId) {
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
            let endGame = false;
            if (turn && game.winPoints) {

                // If we need to have equal turns, find out if anyone has won and if everyone has had equal turns
                if (game.equalTurns) {
                    const leader = game.calculateCurrentLeader();
                    if (leader.cards >= game.winPoints) {
                        let equalTurns = true;
                        players.forEach(function(player) {
                            if (player.turns < leader.turns) {
                                equalTurns = false;
                                return;
                            }
                        });
                        endGame = equalTurns;
                    }

                // Otherwise end the game if the current player has enough cards
                } else {
                    const numLockedCards = game.playerCards(turn.ownerId, true).count();
                    endGame = (numLockedCards >= game.winPoints);
                }

                // End the game if the conditions are met
                if (endGame) {
                    Meteor.call('game.end', game._id, false, function(err, updated) {
                        if (!err) {
                            Logger.log("Ended Game: " + game._id);
                        }
                    });
                }

            // If the game already ended, don't try to end it again
            } else if (game.endedAt) {
                endGame = true;
            }

            // If not short-circuited by game end, continue on to start the next turn ...
            if (!endGame) {

                const nextPlayer = game.getNextPlayer();

                Logger.log("Next Turn Belongs To: " + nextPlayer._id);
                const turnId = Turns.insert({
                    gameId: gameId,
                    ownerId: nextPlayer._id,
                    startedAt: new Date(),
                });

                const leader = game.calculateCurrentLeader();
                const attrs = {
                    currentTurnId: turnId,
                    currentRound: game.calculateCurrentRound(),
                    currentLeaderId: (leader ? leader._id : null),
                };
                Meteor.call('game.update', gameId, attrs, function(err, updated) {
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

            }

            return null;

        },

    });

}