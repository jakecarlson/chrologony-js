import { Accounts } from 'meteor/accounts-base';
import { Flasher } from '../ui/flasher';
import { LoadingState } from '../modules/LoadingState';

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
    if (error) {
        Logger.log(error, 2);
    } else {
        Flasher.set('success', "You have successfully logged out.");
    }
    LoadingState.stop();
});

Accounts.onLogin(function(auth) {
    Logger.log('Authentication Status: ' + JSON.stringify(auth));
    LoadingState.stop();
});

Accounts.onLoginFailure(function(res) {
    Logger.log(res, 2);
    Flasher.set('danger', "Login failed. Please try again.");
});

if (Meteor.isServer) {

    Accounts.validateNewUser(function(res) {
        if (res.error) {
            Logger.log(res.error, 2);
        }
    });

    Accounts.onCreateUser(function(user) {
        Logger.log('User Created: ' + JSON.stringify(user));
    });

    Accounts.validateLoginAttempt(function(res) {
        Logger.log('Validate Login: ' + JSON.stringify(res));
    });

}