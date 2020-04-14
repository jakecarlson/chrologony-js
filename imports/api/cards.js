import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Cards = new Mongo.Collection('cards');

if (Meteor.isServer) {
    // This code only runs on the server
    // Only publish tasks that are public or belong to the current user
    Meteor.publish('cards', function cardsPublication() {
        return Cards.find({
            gameId: this.gameId,
        });
    });
}

Meteor.methods({

    // Insert
    'cards.insert'(attrs) {

        check(attrs.templateId, String);
        check(attrs.gameId, String);

        // Make sure the user is logged in before inserting a task
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        Cards.insert({
            templateId: attrs.templateId,
            gameId: attrs.gameId,
            userId: Meteor.userId(),
            createdAt: new Date(),
            lockedAt: null,
        });

    },

    // Lock
    'cards.lock'(cardId) {
        check(cardId, String);
        const card = Cards.findOne(cardId);
        if (card.userId !== Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }
        Cards.update(cardId, { $set: { lockedAt: new Date() } });
    },

});