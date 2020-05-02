import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Flasher } from './flasher';
import { LoadingState } from '../startup/LoadingState';

import './register.html';

Template.register.onCreated(function registerOnCreated() {
    this.autorun(() => {

    });
});

Template.register.helpers({

});

Template.register.events({

    'submit form': function(e){

        LoadingState.start(e);

        // Validate the CAPTCHA
        let captcha = grecaptcha.getResponse();
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
                let username = e.target.username.value;
                let password = e.target.password.value;
                let confirmPassword = e.target.password_confirm.value;

                // Validate that the passwords match
                if (password !== confirmPassword) {
                    Flasher.set('danger', "Passwords do not match.")
                    LoadingState.stop();

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
                                Accounts.resetAuthMessages();
                                Flasher.set('danger', errorReason);
                            } else {
                                Accounts.resetAuthMessages();
                                Flasher.set('success', "You have successfully registered. Create or join a room below.");
                            }
                            LoadingState.stop();
                        }
                    );

                }

            }

            LoadingState.stop();

        });

    }

});