import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import '../../api/Users';
import { Clues } from '../../api/Clues';
import { Games } from '../../api/Games';
import { Cards } from "../../api/Cards";

import './room.html';
import './players_list.js';
import './board.js';
import './game.js';
import Clipboard from "clipboard";

Template.room.onCreated(function roomOnCreated() {

    this.room = new ReactiveVar(null);

    this.autorun(() => {

        LoadingState.start();

        FlowRouter.watchPathChange();

        const userHandle = Meteor.subscribe('userData');
        if (userHandle.ready()) {

            const roomId = Meteor.user().currentRoomId;

            // Redirect the user back to lobby if they aren't authenticated to this room
            if (roomId != FlowRouter.getParam('id')) {
                Flasher.set('danger', "You are not authorized to view that room.");
                leaveRoom();
            }

            this.room.set(Meteor.user().currentRoom());
            if (this.room.get()) {

                this.subscribe('players', this.room.get()._id);
                subscribeToGame(this.room.get()._id, this.room.get().currentGameId);

                if (this.subscriptionsReady()) {

                    Tracker.afterFlush(() => {
                        let clipboards = new Clipboard('[data-clipboard-text]');
                        clipboards.on('success', function(e) {
                            var btn = $(e.trigger);
                            btn.popover('show');
                            setTimeout(function() {btn.popover('hide');},3000);
                        });
                    });

                    LoadingState.stop();

                }

            } else {
                LoadingState.stop();
            }

        }

    });

    const gamesObserver = Games.find().observeChanges({
        added: function(gameId, fields) {
            if (gamesObserver) {
                subscribeToGame(fields.roomId, gameId);
            }
        }
    });

    const cardsObserver = Cards.find().observeChanges({

        added: function(cardId, fields) {
            if (cardsObserver) {
                subscribeToCards(fields.gameId);
            }
        },

        changed(cardId, fields) {
            if (cardsObserver && (fields.correct != null)) {
                const card = Cards.findOne(cardId);
                Meteor.call('clue.getDate', card.clueId, function(err, date) {
                    if (!err) {

                        Logger.log("Update Clue Date " + card.clueId + ": " + date);

                        // Update the clue date on the client only
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
        return Template.instance().room.get().currentGame();
    },

    currentTurn() {
        if (Template.instance().room.get().currentGameId) {
            const game = Template.instance().room.get().currentGame();
            if (game && game.currentTurnId) {
                return game.currentTurn();
            }
        }
        return null;
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

function subscribeToGame(roomId, gameId) {
    Logger.log("Subscribe: Games + Turns");
    Meteor.subscribe('games', roomId);
    Meteor.subscribe('turns', gameId);
    subscribeToCards(gameId);
}

function subscribeToCards(gameId) {
    Logger.log("Subscribe: Cards + Clues");
    Meteor.subscribe('cards', gameId);
    Meteor.subscribe('cardClues', gameId);
}