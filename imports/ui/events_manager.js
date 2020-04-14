import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './events_manager.html';
import './event.js';
import './categories_selector.js';
import { Events } from "../api/events";

Template.events_manager.onCreated(function events_managerOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('categoryId', false);
    Meteor.subscribe('events');
});

Template.events_manager.helpers({
    cardEvents() {
        let categoryId = Template.instance().state.get('categoryId');
        let selector = {};
        if (categoryId) {
            selector.categoryId = categoryId;
        }
        return Events.find(selector, {sort:{date:-1}});
    },
});

Template.events_manager.events({

    'change thead select'(e, i) {
        let categoryId = e.target.options[e.target.selectedIndex].value;
        i.state.set('categoryId', categoryId);
    },

});