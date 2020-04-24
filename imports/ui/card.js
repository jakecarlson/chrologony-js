import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './card.html';

Template.card.helpers({

    categoryId: function() {
        return (this.card) ? this.card.clue.categoryId : null;
    },

    date: function() {
        return (this.card) ? this.card.clue.date : null;
    },

    description: function() {
        return (this.card) ? this.card.clue.description : null;
    },

    hint: function() {
        return (this.card) ? this.card.clue.hint : null;
    },

});

Template.card.events({

});
