import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './events_filter.html';
import './categories_selector.js';

Template.events_filter.onCreated(function events_filterOnCreated() {
    this.state = new ReactiveDict();
});

Template.events_filter.helpers({

});

Template.events_filter.events({

});