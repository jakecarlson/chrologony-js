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

    dataReady() {
        return (this.card && Template.instance().clue && Template.instance().clue.get());
    },

    id() {
        return this.card._id;
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
        return (this.card.lockedAt != null);
    },

    isTurn() {
        return (this.card.turnId == this.turn._id);
    },

    isCurrent() {
        return isCurrent(this.turn, this.card);
    },

    isCorrect() {
        return this.card.correct;
    },

    isOwned() {
        return isOwned(this.turn);
    },

    canMoveCard() {
        return (isOwned(this.turn) && isCurrent(this.turn, this.card));
    },

});

Template.card.events({

});

function isOwned(turn) {
    return (turn.ownerId == Meteor.userId());
}

function isCurrent(turn, card) {
    return (turn.currentCardId == card._id);
}

function getClueField(template, field) {
    return Template.instance().clue.get()[field];
}