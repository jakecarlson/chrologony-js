import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from './Permissions';
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
Rooms.schema.extend(Schema.timestampable);
Rooms.schema.extend(Schema.ownable);
Rooms.attachSchema(Rooms.schema);

Rooms.helpers({

    currentGame() {
        return Games.findOne(this.currentGameId);
    },

    players() {
        return Meteor.users.find({currentRoomId: this._id});
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

});

if (Meteor.isServer) {

    Meteor.publish('rooms', function roomsPublication() {
        if (this.userId && Meteor.user().currentRoomId) {
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

    'room.leave'(userId = false) {

        // If no userID was provided, use the current user
        if (!userId) {
            userId = Meteor.userId();
        }

        check(userId, RecordId);
        Permissions.authenticated();

        // Make sure the user is the owner of the room that the other user is in, or the user him/herself
        if ((userId != Meteor.userId()) && (Meteor.user().currentRoom().ownerId != Meteor.userId())) {
            throw new Meteor.Error('not-authorized');
        }

        // Check to see if it's this user's turn currently and end it if so
        if (Meteor.user().currentRoom().currentGameId) {
            if (Meteor.user().currentRoom().currentGame() && Meteor.user().currentRoom().currentGame().currentTurnId) {
                if (Meteor.user().currentRoom().currentGame().currentTurn() && (Meteor.user().currentRoom().currentGame().currentTurn().ownerId == userId)) {
                    Meteor.call('turn.next', Meteor.user().currentRoom().currentGameId, function(error, id) {
                        if (!error) {
                            Logger.log("Start Turn: " + id);
                        }
                    });
                }
            }
        }

        Meteor.users.update(
            userId,
            {
                $set: {
                    currentRoomId: null,
                }
            }
        );

        return userId;

    },

    // Set Game
    'room.setGame'(id, gameId) {

        check(id, RecordId);
        check(gameId, RecordId);
        Permissions.authenticated();

        Logger.log('Set Room ' + id + ' Game to ' + gameId);

        // If there is an ID, this is an update
        return Rooms.update(
            {
                _id: id,
                ownerId: Meteor.userId(),
            },
            {
                $set: {
                    currentGameId: gameId,
                }
            }
        );

    },

    // Delete
    'room.remove'(id) {

        check(id, RecordId);
        Permissions.authenticated();

        Logger.log('Delete Room: ' + id);

        // If there is an ID, this is an update
        return Rooms.update(
            {
                _id: id,
                ownerId: Meteor.userId(),
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

        'room.joinOrCreate'(name, password) {

            check(name, NonEmptyString);
            check(password, NonEmptyString);
            Permissions.authenticated();

            let roomId = false;

            // If the room exists, validate the password
            const room = Rooms.findOne(
                {
                    deletedAt: null,
                    name: {
                        $regex: new RegExp(`^${name}$`),
                        $options: 'i',
                    },
                 },
                {
                    limit: 1,
                    sort: {createdAt: -1}
                }
            );
            if (room) {
                if ((room.ownerId != this.userId) && (room.password !== password)) {
                    throw new Meteor.Error('not-authorized');
                }
                roomId = room._id;
            } else {
                roomId = Rooms.insert({
                    name: name,
                    password: password,
                });
            }

            Meteor.users.update(
                Meteor.userId(),
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