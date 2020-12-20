import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { LoadingState } from "./LoadingState";

import { Games } from "../api/Games";
import { Turns } from "../api/Turns";
import { Cards } from "../api/Cards";
import { Clues } from "../api/Clues";

GameObserver = {

    observe(ctx, anonymous = false) {

        Games.find().observeChanges({

            // If a new game was added less than 2 seconds ago, this is probably a replay; let's notify the user
            added(id, fields) {
                if (ctx.initialized && (fields.ownerId != Meteor.userId())) {
                    const secondsSinceCreate = (new Date() - fields.createdAt) / 1000;
                    if (secondsSinceCreate < 2) {
                        setTimeout(function() {
                            if (Helpers.currentGameId() == id) {
                                Flasher.success('The game owner invited you to a new game!');
                                FlowRouter.go('game', {id: id});
                            }
                        }, 250);
                    }
                }
            },

            changed(id, fields) {
                if (ctx.initialized && (id == GameObserver.getId(ctx, anonymous))) {

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

                    // Or if the owner was changed to current player, notify them
                    } else if (fields.ownerId && (fields.ownerId == Meteor.userId())) {
                        const game = Games.findOne(id);
                        Flasher.info(
                            'You are now the new owner of a game: ' +
                            '<a href="' + FlowRouter.path('game', {id: id}) + '">' + game.title() + '</a>.',
                            false
                        );
                    }

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
                            if (joinedPlayer && (joinedPlayer._id != Meteor.userId())) {
                                Flasher.info(joinedPlayer.name() + ' has joined the game.');
                            }
                        } else if (previous.players.length > current.players.length) {
                            const userId = _.difference(previous.players, current.players)[0];
                            const leftPlayer = Meteor.users.findOne(userId);
                            if (leftPlayer && (userId != Meteor.userId())) {
                                Flasher.info((leftPlayer ? leftPlayer.name() : 'Player') + ' has left the game.');
                            }
                        }

                    }

                }
            },

        });

        Turns.find().observeChanges({

            added: function(turnId, fields) {
                if (ctx.initialized) {
                    const turn = Turns.findOne(turnId);
                    if (turn.ownerId == Meteor.userId()) {
                        SoundManager.play('turnStart');
                        if (
                            (FlowRouter.getRouteName() != 'game') ||
                            (FlowRouter.getParam('id') != fields.gameId)
                        ) {
                            const game = Games.findOne(fields.gameId);
                            if (game) {
                                Flasher.info(
                                    'It\'s your turn in game: ' +
                                    '<a href="' + FlowRouter.path('game', {id: fields.gameId}) + '">' + game.title() + '</a>!',
                                    false
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

                            // If auto-proceed is off and auto show more is on, show the More Info modal
                            if (ctx.game.get() && !ctx.game.get().autoProceed && ctx.game.get().autoShowMore) {
                                ctx.clueMore.set(Cards.findOne(cardId).clue());
                                if (ctx.clueMore.get() && ctx.clueMore.get().hasMoreInfo()) {
                                    $('#clueMore').modal('show');
                                }
                            }

                        } else {
                            throw new Meteor.Error('clue-not-received', 'Could not get a card.', err);
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