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
Rooms.schema.extend(Schema.timestamps);
Rooms.schema.extend(Schema.owned);
Rooms.attachSchema(Rooms.schema);

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
        const roomId = Meteor.users.findOne(userId).currentRoomId;
        const room = Rooms.findOne(roomId);
        if ((userId != Meteor.userId()) && (room.owner != Meteor.userId())) {
            throw new Meteor.Error('not-authorized');
        }

        // Check to see if it's this user's turn currently and end it if so
        if (room.currentGameId) {
            let game = Games.findOne(room.currentGameId);
            if (game && game.currentTurnId) {
                let turn = Turns.findOne(game.currentTurnId);
                if (turn && (turn.owner == userId)) {
                    Meteor.call('turn.next', game._id, function(error, id) {
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
                owner: Meteor.userId(),
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
                owner: Meteor.userId(),
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
            let room = Rooms.findOne(
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
                if ((room.owner != this.userId) && (room.password !== password)) {
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