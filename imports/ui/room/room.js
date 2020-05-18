import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import '../../api/Users';
import { Games } from '../../api/Games';
import { Cards } from "../../api/Cards";

import './room.html';
import './players_list.js';
import './board.js';
import './game.js';

Template.room.onCreated(function roomOnCreated() {

    this.autorun(() => {

        LoadingState.start();
        this.subscribe('games', this.data.room._id);
        this.subscribe('players', this.data.room._id);
        this.subscribe('turns', this.data.room.currentGameId);
        this.subscribe('cards', this.data.room.currentGameId);
        this.subscribe('cardClues', this.data.room.currentGameId);

        if (this.subscriptionsReady()) {
            LoadingState.stop();
        }

    });

    Games.find().observeChanges({
        added: function(gameId, fields) {
            Meteor.subscribe('games', (Meteor.userId()) ? Meteor.user().currentRoomId : null);
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

    isOwner() {
        return (this.room.ownerId == Meteor.userId());
    },

    currentGame() {
        return this.room.currentGame();
    },

    currentTurn() {
        if (this.room && this.room.currentGameId) {
            const game = this.room.currentGame();
            if (game && game.currentTurnId) {
                return game.currentTurn();
            }
        }
        return null;
    },

    players() {
        return this.room.players();
    },

    password() {
        return this.room.password;
    },

    owner() {
        return this.room.owner();
    },

});

Template.room.events({

    'click .leave'(e, i) {
        LoadingState.start();
        Meteor.call('room.leave', false, function(error, id) {
            if (!error) {
                Logger.log("Player Left Room: " + id);
            }
            Flasher.clear();
            LoadingState.stop();
        });
    },

    'click .destroy'(e, i) {
        LoadingState.start();
        Meteor.call('room.remove', this.room._id, function(error, id) {
            if (!error) {
                Logger.log("Room Deleted: " + id);
                Flasher.set('success', "You have successfully deleted the room. You can join or create a new one below.");
            }
            LoadingState.stop();
        });
    },

});