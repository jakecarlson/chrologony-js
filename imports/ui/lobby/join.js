import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

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
        const name = target.name.value;
        const password = target.password.value;

        Meteor.call('room.joinOrCreate', name, password, function(error, id) {
            if (error) {
                Logger.log(error);
                Flasher.set('danger', "That room exists, but the password is wrong.");
            } else {
                Logger.log("Room Set: " + id);
                Meteor.subscribe('rooms');
                target.name.value = '';
                target.password.value = '';
                Flasher.set('success', "Success! Invite others to join.");
            }
        });

    },

});