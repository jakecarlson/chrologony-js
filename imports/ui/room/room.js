import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import '../../api/Users';
import { Clues } from '../../api/Clues';
import { Games } from '../../api/Games';
import { Turns } from '../../api/Turns';
import { Cards } from "../../api/Cards";

import './room.html';
import './players_list.js';
import './board.js';
import './game.js';
import Clipboard from "clipboard";

Template.room.onCreated(function roomOnCreated() {

    this.initialized = false;
    this.room = new ReactiveVar(null);
    this.game = new ReactiveVar(null);
    this.turn = new ReactiveVar(null);

    this.autorun((computation) => {

        /*
        console.log('AUTORUN');
        computation.onInvalidate(function() {
            console.trace();
        });
         */

        LoadingState.start();
        FlowRouter.watchPathChange();

        const user = Meteor.user({fields: {"currentRoomId": 1}});
        if (user) {

            // console.log('GET SUBSCRIPTIONS');
            const roomId = user.currentRoomId;

            // Redirect the user back to lobby if they aren't authenticated to this room
            if (roomId != FlowRouter.getParam('id')) {
                // console.log('redirect');
                Flasher.set('danger', "You are not authorized to view that room.");
                leaveRoom();
            }

            this.room.set(user.currentRoom());
            if (this.room.get()) {

                subscribe(this, 'players', this.room.get()._id);
                subscribe(this, 'games', this.room.get()._id);

                if (this.room.get().currentGameId) {

                    subscribe(this, 'turns', this.room.get().currentGameId);
                    subscribe(this, 'cards', this.room.get().currentGameId);
                    subscribe(this, 'cardClues', this.room.get().currentGameId);

                    this.game.set(Games.findOne(this.room.get().currentGameId));
                    if (this.game.get() && this.game.get().currentTurnId) {
                        this.turn.set(Turns.findOne(this.game.get().currentTurnId));
                    }

                }

                if (this.subscriptionsReady()) {

                    Tracker.afterFlush(() => {
                        let clipboards = new Clipboard('[data-clipboard-text]');
                        clipboards.on('success', function(e) {
                            var btn = $(e.trigger);
                            btn.popover('show');
                            setTimeout(function() {btn.popover('hide');},3000);
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
        }
    });

    Turns.find().observeChanges({
        added: function(turnId, fields) {
            if (self.initialized) {
                self.turn.set(Turns.findOne(turnId));
            }
        }
    });

    Cards.find().observeChanges({

        added: function(cardId, fields) {
            if (self.initialized && self.room.get()) {
                // console.log(fields);
                subscribe(Meteor, 'cards', self.room.get().currentGameId);
                subscribe(Meteor, 'cardClues', self.room.get().currentGameId);
            }
        },

        changed(cardId, fields) {
            if (self.initialized && (fields.correct != null)) {
                const card = Cards.findOne(cardId);
                Meteor.call('clue.getDate', card.clueId, function(err, date) {
                    if (!err) {
                        Logger.log("Update Clue Date " + card.clueId + ": " + date);
                        Clues._collection.update(card.clueId, {$set: {date: date}});
                    }
                });
            }
        },

    });

});

Template.room.helpers({

    dataReady() {
        return (Meteor.user() && Meteor.user().currentRoomId && Template.instance().room.get());
    },

    name() {
        return Template.instance().room.get().name;
    },

    isOwner() {
        return (Template.instance().room.get().ownerId == Meteor.userId());
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

    players() {
        return Template.instance().room.get().players();
    },

    password() {
        return Template.instance().room.get().password;
    },

    owner() {
        return Template.instance().room.get().owner();
    },

    link() {
        return Meteor.absoluteUrl(FlowRouter.path('joinByToken', {id: Template.instance().room.get()._id, token: Template.instance().room.get().token}));
    },

});

Template.room.events({

    'click .leave'(e, i) {
        leaveRoom();
    },

    'click .destroy'(e, i) {
        LoadingState.start();
        Meteor.call('room.remove', i.room.get()._id, function(err, id) {
            if (!err) {
                Logger.log("Room Deleted: " + id);
                Flasher.set('success', "You have successfully deleted the room. You can join or create a new one below.");
                FlowRouter.go('lobby');
            }
            LoadingState.stop();
        });
    },

});

function leaveRoom() {
    LoadingState.start();
    Meteor.call('room.leave', false, function(err, id) {
        if (!err) {
            Logger.log("Player Left Room: " + id);
        }
        Flasher.clear();
        FlowRouter.go('lobby');
    });
}

function subscribe(ctx, name, arg) {
    Logger.log('Subscribe: ' + name);
    ctx.subscribe(name, arg);
}