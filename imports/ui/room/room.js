import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { check } from 'meteor/check';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { RecordId } from '../../startup/validations';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import '../../api/Users';
import { Rooms } from '../../api/Rooms';
import { Games } from '../../api/Games';
import { Cards } from "../../api/Cards";

import './room.html';
import './players_list.js';
import './board.js';
import './game.js';

Template.room.onCreated(function roomOnCreated() {

    this.room = new ReactiveVar(null);

    this.autorun(() => {

        LoadingState.start();

        FlowRouter.watchPathChange();

        if (Meteor.user()) {

            const roomId = Meteor.user().currentRoomId;

            // Redirect the user back to lobby if they aren't authenticated to this room
            if (roomId != FlowRouter.getParam('id')) {
                leaveRoom();
            }

            this.room.set(Meteor.user().currentRoom());
            if (this.room.get()) {
                this.subscribe('games', this.room.get()._id);
                this.subscribe('players', this.room.get()._id);
                this.subscribe('turns', this.room.get().currentGameId);
                this.subscribe('cards', this.room.get().currentGameId);
                this.subscribe('cardClues', this.room.get().currentGameId);
                if (this.subscriptionsReady()) {
                    LoadingState.stop();
                }
            }

        }

    });

    Games.find().observeChanges({
        added: function(gameId, fields) {
            Meteor.subscribe('games', fields.roomId);
            Meteor.subscribe('turns', gameId);
            Meteor.subscribe('cards', gameId);
            Meteor.subscribe('cardClues', gameId);
        }
    });

    Cards.find().observeChanges({
        added: function(cardId, fields) {
            Meteor.subscribe('cards', fields.gameId);
            Meteor.subscribe('cardClues', fields.gameId);
        }
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

});

Template.room.events({

    'click .leave'(e, i) {
        leaveRoom();
    },

    'click .destroy'(e, i) {
        LoadingState.start();
        Meteor.call('room.remove', this.room.get()._id, function(error, id) {
            if (!error) {
                Logger.log("Room Deleted: " + id);
                Flasher.set('success', "You have successfully deleted the room. You can join or create a new one below.");
            }
            LoadingState.stop();
        });
    },

});

function leaveRoom() {
    LoadingState.start();
    Meteor.call('room.leave', false, function(error, id) {
        if (!error) {
            Logger.log("Player Left Room: " + id);
        }
        Flasher.clear();
        FlowRouter.go('lobby');
        LoadingState.stop();
    });
}