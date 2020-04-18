import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Categories } from "./categories";
import { Games } from "./games";
import { Turns } from "./turns";
import { Events } from "./events";

export const Cards = new Mongo.Collection('cards');

if (Meteor.isServer) {
    Meteor.publish('cards', function cardsPublication(id) {
        return Cards.find();
    });
}

Meteor.methods({

    // Draw Card
    'card.draw'(attrs) {

        check(attrs.turnId, String);
        check(attrs.gameId, String);

        // Make sure the user is logged in
        if (! Meteor.userId()) {
            throw new Meteor.Error('not-authorized');
        }

        // Get a random card that hasn't been drawn this game
        let game = Games.findOne(attrs.gameId);
        let lockedEvents = Cards.find({gameId: attrs.gameId, lockedAt: {$ne: null}}).map(function(i) { return i.eventId; });
        let turnEvents = Cards.find({turnId: attrs.turnId}).map(function(i) { return i.eventId; });
        let usedEvents = lockedEvents.concat(turnEvents);
        console.log('Used Events:');
        console.log(usedEvents);
        let selector = {
            active: true,
            categoryId: game.categoryId,
        };
        if (usedEvents.length > 0) {
            selector._id = {$nin: usedEvents};
        }
        // let unlockedEvent = Events.findOne(selector/*, {sort: {_id:Random.choice([1,-1])}}*/);
        let randomEvent = Events.findOne(selector);

        let cardId = Cards.insert({
            turnId: attrs.turnId,
            gameId: attrs.gameId,
            eventId: randomEvent._id,
            lockedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        Meteor.call('turn.update', {_id: attrs.turnId, currentCardId: cardId}, function(error, updated) {
            if (!error) {
                console.log("Updated Turn: " + updated);
            }
        });

        return cardId;

    },

});