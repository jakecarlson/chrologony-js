import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
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
    winner: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
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
            return Games.find({roomId: roomId}, {sort: {createdAt: -1}, limit: 2});
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
        Permissions.authenticated();

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
        Permissions.authenticated();

        const game = Games.findOne(id);
        return Games.update(
            id,
            {
                $set: {endedAt: new Date(), winnerId: game.currentTurn().ownerId},
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
                    categoryId: RecordId,
                    roomId: RecordId,
                }
            );
            Permissions.authenticated();

            // End the previous game
            const room = Rooms.findOne(attrs.roomId);
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

            Meteor.call('room.setGame', attrs.roomId, gameId, function (error, updated) {
                if (!error) {
                    Logger.log("Updated Room: " + updated);
                }
            });

            Meteor.call('turn.next', gameId, function (error, id) {
                if (!error) {
                    Logger.log("First Turn: " + id);
                }
            });

            return gameId;

        },

    });

}