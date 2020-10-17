import { Categories } from '../../../imports/api/Categories';
import { Clues } from '../../../imports/api/Clues';

// Add clue counts to categories.
Migrations.add({
    version: 17,
    name: 'Add clue counts to categories.',
    up: function() {
        Categories.find({}).forEach(function(category) {
           const cluesCount = Clues.find({categories: category._id, active: true}).count();
           Categories.update(category._id, {$set: {cluesCount: cluesCount}});
        });
    },
    down: function() {
        Categories.update({}, {$unset: {cluesCount: 1}}, {multi: true});
    }
});