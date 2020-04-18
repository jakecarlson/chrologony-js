import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './room.html';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

Template.room.onCreated(function roomOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('games', Session.get('room'));
});

Template.room.helpers({

});

Template.room.events({
    'click .game'(e, i) {

    },
    'click .draw'(e, i) {

    },
    'click .leave'(e, i) {
        Session.set('room', undefined);
    },

});