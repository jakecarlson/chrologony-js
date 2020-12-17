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

        Meteor.call('user.guest', username, grecaptcha.getResponse(), function(err, user) {

            grecaptcha.reset();

            if (!err) {

                Meteor.loginWithToken(user.token, function(err, res) {
                    if (!err) {
                        Logger.audit('login', {guest: true});
                        Logger.track('login', {guest: true});
                        Helpers.redirectToPrevious('lobby');
                    } else {
                        setGuestError(err);
                    }
                });

            } else {
                setGuestError(err);
            }

            LoadingState.stop();

        });

    },

});

function setGuestError(err) {
    Logger.log(err);
    Flasher.error(
        'There was an error logging you in as a guest. Please try again.',
        10
    );
}