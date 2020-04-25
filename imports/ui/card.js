import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './card.html';

Template.card.helpers({

    id() {
        return (this.card) ? this.card._id : null;
    },

    categoryId() {
        return (this.card) ? this.card.clue.categoryId : null;
    },

    date() {
        return (this.card) ? moment.utc(this.card.clue.date).format("YYYY") : null;
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
        return (this.card) ? (this.turn.currentCardId == this.card._id) : false;
    },



});

Template.card.events({

});
