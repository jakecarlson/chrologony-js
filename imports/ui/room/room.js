import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Session } from 'meteor/session';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';
import Clipboard from "clipboard";

import '../../api/Users';
import { Clues } from '../../api/Clues';
import { Games } from '../../api/Games';
import { Turns } from '../../api/Turns';
import { Cards } from "../../api/Cards";

import './room.html';
import './player_cards.js';
import './board.js';
import './players_list.js';
import './game.js';
import './clue_more.js';

// GAME SOUNDS
const AUDIO = {

    game: {
        start: '/game-start.mp4',
        win: '/game-win.mp4',
        lose: '/game-lose.mp4',
    },

    turn: {
        start: '/turn-start.mp4',
        end: '/turn-end.mp4',
    },

    card: {
        draw: '/card-draw.mp4',
        right: '/card-right.mp4',
        wrong: '/card-wrong.mp4',
    },

};

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

            // Redirect the user back to lobby if they aren't authenticated to this room
            if (roomId != FlowRouter.getParam('id')) {
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
                    subscribe(this, 'votes', this.room.get().currentGameId);

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

    this.sounds = {};
    for (const type in AUDIO) {
        this.sounds[type] = {};
        for (const sound in AUDIO[type]) {
            this.sounds[type][sound] = new buzz.sound(AUDIO[type][sound]);
        }
    }

    let self = this;
    Games.find().observeChanges({

        added: function(gameId, fields) {
            if (self.initialized) {
                self.game.set(Games.findOne(gameId));
                playSound(self.sounds.game.start);
            }
        },

        changed(gameId, fields) {
            if (self.initialized && (fields.endedAt != null)) {
                if (fields.winnerId == Meteor.userId()) {
                    playSound(self.sounds.game.win);
                } else {
                    playSound(self.sounds.game.lose);
                }
            }
        },

    });

    Turns.find().observeChanges({

        added: function(turnId, fields) {
            if (self.initialized) {
                const turn = Turns.findOne(turnId);
                self.turn.set(turn);
                if (turn.ownerId == Meteor.userId()) {
                    playSound(self.sounds.turn.start);
                }
            }
        },

        changed(turnId, fields) {
            if (self.initialized && (fields.endedAt != null)) {
                playSound(self.sounds.turn.end);
            }
        },

    });

    Cards.find().observeChanges({

        added: function(cardId, fields) {
            if (self.initialized && self.room.get()) {
                subscribe(Meteor, 'cards', self.room.get().currentGameId);
                subscribe(Meteor, 'cardClues', self.room.get().currentGameId);
                playSound(self.sounds.card.draw);
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
                        if (card.correct) {
                            playSound(self.sounds.card.right);
                        } else {
                            playSound(self.sounds.card.wrong);
                        }
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

    'click .more'(e, i) {
        const card = $(e.target).closest('.game-card');
        const id = card.attr('data-id');
        i.clueMore.set(Cards.findOne(id).clue());
        if (i.clueMore.get()) {
            $('#clueMore').modal('show');
        }
    },

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

function subscribe(ctx, name, arg) {
    Logger.log('Subscribe: ' + name);
    ctx.subscribe(name, arg);
}

function getCurrentTurn(t) {
    return t.instance().turn.get();
}

function isOwner(t) {
    return (t.instance().room.get() && (t.instance().room.get().ownerId == Meteor.userId()));
}

function playSound(sound) {
    if (!Session.get('muted')) {
        sound.play();
    }
}