import { Clues } from '../../../imports/api/Clues';

const DEFAULT_SCORE = 10;

// Add clue votes to schema.
Migrations.add({
    version: 8,
    name: 'Add clue votes to schema.',
    up: function() {
        Clues.update(
            {},
            {
                $set: {
                    score: DEFAULT_SCORE,
                },
            },
            {multi: true}
        );
    },
    down: function() {
        Clues.update(
            {},
            {
                $unset: {
                    score: 1,
                },
            },
            {multi: true}
        );
    }
});