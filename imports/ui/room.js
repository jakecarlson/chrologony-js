import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import { Games } from '../api/games';

import './room.html';
import './game.js';
import './board.js';

Template.room.onCreated(function roomOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('games', Meteor.user().currentRoomId);
});

Template.room.helpers({
    currentGame() {
        return (this.room.currentGameId) ? Games.findOne(this.room.currentGameId) : null;
    },
});

Template.room.events({
    'click .leave'(e, i) {
        Meteor.call('room.leave', {}, function(error, id) {
            if (!error) {
                console.log("Room Left: " + id);
            }
        });
    },
});