import { Meteor } from 'meteor/meteor';
import { Rooms } from '../../../imports/api/Rooms';

// Add anonymous user and room.
Migrations.add({

    version: 21,
    name: 'Add anonymous user and room.',

    up: function() {

        Meteor.users.rawCollection().insert({
            _id: 'anonymous',
            username:'anonymous',
            currentRoomId:'anonymous',
            profile:{
                name:'anonymous',
            }
        });

        Rooms.rawCollection().insert({
            _id: 'anonymous',
            name: 'anonymous',
            ownerId: 'anonymous',
            deletedAt: null,
        });

    },

    down: function() {
        Rooms.rawCollection().remove('anonymous');
        Meteor.users.rawCollection().remove('anonymous');
    }

});