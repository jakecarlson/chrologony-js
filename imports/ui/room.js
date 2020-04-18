import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import './room.html';
import './game.js';
import './board.js';

Template.room.onCreated(function roomOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('games', Session.get('room'));
});

Template.room.helpers({

});

Template.room.events({
    'click .leave'(e, i) {
        Session.set('room', undefined);
    },
});