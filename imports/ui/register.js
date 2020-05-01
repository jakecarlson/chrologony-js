import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import './register.html';

Template.register.onCreated(function registerOnCreated() {
    this.autorun(() => {

    });
});

Template.register.helpers({
    error() {
        return Session.get('registrationError');
    },
});

Template.register.events({

    'submit form': function(e){

        e.preventDefault();

        // Validate the CAPTCHA
        let captcha = grecaptcha.getResponse();
        grecaptcha.reset();
        Meteor.call('user.validateCaptcha', captcha, function(error, result) {

            // Throw an error if the user hasn't checked the CAPTCHA box at all
            if (!result) {
                Session.set('registrationError', "You must check the box below to continue.");

            // If there was a problem with the CAPTCHA, display the error
            } else if (error) {
                Session.set('registrationError', result.error);

            // Otherwise continue to validate
            } else {

                // Get the inputs
                let username = e.target.username.value;
                let password = e.target.password.value;
                let confirmPassword = e.target.password_confirm.value;

                // Validate that the passwords match
                if (password !== confirmPassword) {
                    Session.set('registrationError', "Passwords do not match.");

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
                                Session.set('registrationError', errorReason);
                            } else {
                                Accounts.resetAuthMessages();
                                Session.set('registrationSuccess', true);
                            }
                        }
                    );

                }

            }

        });

    }

});