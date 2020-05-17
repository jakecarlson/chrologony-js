import { Turns } from '../../imports/api/turns';
import { Cards } from '../../imports/api/cards';

// Rename userId to owner on Turns and Cards.
Migrations.add({
    version: 1,
    name: 'Rename userId to owner on Turns and Cards.',
    up: function() {
        Turns.update({}, {$rename: {"userId": "owner"}}, {multi: true});
        Cards.update({}, {$rename: {"userId": "owner"}}, {multi: true});
    },
    down: function() {
        Turns.update({}, {$rename: {"owner": "userId"}}, {multi: true});
        Cards.update({}, {$rename: {"owner": "userId"}}, {multi: true});
    }
});

// Remove Clue subdocument from Cards.
Migrations.add({
    version: 2,
    name: 'Remove Clue subdocument from Cards.',
    up: function() {
        Cards.update({}, {$unset: {clue: ""}}, {multi: true});
    },
    down: function() {
        const cards = Cards.find({});
        cards.forEach(function(card) {
           const clue = Clues.findOne(card.clueId);
           Cards.update(card._id, {$set: {clue: clue}});
        });
    }
});