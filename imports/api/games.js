import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Rooms } from '../api/rooms';

export const Games = new Mongo.Collection('games');

if (Meteor.isServer) {
    Meteor.publish('games', function gamesPublication(roomId) {
        if (this.userId && roomId) {
            return Games.find({roomId: roomId});
        } else {
            return this.ready();
        }
    });
}

Meteor.methods({

    // Insert
    'game.insert'(attrs) {

        check(attrs.categoryId, String);
        check(attrs.roomId, String);

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

        check(attrs._id, String);
        check(attrs.currentTurnId, String);

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
        check(gameId, String);
        const game = Games.findOne(gameId);
        // Make sure the user is logged in
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
        Cards.update(gameId, { $set: { endedAt: new Date(), winner: Meteor.userId() } });
    },

});