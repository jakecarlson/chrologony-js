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

        if (options.profile) {
            user.profile = options.profile;
        }

        if (!user.profile) {
            user.profile = {};
        }

        if (!user.profile.name && user.username) {
            user.profile.name = user.username;
        }

        if (
            user.profile &&
            user.profile.name &&
            (user.profile.name == 'object') &&
            user.profile.name.firstName &&
            user.profile.name.lastName
        ) {
            user.profile.name = user.profile.name.firstName + ' ' + user.profile.name.lastName;
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

