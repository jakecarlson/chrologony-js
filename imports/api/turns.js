import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Turns = new Mongo.Collection('turns');

if (Meteor.isServer) {
    Meteor.publish('turns', function turnsPublication(id) {
        return Turns.find();
    });
}

Meteor.methods({

    // Next Turn
    'turn.next'(gameId) {

        check(gameId, String);

        // Make sure the user is logged in
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        let turnId = Turns.insert({
            gameId: gameId,
            userId: Meteor.userId(),
            currentCardId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        Meteor.call('game.update', {_id: gameId, currentTurnId: turnId}, function(error, updated) {
            if (!error) {
                console.log("Updated Game: " + updated);
            }
        });

        Meteor.call('card.draw', {turnId: turnId, gameId: gameId}, function(error, id) {
            if (!error) {
                console.log("Created Card: " + id);
            }
        });

        return turnId;

    },

});