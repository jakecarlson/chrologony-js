import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
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

        Meteor.call('room.joinOrCreate', name, password, function(err, id) {
            if (err) {
                Logger.log(err);
                Flasher.set('danger', "That room exists, but the password is wrong.");
                LoadingState.stop();
            } else {
                Logger.log("Room Set: " + id);
                Meteor.subscribe('rooms');
                target.name.value = '';
                target.password.value = '';
                Flasher.set('success', "Success! Invite others to join using the Room Link.");
                FlowRouter.go('room', {id: id});
            }
        });

    },

});