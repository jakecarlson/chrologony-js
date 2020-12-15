import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { LoadingState } from '../../modules/LoadingState';

import './guest.html';

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
            Flasher.error('You must enter your name.');
            return;
        }

        Meteor.call('user.guest', username, grecaptcha.getResponse(), function(err, id) {
            grecaptcha.reset();
            if (err) {
                Logger.log(err);
                Flasher.error(
                    'There was an error logging you in as a guest. Please try again.',
                    10
                );
            } else {
                Meteor.connection.setUserId(id);
                Logger.audit('login', {guest: true});
                Logger.track('login', {guest: true});
                Helpers.redirectToPrevious('lobby');
            }
            LoadingState.stop();
        });

    },

});