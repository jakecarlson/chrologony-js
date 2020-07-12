import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import './Users';
import { Games } from './Games';

export const Rooms = new Mongo.Collection('rooms');

Rooms.schema = new SimpleSchema({
    name: {type: String, max: 40},
    password: {type: String, max: 72},
    currentGameId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
});
Rooms.schema.extend(Schemas.timestampable);
Rooms.schema.extend(Schemas.ownable);
Rooms.schema.extend(Schemas.softDeletable);
Rooms.attachSchema(Rooms.schema);

Rooms.helpers({

    currentGame() {
        return Games.findOne(this.currentGameId);
    },

    players() {
        return Meteor.users.find(
            {
                currentRoomId: this._id
            },
            {
                sort: {joinedRoomAt: 1, 'profile.name': 1},
            }
        );
    },

    owner() {
        return Meteor.users.findOne(this.ownerId);
    },

});

if (Meteor.isServer) {

    publishComposite('rooms', {
        find() {
            const roomId = Meteor.user().currentRoomId;
            if (this.userId && roomId) {
                return Rooms.find(
                    {
                        _id: roomId,
                        deletedAt: null,
                    },
                    {
                        fields: {
                            _id: 1,
                            name: 1,
                            currentGameId: 1,
                            ownerId: 1,
                            token: 1,
                        },
                        transform: function(doc) {
                            doc.token = Hasher.md5.hash(doc._id);
                            return doc;
                        },
                    }
                );
            } else {
                return this.ready();
            }
        },

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
        Permissions.check(Permissions.authenticated());

        // Make sure the user is the owner of the room that the other user is in, or the user him/herself
        Permissions.check((
            (userId != Meteor.userId()) &&
            Permissions.owned(Meteor.user().currentRoom())
        ));

        // If the user isn't in a room, just pretend like it worked
        if (!Meteor.user().currentRoomId) {
            return userId;
        }

        // Check to see if it's this user's turn currently and end it if so -- but only if it's a multiplayer game
        const room = Meteor.user().currentRoom();
        if (room && room.currentGameId && (room.players().count() > 1)) {
            const game = room.currentGame();
            if (game.currentTurnId) {
                const turn = game.currentTurn();
                if (turn.ownerId == userId) {
                    Meteor.call('turn.next', room.currentGameId, function(err, id) {
                        if (!err) {
                            Logger.log("Start Turn: " + id);
                        }
                    });
                }
            }
        }

        setRoom(null, userId);

        return userId;

    },

    // Set Game
    'room.setGame'(id, gameId) {

        check(id, RecordId);
        if (gameId) {
            check(gameId, RecordId);
        }
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.owned(Rooms.findOne(id)));

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
        Permissions.check(Permissions.authenticated());
        Permissions.check(Permissions.owned(Rooms.findOne(id)));

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

        'room.join'(name, password) {

            const room = validateAndGetByName(name, password);

            let roomId = null;
            if (room) {
                Permissions.check(((room.ownerId == this.userId) || Hasher.bcrypt.match(password, room.password)));
                roomId = room._id;
            } else {
                throw new Meteor.Error('not-found', 'Room does not exist.');
            }

            setRoom(roomId);

            return roomId;

        },

        'room.joinByToken'(roomId, token) {

            check(roomId, RecordId);
            check(token, NonEmptyString);
            Permissions.check(Permissions.authenticated());

            if (Hasher.md5.hash(roomId) == token.trim()) {
                setRoom(roomId);
                return roomId;
            } else {
                setRoom(null);
                throw new Meteor.Error('not-authorized');
            }

        },

        'room.create'(name, password) {

            const room = validateAndGetByName(name, password);

            if (room) {
                throw new Meteor.Error('duplicate-object', 'A room with that name already exists.');
            }

            const roomId = Rooms.insert({
                name: name,
                password: Hasher.bcrypt.hash(password),
            });

            setRoom(roomId);

            return roomId;

        },

    });

}

function setRoom(id, userId = null) {
    if (!userId) {
        userId = Meteor.userId();
    }
    return Meteor.users.update(
        userId,
        {
            $set: {
                currentRoomId: id,
                joinedRoomAt: (id) ? new Date() : null,
            }
        }
    );
}

function validateAndGetByName(name, password) {

    check(name, NonEmptyString);
    check(password, NonEmptyString);
    Permissions.check(Permissions.authenticated());

    let roomId = false;

    return Rooms.findOne(
        {
            deletedAt: null,
            name: {
                $regex: new RegExp(`^${name}$`),
                $options: 'i',
            },
        },
        {
            sort: {
                createdAt: -1,
            },
        }
    );

}