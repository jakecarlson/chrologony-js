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
        if (user.username) {
            if (!user.profile) {
                user.profile = {};
            }
            user.profile.name = user.username;
        }
        return user;
    });

    Accounts.onLogin(function(login) {
        if (!login.methodArguments[0].resume) {
            Meteor.users.update(Meteor.userId(), {$set: {lastLoggedInAt: new Date()}})
        }
    });

}

