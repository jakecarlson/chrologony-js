import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Flasher } from './flasher';
import { LoadingState } from '../startup/LoadingState';

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
                Logger.log("Room Set: " + id);
                target.name.value = '';
                target.password.value = '';
                Flasher.set('success', "Success! Invite others to join.");
            }
            LoadingState.stop();
        });

    },

});