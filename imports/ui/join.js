import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './join.html';

Template.join.onCreated(function joinOnCreated() {

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
                Session.set('registrationSuccess', false);
            }
        });

        // Clear form
        target.name.value = '';
        target.password.value = '';

    },

});