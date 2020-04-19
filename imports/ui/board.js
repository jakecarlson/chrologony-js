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
    Meteor.subscribe('cards', Meteor.user().currentRoomId);
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
    },

    turnTitle() {
        if (this.game) {
            let turn = Turns.findOne(this.game.currentTurnId);
            console.log(turn);
            if (turn) {
                let title = '';
                if (turn.userId == Meteor.userId()) {
                    title += 'Your';
                } else {
                    let user = Meteor.users.findOne(turn.userId);
                    title += user.username + "'s";
                }
                title += ' Turn';
                return title;
            } else {
                return 'no turn defined';
            }
        } else {
            return 'no game defined';
        }
    }

});

Template.board.events({
    'click .draw'(e, i) {

    },
});