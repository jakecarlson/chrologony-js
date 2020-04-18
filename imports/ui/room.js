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
    Meteor.subscribe('games', Session.get('room'));
});

Template.room.helpers({
    currentGame() {
        let game = (this.room.currentGameId) ? Games.findOne(this.room.currentGameId) : null;
        console.log(game);
        return game;
    },
});

Template.room.events({
    'click .leave'(e, i) {
        Session.set('room', undefined);
    },
});