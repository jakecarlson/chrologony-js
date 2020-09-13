import { Clues } from '../../../imports/api/Clues';

// Add approximation flag to clues.
Migrations.add({
    version: 15,
    name: 'Add approximation flag to clues.',
    up: function() {
        Clues.update(
            {},
            {
                $set: {approximation: false},
            },
            {multi: true}
        );
    },
    down: function() {
        Clues.update(
            {},
            {
                $unset: {approximation: 1},
            },
            {multi: true}
        );
    }
});