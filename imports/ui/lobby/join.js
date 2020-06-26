import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import './join.html';

Template.join.onCreated(function joinOnCreated() {
    this.action = null;
});

Template.join.helpers({

});

Template.join.events({

    'click button'(e, i) {
        i.action = e.target.name;
    },

    'submit #join'(e, i) {

        LoadingState.start(e);

        const target = e.target;
        const name = target.name.value;
        const password = target.password.value;

        if (i.action == 'create') {
            Meteor.call('room.create', name, password, function(err, id) {
                if (err) {
                    Logger.log(err);
                    Flasher.set('danger', "A room with that name already exists.");
                    LoadingState.stop();
                } else {
                    processSuccessfulSubmit(target, id);
                    LoadingState.stop();
                    TourGuide.resume();
                }
            });
        } else {
            Meteor.call('room.join', name, password, function(err, id) {
                if (err) {
                    Logger.log(err);
                    Flasher.set('danger', "That name and password don't match an existing room.");
                    LoadingState.stop();
                } else {
                    processSuccessfulSubmit(target, id);
                }
            });
        }

    },

});

function processSuccessfulSubmit(form, roomId) {
    Logger.log("Room Set: " + roomId);
    Meteor.subscribe('rooms');
    form.name.value = '';
    form.password.value = '';
    Flasher.set('success', "Success! Invite others to join using the Room Link.");
    FlowRouter.go('room', {id: roomId});
}