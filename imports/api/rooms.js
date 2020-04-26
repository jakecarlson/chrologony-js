import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Rooms = new Mongo.Collection('rooms');

if (Meteor.isServer) {
    Meteor.publish('rooms', function roomsPublication() {
        if (this.userId) {
            return Rooms.find();
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

    'room.findOrCreate'(attrs) {

        check(attrs.name, String);
        check(attrs.password, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        let roomId = false;

        let rooms = Rooms.find(attrs, {limit: 1, sort:{createdAt:-1}});
        if (rooms.count() > 0) {
            roomId = rooms.fetch()[0]._id;
        } else {
            roomId = Rooms.insert({
                name: attrs.name,
                password: attrs.password,
                currentGameId: null,
                createdAt: new Date(),
                owner: Meteor.userId(),
            });
        }

        Meteor.call('user.update', {_id: this.userId, currentRoomId: roomId}, function(error, updated) {
            if (!error) {
                console.log("Updated User: " + updated);
            }
        });

        return roomId;

    },

    'room.leave'() {

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        let previousRoomId = Meteor.user().currentRoomId;
        Meteor.users.update(this.userId, {
            $set: {
                currentRoomId: null,
            }
        });

        return previousRoomId;

    },

    // Update
    'room.update'(attrs) {

        check(attrs._id, String);
        check(attrs.currentGameId, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Update Room: ' + attrs._id);
        console.log(attrs);

        // If there is an ID, this is an update
        return Rooms.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    currentGameId: attrs.currentGameId,
                    updatedAt: new Date(),
                }
            }
        );

    },

});