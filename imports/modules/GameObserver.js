import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { LoadingState } from "./LoadingState";

import { Games } from "../api/Games";
import { Turns } from "../api/Turns";
import { Cards } from "../api/Cards";
import { Clues } from "../api/Clues";
import {FlowRouter} from "meteor/ostrio:flow-router-extra";

GameObserver = {

    observe(ctx, anonymous = false) {

        Games.find().observeChanges({

            added(id, fields) {
                if (ctx.initialized && (fields.ownerId != Meteor.userId())) {
                    setTimeout(function() {
                        if (Helpers.currentGameId() == id) {
                            Flasher.set('success', 'The game owner invited you to a new game!');
                            FlowRouter.go('game', {id: id});
                        }
                    }, 100);
                }
            },

        });

        Games.find({_id: GameObserver.getId(ctx, anonymous)}).observe({

            changed(current, previous) {
                if (ctx.initialized) {

                    // If the players in the game changed, notify user
                    if (current.players.length != previous.players.length) {
                        if (current.players.length > previous.players.length) {
                            const userId = _.difference(current.players, previous.players)[0];
                            const joinedPlayer = Meteor.users.findOne(userId);
                            if (joinedPlayer._id != Meteor.userId()) {
                                Flasher.set('warning', joinedPlayer.name() + ' has joined the game.');
                            }
                        } else if (previous.players.length > current.players.length) {
                            const userId = _.difference(previous.players, current.players)[0];
                            const leftPlayer = Meteor.users.findOne(userId);
                            if (userId != Meteor.userId()) {
                                Flasher.set('warning', (leftPlayer ? leftPlayer.name() : 'Player') + ' has left the game.');
                            }
                        }

                    }

                }
            },

        });

        Games.find({_id: GameObserver.getId(ctx, anonymous)}).observeChanges({

            changed(id, fields) {
                if (ctx.initialized) {

                    // If the game is started, play game start sound
                    if (fields.startedAt) {
                        SoundManager.play('gameStart');

                        // If the game is ended, play appropriate game end sound
                    } else if (fields.endedAt) {
                        if (fields.winnerId == Meteor.userId()) {
                            SoundManager.play('gameWin');
                        } else {
                            SoundManager.play('gameLose');
                        }
                    }

                }
            },

        });

        Turns.find().observeChanges({

            added: function(turnId, fields) {
                if (ctx.initialized) {
                    const turn = Turns.findOne(turnId);
                    ctx.turn.set(turn);
                    if (turn.ownerId == Meteor.userId()) {
                        SoundManager.play('turnStart');
                        if (
                            (FlowRouter.getRouteName() != 'game') ||
                            (FlowRouter.getParam('id') != fields.gameId)
                        ) {
                            const game = Games.findOne(fields.gameId);
                            if (game) {
                                Flasher.set(
                                    'warning',
                                    'It\'s your turn in game: <a href="' +
                                    FlowRouter.path('game', {id: fields.gameId}) + '">' +
                                    game.title() + '</a>!',
                                    10000
                                );
                            }
                        }
                    }
                }
            },

            changed(turnId, fields) {
                if (ctx.initialized && (fields.endedAt != null)) {
                    SoundManager.play('turnEnd');
                }
            },

        });

        Cards.find().observeChanges({

            added: function(cardId, fields) {
                if (ctx.initialized) {
                    Helpers.subscribe(Meteor, 'cards', GameObserver.getId(ctx, anonymous));
                    Helpers.subscribe(Meteor, 'cardClues', GameObserver.getId(ctx, anonymous));
                    SoundManager.play('cardDraw');
                    if (fields.ownerId == Meteor.userId()) {
                        $('.player-cards-wrapper').animate({
                            scrollLeft: 0
                        }, 250);
                    }
                }
            },

            changed(cardId, fields) {
                if (ctx.initialized && (fields.correct != null)) {
                    const card = Cards.findOne(cardId);
                    Meteor.call('clue.get', card.clueId, function(err, clue) {
                        if (!err) {
                            Logger.log("Update Clue Data: " + card.clueId);
                            const updated = Clues._collection.update(card.clueId, {$set: clue});
                            if (!updated) {
                                throw new Meteor.Error('clue-not-updated', '[client] Could not update a clue.');
                            }
                            if (card.correct) {
                                SoundManager.play('cardRight');
                            } else {
                                SoundManager.play('cardWrong');
                            }
                        } else {
                            throw new Meteor.Error('clue-not-received', 'Could not get a card.', JSON.stringify(err));
                        }
                        Session.set('waiting', false);
                        LoadingState.stop();
                    });
                }
            },

        });

    },

    getId(ctx, anonymous = false) {
        if (anonymous) {
            return Session.get('currentGameId');
        } else if (ctx.game.get()) {
            return ctx.game.get()._id;
        }
        return null;
    },

}