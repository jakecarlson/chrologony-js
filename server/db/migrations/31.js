import { Meteor } from 'meteor/meteor';

// Add profile defaults users.
Migrations.add({

    version: 31,
    name: 'Add profile defaults users.',

    up: function() {
        Meteor.users.update(
            {},
            {
                $set: {
                    'profile.pageSize': Meteor.users.DEFAULT_PAGE_SIZE,
                    'profile.muted': false,
                }
            },
            {multi: true}
        );
    },

    down: function() {
        Meteor.users.update({}, {$unset: {'profile.pageSize': 1, 'profile.muted': 1}}, {multi: true});
    },

});