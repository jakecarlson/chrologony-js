import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from '../startup/LoadingState';

import { Games } from '../api/games';
import { Turns } from '../api/turns';

import './room.html';
import './players_list.js';
import './board.js';
import './game.js';

Template.room.onCreated(function roomOnCreated() {
    this.autorun(() => {
        this.subscribe('games', this.data.room._id);
        this.subscribe('turns', this.data.room.currentGameId);
        this.subscribe('players', this.data.room._id);
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

});

Template.room.events({
    'click .leave'(e, i) {
        Meteor.call('room.leave', {}, function(error, id) {
            if (!error) {
                console.log("Room Left: " + id);
                LoadingState.stop();
            }
        });
    },
});