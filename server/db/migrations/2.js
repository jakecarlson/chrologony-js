import { Clues } from '../../../imports/api/Clues';
import { Cards } from '../../../imports/api/Cards';

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
