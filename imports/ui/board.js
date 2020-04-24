import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import { Cards } from '../api/cards';

import './board.html';
import './card.js';

Template.board.onCreated(function boardOnCreated() {
    this.state = new ReactiveDict();
    this.autorun(() => {
        this.subscribe('turns', this.data.room.currentGameId);
        this.subscribe('cards', this.data.room.currentGameId);
    });

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

    lockedCards() {
        return Cards.find({});
        // return Cards.find({gameId: this.game._id, lockedAt: {$ne: null}});
    },

    turnCards() {
        // return Cards.find({});
        if (this.turn) {
            return Cards.find({turnId: this.turn._id});
        }
        return [];
    },

    currentCard() {
        if (this.turn) {
            console.log("Card ID: " + this.turn.currentCardId);
            if (this.turn.currentCardId) {
                let card = Cards.findOne(this.turn.currentCardId);
                console.log(Cards.find({}).fetch());
                console.log("Current Card:");
                console.log(card);
                return card;
            }
        }
        return null;
    },

});

Template.board.events({

    'click .draw'(e, i) {
        e.preventDefault();
        console.log(this.game);
        let gameId = this.game._id;
        let turnId = this.game.currentTurnId;
        Meteor.call('card.draw', {turnId: turnId, gameId: gameId}, function(error, id) {
            if (!error) {
                console.log("Created Card: " + id);
                Meteor.subscribe('cards', gameId);
            }
        });
    },

    'click .turn'(e, i) {
        e.preventDefault();
        console.log('End Turn: ' + this.game.currentTurnId);
        Session.set('loading', true);
        console.log(this.game);
        let gameId = this.game._id;
        Meteor.call('turn.next', gameId, function(error, id) {
            if (!error) {
                console.log("Start Turn: " + id);
                Meteor.subscribe('cards', gameId);
                Session.set('loading', false);
            }
        });
    },

});