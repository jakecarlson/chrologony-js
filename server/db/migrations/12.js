import { Games } from '../../../imports/api/Games';

// Allow games to be soft deleted (abandoned).
Migrations.add({
    version: 12,
    name: 'Allow games to be soft deleted (abandoned).',
    up: function() {
        Games.update(
            {},
            {
                $set: {
                    deletedAt: null,
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
                    deletedAt: 1,
                },
            },
            {multi: true}
        );
    }
});