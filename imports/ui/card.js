import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './card.html';

Template.card.helpers({

    categoryId: function() {
        return (this.card) ? this.card.event.categoryId : null;
    },

    date: function() {
        return (this.card) ? this.card.event.date : null;
    },

    clue: function() {
        return (this.card) ? this.card.event.clue : null;
    },

    hint: function() {
        return (this.card) ? this.card.event.hint : null;
    },





});

Template.card.events({

});
