import { Clues } from '../../../imports/api/Clues';

const DEFAULT_DIFFICULTY = .5;

// Add clue difficulty to schema.
Migrations.add({
    version: 10,
    name: 'Add clue difficulty to schema.',
    up: function() {
        Clues.update(
            {},
            {
                $set: {
                    difficulty: DEFAULT_DIFFICULTY,
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
                    difficulty: 1,
                },
            },
            {multi: true}
        );
    }
});