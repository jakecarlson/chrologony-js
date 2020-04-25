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

        this.subscribe('clues');
        this.subscribe('turns', this.data.room.currentGameId);
        this.subscribe('cards', this.data.room.currentGameId);

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                $("#myCards").sortable({
                    items: ".clue-col",
                    axis: "x",
                    cancel: ".clue-card:not(.current)",
                    handle: ".clue-card",
                    // tolerance: "pointer",
                    containment: "#board",
                    delay: 100,
                    revert: 100,
                    helper: "clone",
                    scroll: false,
                    start: function(event, ui) {
                        $(ui.helper).addClass("dragging");
                    },
                    stop: function(event, ui) {
                        $(ui.item).removeClass("dragging");
                    },
                });
            });
        }

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

    myCards() {
        if (this.game && this.turn) {
            return Cards.find({gameId: this.game._id, userId: Meteor.userId()});
        } else {
            return [];
        }
    },

    isCurrentCard(cardId) {
        return (this.turn && (this.turn.currentCardId == cardId));
    },

    cannotDrawCard() {
        return (Session.get('loading') || (this.turn && this.turn.currentCardId));
    },

    cannotEndTurn() {
        return (Session.get('loading') || (this.turn && this.turn.currentCardId));
    },

    /*
    lockedCards() {
        // return Cards.find({});
        if (this.game && this.turn) {
            return Cards.find({gameId: this.game._id, lockedAt: {$ne: null}, turnId: {$ne: this.turn._id}});
        } else {
            return [];
        }
    },

    turnCards() {
        // return Cards.find({});
        if (this.turn) {
            return Cards.find({turnId: this.turn._id});
        } else {
            return [];
        }
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

     */

});

Template.board.events({

    'click .submit-guess'(e, i) {
        let pos = null;
        const cardId = this.turn.currentCardId;
        $(i.findAll('.clue-card')).each(function(n, card) {
            if ($(card).attr('data-id') === cardId) {
                pos = n;
            }
        });
        Meteor.call('card.submit', {gameId: this.game._id, turnId: this.turn._id, cardId: cardId, pos: pos}, function(error, updated) {
            if (!error) {
                console.log("Card Updated: " + updated);
            }
        });
    },

    'click .draw-card'(e, i) {
        // e.preventDefault();
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

    'click .end-turn'(e, i) {
        // e.preventDefault();
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