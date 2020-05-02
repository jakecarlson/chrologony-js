import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';
import { Flasher } from '../ui/flasher';
import { LoadingState } from './LoadingState';

Accounts.config({
    defaultFieldSelector: {
        username: 1,
        emails: 1,
        createdAt: 1,
        profile: 1,
        services: 1,
        currentRoomId: 1,
    }
});

Accounts.onLogout(function(error) {
    Accounts.resetAuthMessages();
    if (error) {
        console.log(error);
    } else {
        Flasher.set('success', "You have successfully logged out.");
    }
    LoadingState.stop();
});

Accounts.onLogin(function(auth) {
    console.log('Authentication Status:');
    console.log(auth);
    Accounts.resetAuthMessages();
    Flasher.set('success', "You have successfully logged in.");
    LoadingState.stop();
});

Accounts.onLoginFailure(function(res) {
    console.log(res);
    Accounts.resetAuthMessages();
    Session.set('loginError', true);
    LoadingState.stop();
});

if (Meteor.isServer) {

    Accounts.validateNewUser(function(res) {
        if (res.error) {
            Session.set('registrationError', res.error.message);
            console.log(res.error);
        }
    });

    Accounts.onCreateUser(function(user) {
        console.log(user);
        console.log("user created");
    });

    Accounts.validateLoginAttempt(function(res) {
        console.log(res);
        console.log("validate login");
    });

}

Accounts.resetAuthMessages = function() {
    Session.set('registrationSuccess', false);
    Session.set('registrationError', false);
    Session.set('loginSuccess', false);
    Session.set('loginError', false);
    Session.set('logoutSuccess', false);
}