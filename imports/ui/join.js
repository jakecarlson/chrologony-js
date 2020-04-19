import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './join.html';

Template.join.onCreated(function joinOnCreated() {
    this.state = new ReactiveDict();

});

Template.join.helpers({

});

Template.join.events({

    'submit #join'(e) {

        e.preventDefault();

        // Get value from form element
        const target = e.target;
        const attrs = {
            name: target.name.value,
            password: target.password.value,
        };

        Meteor.call('room.findOrCreate', attrs, function(error, id) {
            if (!error) {
                console.log("Room Set: " + id);
            }
        });

        // Clear form
        target.name.value = '';
        target.password.value = '';

    },

});