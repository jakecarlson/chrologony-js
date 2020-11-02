import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Session } from 'meteor/session';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import './guest.html';

Template.guest.onCreated(function guestOnCreated() {

});

Template.guest.helpers({

    signupLink() {
        return FlowRouter.path('signUp');
    },

});

Template.guest.events({

    'submit #guest'(e, i) {

        LoadingState.start(e);

        const target = e.target;
        const username = target.username.value;

        // Short circuit if no username was supplied
        if (username.trim().length == 0) {
            Flasher.set('danger', "You must enter your name.");
            return;
        }

        Meteor.call('user.guest', username, grecaptcha.getResponse(), function(err, id) {
            grecaptcha.reset();
            if (err) {
                Logger.log(err);
                Flasher.set('danger', 'There was an error logging you in as a guest. Please try again.');
            } else {
                Meteor.connection.setUserId(id);
                Helpers.redirectToPrevious('lobby');
            }
            LoadingState.stop();
        });

    },

});