import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Categories } from "./categories";
import { Games } from "./games";
import { Turns } from "./turns";
import { Clues } from "./clues";

export const Cards = new Mongo.Collection('cards');

if (Meteor.isServer) {

    Meteor.publish('cards', function cardsPublication(gameId) {
        if (this.userId && gameId) {
            return Cards.find({gameId: gameId});
            /*
            if (game) {
                let selector = {
                    gameId: game._id,
                };
                if (game.currentTurnId) {
                    selector.$or = [
                        {turnId: turnId},
                        {lockedAt: {$ne: null}}
                    ];
                } else {
                    selector.lockedAt = {$ne: null};
                }
                return Cards.find(selector);
            } else {
                return [];
            }
            */
        } else {
            return this.ready();
        }
    });

}

Meteor.methods({

    // Draw Card
    'card.draw'(attrs) {

        check(attrs.turnId, String);
        check(attrs.gameId, String);

        // Make sure the user is logged in
        if (!this.userId) {
            throw new Meteor.Error('not-authorized');
        }

        // Get a random card that hasn't been drawn this game
        let game = Games.findOne(attrs.gameId);
        let lockedCards = Cards.find({gameId: attrs.gameId, lockedAt: {$ne: null}}).map(function(i) { return i.clueId; });
        let turnCards = Cards.find({turnId: attrs.turnId}).map(function(i) { return i.clueId; });
        let usedCards = lockedCards.concat(turnCards);
        console.log('Used Cards:');
        console.log(usedCards);
        let selector = {
            active: true,
            categoryId: game.categoryId,
        };
        if (usedCards.length > 0) {
            selector._id = {$nin: usedCards};
        }
        // let unlockedClue = Clues.findOne(selector/*, {sort: {_id:Random.choice([1,-1])}}*/);
        let randomClue = Clues.findOne(selector);

        let cardId = Cards.insert({
            turnId: attrs.turnId,
            gameId: attrs.gameId,
            clueId: randomClue._id,
            clue: randomClue,
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