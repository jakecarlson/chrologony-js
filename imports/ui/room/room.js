import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Flasher } from '../flasher';
import { LoadingState } from '../../startup/LoadingState';

import { Games } from '../../api/games';
import { Turns } from '../../api/turns';

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

        if (this.subscriptionsReady()) {
            LoadingState.stop();
        }

    });

    Games.find().observeChanges({
        added: function(gameId, fields) {
            Meteor.subscribe('games', (Meteor.userId()) ? Meteor.user().currentRoomId : null);
            Meteor.subscribe('turns', gameId);
            Meteor.subscribe('cards', gameId);
        }
    });

});

Template.room.helpers({

    isOwner() {
        return (this.room.owner == Meteor.userId());
    },

    currentGame() {
        return (this.room.currentGameId) ? Games.findOne(this.room.currentGameId) : null;
    },

    currentTurn() {
        if (this.room.currentGameId) {
            let game = Games.findOne(this.room.currentGameId);
            if (game && game.currentTurnId) {
                return Turns.findOne(game.currentTurnId);
            }
        }
        return null;
    },

    players() {
        return Meteor.users.find({currentRoomId: this.room._id});
    },

    password() {
        return this.room.password;
    },

    owner() {
        const user = Meteor.users.findOne(this.room.owner);
        return (user) ? user.username : null;
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