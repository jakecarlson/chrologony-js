import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './card.html';

Template.card.onCreated(function boardOnCreated() {
    this.clue = new ReactiveVar(null);
    this.autorun(() => {
        this.clue.set(this.data.card.clue());
    });
});

Template.card.helpers({

    id() {
        return (this.card) ? this.card._id : null;
    },

    date() {
        return (this.card) ? moment.utc(Template.instance().clue.get().date).format("Y-MM-DD") : null;
    },

    year() {
        return (this.card) ? moment.utc(Template.instance().clue.get().date).format("Y") : null;
    },

    description() {
        return (this.card) ? Template.instance().clue.get().description : null;
    },

    hint() {
        return (this.card) ? Template.instance().clue.get().hint : null;
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
    return (turn && card && (turn.ownerId == Meteor.userId()));
}

function isCurrent(turn, card) {
    return (turn && card) ? (turn.currentCardId == card._id) : false;
}