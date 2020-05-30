import { Meteor } from 'meteor/meteor';

// Copy usernames to profile.name for consistency.
Migrations.add({
    version: 5,
    name: 'Copy usernames to profile.name for consistency.',
    up: function() {
        const users = Meteor.users.find({username: {$ne: null}}).fetch();
        users.forEach(function(user) {
           if (user.username) {
               Meteor.users.update(user._id, {$set: {'profile.name': user.username}});
           }
        });
    },
    down: function() {
        const users = Meteor.users.find({username: {$ne: null}}).fetch();
        users.forEach(function(user) {
            if (user.username) {
                Meteor.users.update(user._id, {$unset: {'profile.name': ''}});
            }
        });
    }
});