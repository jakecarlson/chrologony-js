import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import { Rooms } from '../api/rooms';

import './body.html';
import './room.js';
import './categories_manager.js';
import './events_manager.js';

Template.body.onCreated(function bodyOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('rooms', Session.get('room'));
});

Template.body.helpers({
    currentRoom() {
        return Rooms.findOne(Session.get('room'));
    },
});

Template.body.events({

    'submit #join'(e) {
        // Prevent default browser form submit
        e.preventDefault();

        // Get value from form element
        const target = e.target;
        const attrs = {
            name: target.name.value,
            password: target.password.value,
        };

        Meteor.call('room.findOrCreate', attrs, function(error, id) {
            if (!error) {
                Session.set('room', id);
            }
        });

        // Clear form
        target.name.value = '';
        target.password.value = '';

    },

});