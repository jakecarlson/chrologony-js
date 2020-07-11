import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Match, check } from 'meteor/check';
import { NonEmptyString, RecordId } from "../startup/validations";
import { Permissions } from '../modules/Permissions';
import SimpleSchema from "simpl-schema";
import { Schemas } from "../modules/Schemas";

import { Rooms } from './Rooms';
import { Turns } from './Turns';

export const Games = new Mongo.Collection('games');

Games.schema = new SimpleSchema({
    roomId: {type: String, regEx: SimpleSchema.RegEx.Id},
    categoryId: {type: String, regEx: SimpleSchema.RegEx.Id},
    streak: {type: Boolean, defaultValue: false},
    currentTurnId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    winnerId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    winPoints: {type: SimpleSchema.Integer, defaultValue: 0},
    equalTurns: {type: Boolean, defaultValue: false},
    cardLimit: {type: SimpleSchema.Integer, defaultValue: 0},
    cardTime: {type: SimpleSchema.Integer, defaultValue: 0},
    turnOrder: {type: String, defaultValue: 'sequential'},
    recycleCards: {type: Boolean, defaultValue: false},
});
Games.schema.extend(Schemas.timestampable);
Games.schema.extend(Schemas.endable);
Games.attachSchema(Games.schema);

Games.helpers({

    room() {
        return Rooms.findOne(this.roomId);
    },

    category() {
        return Categories.findOne(this.categoryId);
    },

    currentTurn() {
        return Turns.findOne(this.currentTurnId);
    },

    turns() {
        return Turns.find({gameId: this._id});
    },

    winner() {
        return Meteor.users.findOne(this.winnerId);
    },

});

if (Meteor.isServer) {

    Meteor.publish('games', function gamePublication(roomId) {
        if (this.userId && roomId) {
            return Games.find(
                {
                    roomId: roomId,
                },
                {
                    fields: {
                        _id: 1,
                        roomId: 1,
                        categoryId: 1,
                        streak: 1,
                        currentTurnId: 1,
                        winnerId: 1,
                    },
                    sort: {
                        createdAt: -1,
                    },
                    limit: 2,
                }
            );
        } else {
            return this.ready();
        }
    });

    Games.deny({
        insert() { return true; },
        remove() { return true; },
    });

}

Meteor.methods({

    // Update
    'game.setTurn'(id, turnId) {
        check(id, RecordId);
        check(turnId, RecordId);
        Permissions.check(Permissions.authenticated());
        checkPlayerIsInRoom(id);

        Logger.log('Update Game Turn: ' + id + ': ' + turnId);

        // If there is an ID, this is an update
        return Games.update(
            id,
            {
                $set: {
                    currentTurnId: turnId,
                }
            }
        );

    },

    // End
    'game.end'(id) {

        check(id, RecordId);
        Permissions.check(Permissions.authenticated());
        checkPlayerIsInRoom(id);

        const game = Games.findOne(id);
        let attrs = {
            endedAt: new Date(),
        }
        if (game.currentTurnId) {
            // attrs.winnerId = game.currentTurn().ownerId;
        }
        return Games.update(
            id,
            {
                $set: attrs,
            }
        );

    },

});

if (Meteor.isServer) {

    Meteor.methods({

        // Insert
        'game.create'(attrs) {

            check(
                attrs,
                {
                    roomId: RecordId,
                    categoryId: RecordId,
                    winPoints: Match.Integer,
                    equalTurns: Boolean,
                    cardLimit: Match.Integer,
                    cardTime: Match.Integer,
                    turnOrder: String,
                    recycleCards: Boolean,
                }
            );
            Permissions.check(Permissions.authenticated());

            // Set the room
            const room = Rooms.findOne(attrs.roomId);
            Permissions.check(Permissions.owned(room));

            // End the previous game
            if (room.currentGameId) {
                const updated = Games.update(
                    room.currentGameId,
                    {
                        $set: {
                            endedAt: new Date(),
                        }
                    }
                );
                if (updated) {
                    Logger.log('Ended Game: ' + room.currentGameId)
                } else {
                    Logger.log('Error Ending Game: ' + room.currentGameId, 3);
                }
            }

            Logger.log('Create Game: ' + JSON.stringify(attrs));

            // Create the new game
            const gameId = Games.insert({
                roomId: attrs.roomId,
                categoryId: attrs.categoryId,
            });

            Meteor.call('room.setGame', attrs.roomId, gameId, function(err, updated) {
                if (!err) {
                    Logger.log("Updated Room: " + updated);
                }
            });

            Meteor.call('turn.next', gameId, function(err, id) {
                if (!err) {
                    Logger.log("First Turn: " + id);
                }
            });

            return gameId;

        },

    });

}

function checkPlayerIsInRoom(gameId) {
    const roomPlayers = Helpers.getIds(Games.findOne(gameId).room().players());
    Permissions.check(roomPlayers.includes(Meteor.userId()));
}