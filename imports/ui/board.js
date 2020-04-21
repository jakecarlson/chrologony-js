import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import './board.html';
import './card.js';

Template.board.onCreated(function boardOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('turns', this.data.room.currentGameId);
    Meteor.subscribe('cards', Meteor.user().currentRoomId);
});

Template.board.helpers({

    turnTitle() {
        if (this.turn) {
            let title = '';
            if (this.turn.userId == Meteor.userId()) {
                title += 'Your';
            } else {
                let user = Meteor.users.findOne(this.turn.userId);
                title += user.username + "'s";
            }
            title += ' Turn';
            return title;
        } else {
            return 'no turn defined';
        }
    },

});

Template.board.events({
    'click .draw'(e, i) {

    },
    'click .turn'(e, i) {
        e.preventDefault();
        console.log('End Turn: ' + this.game.currentTurnId);
        Session.set('loading', true);
        Meteor.call('turn.next', this.game._id, function(error, id) {
            if (!error) {
                console.log("Start Turn: " + id);
                Session.set('loading', false);
            }
        });
    },
});