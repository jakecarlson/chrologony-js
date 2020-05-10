import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './card.html';
import {Sortable} from "sortablejs";

Template.card.onCreated(function boardOnCreated() {

    this.autorun(() => {

        if (this.subscriptionsReady()) {

        }

    });

});

Template.card.helpers({

    id() {
        return (this.card) ? this.card._id : null;
    },

    categoryId() {
        return (this.card) ? this.card.clue.categoryId : null;
    },

    date() {
        return (this.card) ? moment.utc(this.card.clue.date).format("Y-MM-DD") : null;
    },

    year() {
        return (this.card) ? moment.utc(this.card.clue.date).format("Y") : null;
    },

    description() {
        return (this.card) ? this.card.clue.description : null;
    },

    hint() {
        return (this.card) ? this.card.clue.hint : null;
    },

    isLocked() {
        return (this.card) ? (this.card.lockedAt != null) : false;
    },

    isTurn() {
        return (this.card) ? (this.card.turnId == this.turn._id) : false;
    },

    isCurrent() {
        return isCurrent(this.turn, this.card);
    },

    isCorrect() {
        return (this.card && this.card.correct);
    },

    isOwned() {
        return isOwned(this.card, this.turn);
    },

    canMoveCard() {
        return (isOwned(this.turn, this.card) && isCurrent(this.turn, this.card));
    },

});

Template.card.events({

});

function isOwned(turn, card) {
    return (turn && card && (turn.userId == Meteor.userId()));
}

function isCurrent(turn, card) {
    return (turn && card) ? (turn.currentCardId == card._id) : false;
}