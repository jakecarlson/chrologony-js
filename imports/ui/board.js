import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import './board.html';
import './card.js';
import { Games } from "../api/games";
import { Turns } from "../api/turns";

Template.board.onCreated(function boardOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('turns', this.data.room.currentGameId);
    Meteor.subscribe('cards', Session.get('room'));
});

Template.board.helpers({
    turn() {
        if (this.game) {
            if (this.game.currentTurnId) {
                return Turns.findOne(this.game.currentTurnId);
            } else {
                return "no turn defined";
            }
        } else {
            return "no game defined";
        }

        // return (this.game) ? this.game.currentTurnId : 'nada';
        // return this.game.currentTurnId;
    },
    turnTitle() {
        let userId = Turns.findOne(this.game.currentTurnId).userId;
        if (userId == Meteor.userId())
        return ;
    }

});

Template.board.events({
    'click .draw'(e, i) {

    },
});