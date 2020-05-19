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
        return moment.utc(getClueField(Template, 'date')).format("Y-MM-DD");
    },

    year() {
        return moment.utc(getClueField(Template, 'date')).format("Y");
    },

    description() {
        return getClueField(Template, 'description');
    },

    hint() {
        return getClueField(Template, 'hint');
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

function getClueField(template, field) {
    if (Template.instance().data.card && Template.instance().clue.get()) {
        return Template.instance().clue.get()[field];
    }
    return null;
}