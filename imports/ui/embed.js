import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { LoadingState } from "../modules/LoadingState";

import './embed.html';
import './room/board.js';
import './room/clue_more.js';

import { Games } from "../api/Games";
import { Turns } from "../api/Turns";
import { Cards } from "../api/Cards";
import { Clues } from "../api/Clues";

Template.embed.onCreated(function embedOnCreated() {

    LoadingState.start();

    Meteor.call('user.anonymous', function(err, success) {
        Meteor.connection.setUserId('anonymous');
    });

    Session.set('muted', true);

    this.initialized = false;
    this.room = new ReactiveVar(null);
    this.game = new ReactiveVar(null);
    this.turn = new ReactiveVar(null);
    this.clueMore = new ReactiveVar(null);

    this.autorun((computation) => {

        LoadingState.start();

        this.subscribe('rooms', 'anonymous');

        const user = Meteor.user({fields: {currentRoomId: 1}});
        if (user) {

            const roomId = user.currentRoomId;

            this.room.set(user.currentRoom());
            if (this.room.get()) {

                subscribe(this, 'games', this.room.get()._id);

                if (Session.get('currentGameId')) {

                    subscribe(this, 'turns', Session.get('currentGameId'));
                    subscribe(this, 'cards', Session.get('currentGameId'));
                    subscribe(this, 'cardClues', Session.get('currentGameId'));

                    this.game.set(Games.findOne(Session.get('currentGameId')));
                    if (this.game.get() && this.game.get().currentTurnId) {
                        this.turn.set(Turns.findOne(this.game.get().currentTurnId));
                    }

                } else {
                    this.game.set(null);
                    this.turn.set(null);
                }

                if (this.subscriptionsReady()) {

                    const self = this;
                    Tracker.afterFlush(() => {
                        $('#clueMore').on('hidden.bs.modal', function(e) {
                            self.clueMore.set(null);
                        });
                    });

                    this.initialized = true;
                    LoadingState.stop();

                }

            } else {
                LoadingState.stop();
            }

        }

    });

    let self = this;
    Games.find().observeChanges({

        added: function(gameId, fields) {
            if (self.initialized) {
                self.game.set(Games.findOne(gameId));
            }
        },

    });

    Turns.find().observeChanges({

        added: function(turnId, fields) {
            if (self.initialized) {
                const turn = Turns.findOne(turnId);
                self.turn.set(turn);
            }
        },

    });

    Cards.find().observeChanges({

        added: function(cardId, fields) {
            if (self.initialized && self.room.get()) {
                subscribe(Meteor, 'cards', Session.get('currentGameId'));
                subscribe(Meteor, 'cardClues', Session.get('currentGameId'));
                if (fields.ownerId == Meteor.userId()) {
                    $('.player-cards-wrapper').animate({
                        scrollLeft: 0
                    }, 250);
                }
            }
        },

        changed(cardId, fields) {
            if (self.initialized && (fields.correct != null)) {
                const card = Cards.findOne(cardId);
                Meteor.call('clue.get', card.clueId, function(err, clue) {
                    if (!err) {
                        Logger.log("Update Clue Data: " + card.clueId);
                        Clues._collection.update(card.clueId, {$set: clue});
                    }
                });
            }
        },

    });

});

Template.embed.helpers({

    dataReady() {
        return (Meteor.user() && Template.instance().room.get());
    },

    currentRoom() {
        return Template.instance().room.get();
    },

    currentGame() {
        return Template.instance().game.get();
    },

    currentTurn() {
        return Template.instance().turn.get();
    },

    clueMore() {
        return Template.instance().clueMore.get();
    },

    showHeader() {
        return !FlowRouter.getQueryParam('hide_header');
    },

    title() {
        return Meteor.settings.public.app.name + ': ' + Meteor.settings.public.app.tagline;
    },

});

Template.embed.events({

    'click .more'(e, i) {
        const card = $(e.target).closest('.game-card');
        const id = card.attr('data-id');
        i.clueMore.set(Cards.findOne(id).clue());
        if (i.clueMore.get()) {
            $('#clueMore').modal('show');
        }
    },

});

function subscribe(ctx, name, arg) {
    Logger.log('Subscribe: ' + name);
    ctx.subscribe(name, arg);
}