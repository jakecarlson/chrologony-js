import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import SimpleSchema from "simpl-schema";
import { Schema } from "./Schema";

import { Games } from '../api/games';
import { Turns } from '../api/turns';

export const Rooms = new Mongo.Collection('rooms');

Rooms.schema = new SimpleSchema({
    name: {type: String, max: 40},
    password: {type: String, max: 40},
    currentGameId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    deletedAt: {type: Date, defaultValue: null, optional: true},
});
Rooms.schema.extend(Schema.timestamps);
Rooms.schema.extend(Schema.owned);
Rooms.attachSchema(Rooms.schema);

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

    Rooms.deny({
        insert() { return true; },
        remove() { return true; },
    });

}

Meteor.methods({

    /*
    // Join
    'room.join'(roomId) {

        check(roomId, RecordId);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Update User: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Meteor.users.update(
            {
                _id: this.userId,
            },
            {
                $set: {
                    currentRoomId: roomId,
                    updatedAt: new Date(),
                }
            }
        );

    },
     */

    'room.leave'(userId = false) {

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // If no userID was provided, use the current user
        if (!userId) {
            userId = Meteor.userId();
        }

        // Make sure the user is the owner of the room that the other user is in, or the user him/herself
        const roomId = Meteor.users.findOne(userId).currentRoomId;
        const room = Rooms.findOne(roomId);
        if ((userId != Meteor.userId()) && (room.owner != Meteor.userId())) {
            throw new Meteor.Error('not-authorized');
        }

        // Check to see if it's this users turn currently and end it if so
        if (room.currentGameId) {
            let game = Games.findOne(room.currentGameId);
            if (game && game.currentTurnId) {
                let turn = Turns.findOne(game.currentTurnId);
                if (turn && (turn.userId == userId)) {
                    Meteor.call('turn.next', game._id, function(error, id) {
                        if (!error) {
                            Logger.log("Start Turn: " + id);
                        }
                    });
                }
            }
        }

        Meteor.users.update(userId, {
            $set: {
                currentRoomId: null,
            }
        });

        return userId;

    },

    // Set Game
    'room.setGame'(attrs) {

        check(
            attrs,
            {
                _id: RecordId,
                currentGameId: RecordId,
            }
        );

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
                }
            }
        );

    },

    // Delete
    'room.remove'(id) {

        check(id, RecordId);

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

        'room.joinOrCreate'(attrs) {

            check(
                attrs,
                {
                    name: NonEmptyString,
                    password: NonEmptyString,
                }
            );

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
                });
            }

            Meteor.users.update(
                {
                    _id: Meteor.userId(),
                },
                {
                    $set: {
                        currentRoomId: roomId,
                    }
                }
            );

            return roomId;

        },

    });

}