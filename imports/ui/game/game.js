import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Session } from 'meteor/session';
import { LoadingState } from '../../modules/LoadingState';
import Clipboard from "clipboard";

import '../../api/Users';
import { Games } from '../../api/Games';

import './game.html';
import './player_cards.js';
import './board.js';
import './players_list.js';
import './options.js';
import './clue_more.js';

Template.game.onCreated(function gameOnCreated() {

    this.initialized = false;
    this.game = new ReactiveVar(null);
    this.clueMore = new ReactiveVar(null);
    this.players = new ReactiveVar([]);

    this.autorun(() => {

        LoadingState.start();
        FlowRouter.watchPathChange();

        this.game.set(Games.findOne(FlowRouter.getParam('id')));
        if (this.game.get()) {

            if (this.game.get().hasPlayer(Meteor.userId())) {

                Helpers.subscribe(this, 'players', this.game.get().players);
                Helpers.subscribe(this, 'turns', this.game.get()._id);
                Helpers.subscribe(this, 'cards', this.game.get()._id);
                Helpers.subscribe(this, 'cardClues', this.game.get()._id);
                Helpers.subscribe(this, 'votes', this.game.get()._id);

                // if (this.subscriptionsReady()) {

                    const self = this;
                    Tracker.afterFlush(() => {

                        let clipboards = new Clipboard('[data-clipboard-text]');
                        clipboards.on('success', function (e) {
                            let btn = $(e.trigger);
                            btn.tooltip('show');
                            setTimeout(function () {
                                btn.tooltip('hide');
                            }, 3000);
                        });

                        $('#clueMore').on('hidden.bs.modal', function (e) {
                            self.clueMore.set(null);
                        });

                    });

                    Meteor.call('user.setGame', this.game.get()._id, null, function(err, updated) {
                        if (err) {
                            Meteor.Error('user-game-not-set', 'Could not set user current game.', err);
                        }
                    });

                    this.initialized = true;
                    LoadingState.stop();

                // }

            // Redirect the user back to the lobby if their current game doesn't match this one
            } else {
                FlowRouter.go('lobby');
            }

        } else {
            LoadingState.stop();
        }

    });

    SoundManager.init();
    GameObserver.observe(this);

});

Template.game.helpers({

    dataReady() {
        return (Meteor.user() && Template.instance().game.get());
    },

    title() {
        return Template.instance().game.get().title();
    },

    isOwner() {
        return isOwner(Template);
    },

    currentGame() {
        return Template.instance().game.get();
    },

    currentTurn() {
        return Template.instance().game.get().currentTurn();
    },

    players() {
        return Template.instance().game.get().playersWithNames();
    },

    password() {
        return Session.get('gamePassword');
    },

    owner() {
        return Template.instance().game.get().owner();
    },

    link() {
        return Template.instance().game.get().link();
    },

    clueMore() {
        return Template.instance().clueMore.get();
    },

    showPlayerCards() {
        return (
            Template.instance().game.get() &&
            (Template.instance().game.get().playersWithNames().length > 1)
        );
    },

    isNotCurrentPlayer(player) {
        const turn = Template.instance().game.get().currentTurn();
        return (!turn || (player._id != turn.ownerId));
    },

    inProgress() {
        return (Template.instance().game.get().startedAt && !Template.instance().game.get().endedAt);
    },

    fullBoard() {
        return Session.get('fullBoard');
    },

    columnLayout() {
        return !Session.get('fullBoard');
    },

    started() {
        return Template.instance().game.get().startedAt;
    },

    ended() {
        return Template.instance().game.get().endedAt;
    },

    manualEndOnly() {
        return !Template.instance().game.get().winPoints;
    },

});

Template.game.events({

    'click .start'(e, i) {
        LoadingState.start(e);
        const gameId = i.game.get()._id;
        Meteor.call('game.start', gameId, false, function(err, gameId) {
            if (!err) {
                Logger.log("Started Game: " + gameId);
            } else {
                throw new Meteor.Error('game-not-started', 'Could not start the game', err);
            }
            TourGuide.resume();
            LoadingState.stop();
        });
    },

    'click .leave'(e, i) {
        leaveGame(i.game.get()._id);
    },

    'click .end'(e, i) {
        LoadingState.start(e);
        const gameId = i.game.get()._id;
        Meteor.call('game.end', gameId, false, function(err, gameId) {
            if (!err) {
                Logger.log("Ended Game: " + gameId);
            } else {
                throw new Meteor.Error('game-not-ended', 'Could not end the game.', err);
            }
            LoadingState.stop();
        });
    },

    'click .abandon'(e, i) {
        LoadingState.start(e);
        const gameId = i.game.get()._id;
        Meteor.call('game.end', gameId, true, function(err, gameId) {
            if (!err) {
                Logger.log("Abandoned Game: " + gameId);
                Flasher.success('You have successfully abandoned the game. All players were ejected.');
                FlowRouter.go('lobby');
            } else {
                throw new Meteor.Error('game-not-deleted', 'Could not delete the game.', err);
            }
            LoadingState.stop();
        });
    },

    'click .more': Helpers.showClueMore,

    'submit #invitePlayer'(e, i) {

        LoadingState.start(e);

        const target = e.target;
        const email = target.email.value;
        const game = i.game;

        Meteor.call('game.invite', email, game.get()._id, game.get().link(), function(err, id) {
            if (!err) {
                Logger.log(email + ' invited to game: ' + id);
                Flasher.success('You have successfully invited ' + email + ' to join this game.');
                target.email.value = '';
                $('.invite-modal').modal('hide');
                LoadingState.stop();
            } else {
                throw new Meteor.Error('player-not-invited', 'Could not invite a player.', err);
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

function leaveGame(id) {
    LoadingState.start();
    Meteor.call('game.leave', id, false, function(err, id) {
        if (!err) {
            Logger.log("Player Left Game: " + id);
        } else {
            throw new Meteor.Error('game-not-left', 'Could not leave the game.', err);
        }
        Flasher.clear();
        delete Session.keys['gamePassword'];
        FlowRouter.go('lobby');
    });
}

function isOwner(t) {
    return (t.instance().game.get() && (t.instance().game.get().ownerId == Meteor.userId()));
}