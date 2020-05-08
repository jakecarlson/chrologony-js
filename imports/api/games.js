import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { NonEmptyString } from "../startup/validations";

import { Turns } from '../api/turns';

export const Games = new Mongo.Collection('games');

if (Meteor.isServer) {
    Meteor.publish('games', function gamesPublication(id) {
        if (this.userId && id) {
            return Games.find({_id: id});
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

    // Insert
    'game.insert'(attrs) {

        check(attrs.categoryId, NonEmptyString);
        check(attrs.roomId, NonEmptyString);

        // Make sure the user is logged in
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Create Game:');
        console.log(attrs);

        let gameId = Games.insert({
            roomId: attrs.roomId,
            categoryId: attrs.categoryId,
            streak: false,
            currentTurnId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            endedAt: null,
            winner: null,
        });

        Meteor.call('room.update', {_id: attrs.roomId, currentGameId: gameId}, function(error, updated) {
            if (!error) {
                console.log("Updated Room: " + updated);
            }
        });

        Meteor.call('turn.next', gameId, function(error, id) {
            if (!error) {
                console.log("First Turn: " + id);
            }
        });

        return gameId;

    },

    // Update
    'game.update'(attrs) {

        check(attrs._id, NonEmptyString);
        check(attrs.currentTurnId, NonEmptyString);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        console.log('Update Game: ' + attrs._id);
        console.log(attrs);

        // If there is an ID, this is an update
        return Games.update(
            {
                _id: attrs._id,
            },
            {
                $set: {
                    currentTurnId: attrs.currentTurnId,
                    updatedAt: new Date(),
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