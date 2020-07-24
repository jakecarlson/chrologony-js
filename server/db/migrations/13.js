import { Games } from '../../../imports/api/Games';

// Allow games to show hints.
Migrations.add({
    version: 13,
    name: 'Allow games to show hints.',
    up: function() {
        Games.update(
            {},
            {
                $set: {
                    showHints: false,
                },
            },
            {multi: true}
        );
    },
    down: function() {
        Games.update(
            {},
            {
                $unset: {
                    showHints: 1,
                },
            },
            {multi: true}
        );
    }
});