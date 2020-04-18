import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import './board.html';
import './card.js';
import { Games } from "../api/games";

Template.board.onCreated(function boardOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('turn', null);
    this.state.set('card', null);
    Meteor.subscribe('cards', Session.get('room'));
});

Template.board.helpers({
    currentTurn() {
        if (this.game) {
            if (this.game.currentTurnId) {
                return this.game.currentTurnId;
            } else {
                return "no turn defined";
            }
        } else {
            return "no game defined";
        }

        // return (this.game) ? this.game.currentTurnId : 'nada';
        // return this.game.currentTurnId;
    },

});

Template.board.events({
    'click .draw'(e, i) {

    },
});