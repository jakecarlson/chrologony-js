import { Meteor } from 'meteor/meteor';

// Add lastActiveAt to users.
Migrations.add({

    version: 25,
    name: 'Add lastActiveAt to users.',

    up: function() {
        Meteor.users.update({}, {$set: {lastActiveAt: null}}, {multi: true});
    },

    down: function() {
        Meteor.users.update({}, {$unset: {lastActiveAt: 1}}, {multi: true});
    },

});