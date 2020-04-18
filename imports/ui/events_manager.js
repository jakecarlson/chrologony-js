import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './events_manager.html';
import './event.js';
import './events_filter.js';
import { Events } from "../api/events";

Template.events_manager.onCreated(function events_managerOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('keyword', '');
    this.state.set('owned', false);
    this.state.set('private', false);
    this.state.set('categoryId', false);
    Meteor.subscribe('events');
});

Template.events_manager.helpers({
    cardEvents() {
        
        let selector = {};

        // keyword
        let keyword = Template.instance().state.get('keyword');
        if (keyword.length > 2) {
            selector.$or = [
                {clue: {$regex: keyword, $options: 'i'}},
                {date: {$regex: keyword, $options: 'i'}},
                {hint: {$regex: keyword, $options: 'i'}},
            ];
        }

        // owned
        if (Template.instance().state.get('owned')) {
            selector.owner = Meteor.userId();
        }

        // private
        let isPrivate = Template.instance().state.get('private');

        // category
        let categoryId = Template.instance().state.get('categoryId');
        if (categoryId) {
            selector.categoryId = categoryId;
        }

        console.log(selector);
        return Events.find(selector, {sort:{date:-1}});

    },
});

Template.events_manager.events({

    'keyup #eventsFilter [name="keyword"]'(e, i) {
        i.state.set('keyword', e.target.value);
    },

    'change #eventsFilter [name="categoryId"]'(e, i) {
        let categoryId = e.target.options[e.target.selectedIndex].value;
        i.state.set('categoryId', categoryId);
    },

    'change #eventsFilter [name="owned"]'(e, i) {
        i.state.set('owned', e.target.checked);
    },

    'change #eventsFilter [name="private"]'(e, i) {
        i.state.set('private', e.target.checked);
    },

});