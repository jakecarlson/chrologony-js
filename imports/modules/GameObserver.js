import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { LoadingState } from "./LoadingState";

import { Games } from "../api/Games";
import { Turns } from "../api/Turns";
import { Cards } from "../api/Cards";
import { Clues } from "../api/Clues";

GameObserver = {

    observe(ctx, anonymous = false) {

        Games.find().observeChanges({

            added: function(gameId, fields) {
                if (ctx.initialized) {
                    ctx.game.set(Games.findOne(gameId));
                    SoundManager.play('gameStart');
                }
            },

            changed(gameId, fields) {
                if (ctx.initialized && (fields.endedAt != null)) {
                    if (fields.winnerId == Meteor.userId()) {
                        SoundManager.play('gameWin');
                    } else {
                        SoundManager.play('gameLose');
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
                            Clues._collection.update(card.clueId, {$set: clue});
                            if (card.correct) {
                                SoundManager.play('cardRight');
                            } else {
                                SoundManager.play('cardWrong');
                            }
                        }
                        Session.set('waiting', false);
                        LoadingState.stop();
                    });
                }
            },

        });

    },

    getId(ctx, anonymous = false) {
        return (anonymous) ? Session.get('currentGameId') : ctx.room.get().currentGameId;
    },

}