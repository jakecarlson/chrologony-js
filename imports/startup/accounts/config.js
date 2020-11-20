import { Meteor } from "meteor/meteor";
import { Accounts } from 'meteor/accounts-base';

Accounts.config({
    sendVerificationEmail: true,
    ambiguousErrorMessages: false,
    defaultFieldSelector: {
        username: 1,
        emails: 1,
        createdAt: 1,
        profile: 1,
        services: 1,
        currentRoomId: 1,
        joinedRoomAt: 1,
        guest: 1,
    },
});

if (Meteor.isServer) {

    Accounts.onCreateUser(function(options, user) {

        Logger.log('New User Data:');
        Logger.log(options);
        if (options.profile) {
            user.profile = options.profile;
        }

        if (!user.profile) {
            user.profile = {};
        }

        if (!user.profile.name && user.username) {
            user.profile.name = user.username;
        }

        if (typeof(user.profile.name) === 'object') {
            let names = [];
            if (user.profile.name.firstName) {
                names.push(user.profile.name.firstName);
            }
            if (user.profile.name.lastName) {
                names.push(user.profile.name.lastName);
            }
            if (names.length > 0) {
                user.profile.name = names.join(' ');
            }
        }

        if (!user.profile.name) {
            user.profile.name = 'Unknown';
        }

        return user;

    });

    Accounts.onLogin(function(login) {
        if (!login.methodArguments[0].resume) {
            Meteor.users.update(Meteor.userId(), {$set: {lastLoggedInAt: new Date()}})
        }
    });

}

