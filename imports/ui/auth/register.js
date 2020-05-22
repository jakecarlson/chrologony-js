import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import './register.html';

Template.register.onCreated(function registerOnCreated() {
    this.autorun(() => {
        FlowRouter.watchPathChange();
    });
});

Template.register.helpers({

});

Template.register.events({

    'submit form': function(e){

        LoadingState.start(e);

        // Validate the CAPTCHA
        const captcha = grecaptcha.getResponse();
        grecaptcha.reset();
        Meteor.call('user.validateCaptcha', captcha, function(error, result) {

            // Throw an error if the user hasn't checked the CAPTCHA box at all
            if (!result) {
                Flasher.set('danger', "You must check the box below to continue.");

            // If there was a problem with the CAPTCHA, display the error
            } else if (error) {
                Flasher.set('danger', result.error);

            // Otherwise continue to validate
            } else {

                // Get the inputs
                const username = e.target.username.value;
                const password = e.target.password.value;
                const confirmPassword = e.target.password_confirm.value;

                // Validate that the passwords match
                if (password !== confirmPassword) {
                    Flasher.set('danger', "Passwords do not match.");

                // If so, continue on to attempt to register the user
                } else {

                    Accounts.createUser(
                        {
                            username: username,
                            password: password,
                        },
                        function(error) {
                            if (error) {
                                let errorReason = error.reason;
                                if (errorReason.substr(-1) != '.') {
                                    errorReason += '.';
                                }
                                Flasher.set('danger', errorReason);
                            } else {
                                Flasher.set('success', "You have successfully registered. Create or join a room below.");
                            }

                        }
                    );
                    FlowRouter.go('lobby');

                }

            }

        });

    },

    'click .login': function(e, i){
        e.preventDefault();
        Flasher.clear();
        FlowRouter.go('home');
    },

});