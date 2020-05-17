import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Clues } from '../../api/clues';

import './card.html';

Template.card.onCreated(function boardOnCreated() {

    Meteor.subscribe('clueCards', this.data.turn.gameId);
    this.clue = new ReactiveVar(null);

    this.autorun(() => {

        if (this.subscriptionsReady()) {
            this.clue.set(Clues.findOne(this.data.card.clueId));
        }

    });

});

Template.card.helpers({

    id() {
        return (this.card) ? this.card._id : null;
    },

    date() {
        return (this.card) ? moment.utc(getClueField(Template, 'date')).format("Y-MM-DD") : null;
    },

    year() {
        return (this.card) ? moment.utc(getClueField(Template, 'date')).format("Y") : null;
    },

    description() {
        return (this.card) ? getClueField(Template, 'description') : null;
    },

    hint() {
        return (this.card) ? getClueField(Template, 'hint') : null;
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
    return (turn && card && (turn.owner == Meteor.userId()));
}

function isCurrent(turn, card) {
    return (turn && card) ? (turn.currentCardId == card._id) : false;
}

function getClueField(template, field) {
    if (template.instance().clue.get()) {
        return template.instance().clue.get()[field];
    }
    return null;
}