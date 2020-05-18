import { Categories } from '../../imports/api/Categories';
import { Clues } from '../../imports/api/Clues';
import { Rooms } from '../../imports/api/Rooms';
import { Games } from '../../imports/api/Games';
import { Turns } from '../../imports/api/Turns';
import { Cards } from '../../imports/api/Cards';

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

// Add 'Id' suffix to all fields referencing users.
Migrations.add({
    version: 3,
    name: 'Add \'Id\' suffix to all fields referencing users.',
    up: function() {
        Cards.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Categories.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Clues.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Rooms.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Turns.update({}, {$rename: {"owner": "ownerId"}}, {multi: true});
        Games.update({}, {$rename: {"winner": "winnerId"}}, {multi: true});
    },
    down: function() {
        Cards.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Categories.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Clues.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Rooms.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Turns.update({}, {$rename: {"ownerId": "owner"}}, {multi: true});
        Games.update({}, {$rename: {"winnerId": "winner"}}, {multi: true});
    }
});