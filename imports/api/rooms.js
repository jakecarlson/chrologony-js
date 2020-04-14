import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Rooms = new Mongo.Collection('rooms');

if (Meteor.isServer) {
    Meteor.publish('rooms', function roomsPublication(id) {
        return Rooms.find();
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
                createdAt: new Date(),
                owner: Meteor.userId(),
            });
        }

        return roomId;

    },

});