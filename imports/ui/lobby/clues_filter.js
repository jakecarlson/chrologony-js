import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { LoadingState } from "../../modules/LoadingState";

import './clues_filter.html';
import '../categories_selector.js';

Template.clues_filter.onCreated(function clues_filterOnCreated() {
    this.changed = new ReactiveVar(false);
});

Template.clues_filter.helpers({

    submitDisabled() {
        return (LoadingState.active() || !Template.instance().changed.get());
    },

    months() {
        let months = [];
        for (let i = 1; i < 13; ++i) {
            months.push(Formatter.zeroPad(i));
        }
        return months;
    },

    days() {
        let days = [];
        for (let i = 1; i < 32; ++i) {
            days.push(Formatter.zeroPad(i));
        }
        return days;
    },

    categoryLabel() {
        return this.category.label();
    },

    dataReady() {
        return this.category;
    },

});

Template.clues_filter.events({

    'keyup [type="text"], keyup [type="number"], change [type="number"], change [type="hidden"], change [type="checkbox"], change select'(e, i) {
        i.changed.set(true);
    },

    'submit #cluesFilter'(e, i) {
        i.changed.set(false);
    },

});