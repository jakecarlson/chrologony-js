import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString } from "../startup/validations";

export const Rooms = new Mongo.Collection('rooms');

if (Meteor.isServer) {
    Meteor.publish('rooms', function roomsPublication() {
        if (this.userId) {
            return Rooms.find({
                _id: Meteor.user().currentRoomId,
                deletedAt: null,
            });
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

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

        check(attrs._id, NonEmptyString);
        check(attrs.currentGameId, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Update Room: ' + attrs._id + ' ' + JSON.stringify(attrs));

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

    // Delete
    'room.delete'(id) {

        check(id, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Delete Room: ' + id);

        // If there is an ID, this is an update
        return Rooms.update(
            {
                _id: id,
            },
            {
                $set: {
                    deletedAt: new Date(),
                }
            }
        );

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        'room.findOrCreate'(attrs) {

            check(attrs.name, NonEmptyString);
            check(attrs.password, NonEmptyString);

            // Make sure the user is logged in before inserting a task
            if (! Meteor.userId()) {
                throw new Meteor.Error('not-authorized');
            }

            let roomId = false;

            // If the room exists, validate the password
            let room = Rooms.findOne(
                {
                    deletedAt: null,
                    name: {
                        $regex: new RegExp(`^${attrs.name}$`),
                        $options: 'i',
                    },
                 },
                {
                    limit: 1,
                    sort: {createdAt: -1}
                }
            );
            if (room) {
                if ((room.owner != this.userId) && (room.password !== attrs.password)) {
                    throw new Meteor.Error('not-authorized');
                }
                roomId = room._id;
            } else {
                roomId = Rooms.insert({
                    name: attrs.name,
                    password: attrs.password,
                    currentGameId: null,
                    owner: Meteor.userId(),
                    createdAt: new Date(),
                    updateAt: new Date(),
                    deletedAt: null,
                });
            }

            /*
            Meteor.call('user.update', {_id: this.userId, currentRoomId: roomId}, function(error, updated) {
                if (!error) {
                    Logger.log("Updated User: " + updated);
                }
            });
             */
            Meteor.users.update(
                {
                    _id: Meteor.userId(),
                },
                {
                    $set: {
                        currentRoomId: roomId,
                        updatedAt: new Date(),
                    }
                }
            );

            return roomId;

        },

    });

}