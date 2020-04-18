import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import './board.html';
import './card.js';

Template.board.onCreated(function boardOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('cards', Session.get('room'));
});

Template.board.helpers({

});

Template.board.events({
    'click .draw'(e, i) {

    },
});