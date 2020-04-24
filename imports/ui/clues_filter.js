import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './clues_filter.html';
import './categories_selector.js';

Template.clues_filter.onCreated(function clues_filterOnCreated() {
    this.state = new ReactiveDict();
});

Template.clues_filter.helpers({

});

Template.clues_filter.events({

});