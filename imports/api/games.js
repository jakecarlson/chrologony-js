import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString } from "../startup/validations";
import SimpleSchema from "simpl-schema";
import { Schema } from "./Schema";

import { Rooms } from '../api/rooms';
import { Turns } from '../api/turns';

export const Games = new Mongo.Collection('games');

Games.schema = new SimpleSchema({
    roomId: {type: String, regEx: SimpleSchema.RegEx.Id},
    categoryId: {type: String, regEx: SimpleSchema.RegEx.Id},
    streak: {type: Boolean, defaultValue: false},
    currentTurnId: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    winner: {type: String, regEx: SimpleSchema.RegEx.Id, defaultValue: null, optional: true},
    startedAt: {type: Date, defaultValue: new Date(), optional: true},
    endedAt: {type: Date, defaultValue: null, optional: true},
});
Games.schema.extend(Schema.timestamps);
Games.attachSchema(Games.schema);

if (Meteor.isServer) {
    Meteor.publish('games', function gamePublication(roomId) {
        if (this.userId && roomId) {
            return Games.find({roomId: roomId}, {sort: {createdAt: -1}, limit: 2});
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

    // Update
    'game.update'(attrs) {

        check(attrs._id, NonEmptyString);
        check(attrs.currentTurnId, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Logger.log('Update Game: ' + attrs._id + ' ' + JSON.stringify(attrs));

        // If there is an ID, this is an update
        return Games.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    currentTurnId: attrs.currentTurnId,
                }
            }
        );

    },

    // End
    'game.end'(gameId) {

        check(gameId, NonEmptyString);

        // Make sure the user is logged in
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
        let game = Games.findOne(gameId);
        let turn = Turns.findOne(game.currentTurnId);
        Games.update(gameId, { $set: { endedAt: new Date(), winner: turn.userId } });

    },

});

if (Meteor.isServer) {


    Meteor.methods({

        // Insert
        'game.insert'(attrs) {

            check(attrs.categoryId, NonEmptyString);
            check(attrs.roomId, NonEmptyString);

            // Make sure the user is logged in
            if (!Meteor.userId()) {
                throw new Meteor.Error('not-authorized');
            }

            // End the previous game
            let room = Rooms.findOne(attrs.roomId);
            if (room.currentGameId) {
                let updated = Games.update(
                    {
                        _id: room.currentGameId,
                    },
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
            let gameId = Games.insert({
                roomId: attrs.roomId,
                categoryId: attrs.categoryId,
            });

            Meteor.call('room.update', {_id: attrs.roomId, currentGameId: gameId}, function (error, updated) {
                if (!error) {
                    Logger.log("Updated Room: " + updated);
                }
            });

            Meteor.call('turn.end', gameId, function (error, id) {
                if (!error) {
                    Logger.log("First Turn: " + id);
                }
            });

            return gameId;

        },

    });

}