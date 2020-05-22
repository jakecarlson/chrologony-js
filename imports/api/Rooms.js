import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import './Users';
import { Games } from './Games';

export const Rooms = new Mongo.Collection('rooms');

Rooms.schema = new SimpleSchema({
    name: {type: String, max: 40},
    password: {type: String, max: 40},
    currentGameId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    deletedAt: {type: Date, defaultValue: null, optional: true},
});
Rooms.schema.extend(Schemas.timestampable);
Rooms.schema.extend(Schemas.ownable);
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

        // If the user isn't in a room, just pretend like it worked
        if (!Meteor.user().currentRoomId) {
            return userId;
        }

        // Check to see if it's this user's turn currently and end it if so -- but only if it's a multiplayer game
        const room = Meteor.user().currentRoom();
        if (room.currentGameId && (room.players().count() > 1)) {
            const game = room.currentGame();
            if (game.currentTurnId) {
                const turn = game.currentTurn();
                if (turn.ownerId == userId) {
                    Meteor.call('turn.next', room.currentGameId, function(error, id) {
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

            /*
            const bcrypt = Npm.require('bcrypt');
            const saltRounds = 10;
            const myPlaintextPassword = 's0/\/\P4$$w0rD';
            const someOtherPlaintextPassword = 'not_bacon';

            bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
                console.log(hash);
            });
            */


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