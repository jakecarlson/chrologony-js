import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Session } from 'meteor/session';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';
import Clipboard from "clipboard";

import '../../api/Users';
import { Games } from '../../api/Games';
import { Turns } from '../../api/Turns';

import './room.html';
import './player_cards.js';
import './board.js';
import './players_list.js';
import './game.js';
import './clue_more.js';

Template.room.onCreated(function roomOnCreated() {

    this.initialized = false;
    this.room = new ReactiveVar(null);
    this.game = new ReactiveVar(null);
    this.turn = new ReactiveVar(null);
    this.clueMore = new ReactiveVar(null);

    this.autorun((computation) => {

        LoadingState.start();
        FlowRouter.watchPathChange();

        const user = Meteor.user({fields: {currentRoomId: 1}});
        if (user) {

            const roomId = user.currentRoomId;

            // Redirect the user back to the room they were in last if their current room doesn't match this one
            if (roomId && (roomId != FlowRouter.getParam('id'))) {
                FlowRouter.go('room', {id: roomId});
            }

            this.room.set(user.currentRoom());
            if (this.room.get()) {

                Helpers.subscribe(this, 'players', this.room.get()._id);
                Helpers.subscribe(this, 'games', this.room.get()._id);

                if (this.room.get().currentGameId) {

                    Helpers.subscribe(this, 'turns', this.room.get().currentGameId);
                    Helpers.subscribe(this, 'cards', this.room.get().currentGameId);
                    Helpers.subscribe(this, 'cardClues', this.room.get().currentGameId);
                    Helpers.subscribe(this, 'votes', this.room.get().currentGameId);

                    this.game.set(Games.findOne(this.room.get().currentGameId));
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

                        let clipboards = new Clipboard('[data-clipboard-text]');
                        clipboards.on('success', function(e) {
                            let btn = $(e.trigger);
                            btn.tooltip('show');
                            setTimeout(function() {btn.tooltip('hide');},3000);
                        });

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

    SoundManager.init();
    GameObserver.observe(this);

});

Template.room.helpers({

    dataReady() {
        return (Meteor.user() && Meteor.user().currentRoomId && Template.instance().room.get());
    },

    name() {
        return Template.instance().room.get().name;
    },

    isOwner() {
        return isOwner(Template);
    },

    currentRoom() {
        return Template.instance().room.get();
    },

    currentGame() {
        return Template.instance().game.get();
    },

    currentTurn() {
        return getCurrentTurn(Template);
    },

    players() {
        return Template.instance().room.get().players();
    },

    password() {
        return Session.get('roomPassword');
    },

    owner() {
        return Template.instance().room.get().owner();
    },

    link() {
        return Template.instance().room.get().link();
    },

    clueMore() {
        return Template.instance().clueMore.get();
    },

    showPlayerCards() {
        return (
            Template.instance().game.get() &&
            (Template.instance().room.get().players().count() > 1)
        );
    },

    isNotCurrentPlayer(player) {
        const turn = getCurrentTurn(Template);
        return (!turn || (player._id != turn.ownerId));
    },

    gameInProgress() {
        return getCurrentTurn(Template);
    },

    showGameEnd() {
        return (isOwner(Template) && getCurrentTurn(Template));
    },

    fullBoard() {
        return Session.get('fullBoard');
    },

    columnsBoard() {
        return !Session.get('fullBoard');
    },

});

Template.room.events({

    'click .leave'(e, i) {
        leaveRoom();
    },

    'click .destroy'(e, i) {
        LoadingState.start(e);
        Meteor.call('room.remove', i.room.get()._id, function(err, id) {
            if (!err) {
                Logger.log("Room Deleted: " + id);
                Flasher.set('success', "You have successfully deleted the room. You can join or create a new one below.");
                FlowRouter.go('lobby');
            }
            LoadingState.stop();
        });
    },

    'click .end-game'(e, i) {
        LoadingState.start(e);
        const gameId = i.game.get()._id;
        Meteor.call('game.end', gameId, false, function(err, updated) {
            if (!err) {
                Logger.log("Ended Game: " + gameId);
            }
        });
    },

    'click .abandon-game'(e, i) {
        LoadingState.start(e);
        const gameId = i.game.get()._id;
        Meteor.call('game.end', gameId, true, function(err, updated) {
            if (!err) {
                Logger.log("Abandoned Game: " + gameId);
            }
        });
    },

    'click .more': Helpers.showClueMore,

    'submit #invitePlayer'(e, i) {

        LoadingState.start(e);

        const target = e.target;
        const email = target.email.value;
        const room = i.room.get();

        Meteor.call('room.invite', email, room._id, room.link(), function(err, id) {
            if (!err) {
                Logger.log(email + ' invited to room: ' + id);
                Flasher.set('success', "You have successfully invited " + email + " to join this room.");
                target.email.value = '';
                $('.invite-modal').modal('hide');
                LoadingState.stop();
            }
        });

    },

    'click .link'(e, i) {
        e.preventDefault();
    },

    'click .password'(e, i) {
        e.preventDefault();
    },

    'click .board-full'(e, i) {
        Session.set('fullBoard', true);
    },

    'click .board-columns'(e, i) {
        Session.set('fullBoard', false);
    },

});

function leaveRoom() {
    LoadingState.start();
    Meteor.call('room.leave', false, function(err, id) {
        if (!err) {
            Logger.log("Player Left Room: " + id);
        }
        Flasher.clear();
        delete Session.keys['roomPassword'];
        FlowRouter.go('lobby');
    });
}

function getCurrentTurn(t) {
    return t.instance().turn.get();
}

function isOwner(t) {
    return (t.instance().room.get() && (t.instance().room.get().ownerId == Meteor.userId()));
}