import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';

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
        Session.set('logoutSuccess', true);
    }
});

Accounts.onLogin(function(auth) {
    console.log('Authentication Status:');
    console.log(auth);
    Accounts.resetAuthMessages();
    Session.set('loginSuccess', false);
});

Accounts.onLoginFailure(function(res) {
    console.log(res);
    Accounts.resetAuthMessages();
    Session.set('loginError', true);
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