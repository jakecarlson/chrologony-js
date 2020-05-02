import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Flasher } from './flasher';
import { LoadingState } from '../startup/LoadingState';

import { Rooms } from '../api/rooms';

import './join.html';

Template.join.onCreated(function joinOnCreated() {

});

Template.join.helpers({

});

Template.join.events({

    'submit #join'(e, i) {

        LoadingState.start(e);

        // Get value from form element
        const target = e.target;
        const attrs = {
            name: target.name.value,
            password: target.password.value,
        };

        Meteor.call('room.findOrCreate', attrs, function(error, id) {
            if (error) {
                i.state.set('error', true);
            } else {
                console.log("Room Set: " + id);
                Accounts.resetAuthMessages();
                target.name.value = '';
                target.password.value = '';
                const room = Rooms.findOne(id);
                Flasher.set('success', "Success! Invite others to join with the password <strong>" + room.password + "</strong>.");
            }
            LoadingState.stop();
        });

    },

});