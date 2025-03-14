import { Template } from 'meteor/templating';

import { Categories } from '../../api/Categories';
import { Cards } from '../../api/Cards';

import './options.html';

Template.options.onCreated(function optionsOnCreated() {

});

Template.options.helpers({

    dataReady() {
        return this.game;
    },

    category() {
        const category = Categories.findOne(this.game.categoryId);
        return (category) ? category.label() : null;
    },

    boolean(val) {
        return (val ? 'Yes' : 'No');
    },

    limit(val, unit = '') {
        return (val ? val + ' ' + Formatter.pluralize(unit, val) : 'None');
    },

    difficulty(val) {
        return Cards.DIFFICULTIES[val];
    },

});

Template.options.events({

});