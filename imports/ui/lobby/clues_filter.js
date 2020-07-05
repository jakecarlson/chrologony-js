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

});

Template.clues_filter.events({

    'keyup #cluesFilter [name="keyword"]'(e, i) {
        i.changed.set(true);
    },

    'change #cluesFilter [name="owned"]'(e, i) {
        i.changed.set(true);
    },

    'change #cluesFilter [name="categoryId"]'(e, i) {
        i.changed.set(true);
    },

    'submit #cluesFilter'(e, i) {
        i.changed.set(false);
    },

});