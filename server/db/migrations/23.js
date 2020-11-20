import { Meteor } from 'meteor/meteor';
import { Accounts } from "meteor/accounts-base";

// Add Apple sign in.
Migrations.add({

    version: 23,
    name: 'Add Apple sign in.',

    up: function() {
        Accounts.loginServiceConfiguration.upsert(
            {
                service: 'apple',
            },
            {
                $set: Meteor.settings.apple,
            }
        );
    },

    down: function() {

    },

});