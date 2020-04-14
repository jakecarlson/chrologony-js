import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Games = new Mongo.Collection('games');

Meteor.methods({

    // Insert
    'game.insert'(attrs) {

        check(attrs.roomId, String);
        check(attrs.streak, Boolean);

        // Make sure the user is logged in
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Games.insert({
            roomId: attrs.roomId,
            streak: attrs.streak,
            createdAt: new Date(),
            endedAt: null,
            winner: null,
        });

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