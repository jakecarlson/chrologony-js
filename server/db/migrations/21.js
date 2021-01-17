import { Meteor } from 'meteor/meteor';

// Add anonymous user.
Migrations.add({

    version: 21,
    name: 'Add anonymous user.',

    up: function() {

        Meteor.users.rawCollection().insert({
            _id: 'anonymous',
            username:'anonymous',
            currentRoomId:'anonymous',
            profile:{
                name:'anonymous',
            }
        });

    },

    down: function() {
        Meteor.users.rawCollection().remove('anonymous');
    }

});