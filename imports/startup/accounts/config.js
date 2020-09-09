import { Accounts } from 'meteor/accounts-base';

Accounts.config({
    // sendVerificationEmail: true,
    ambiguousErrorMessages: true,
    defaultFieldSelector: {
        username: 1,
        emails: 1,
        createdAt: 1,
        profile: 1,
        services: 1,
        currentRoomId: 1,
        joinedRoomAt: 1,
    },
});

