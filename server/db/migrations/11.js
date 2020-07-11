import { Games } from '../../../imports/api/Games';

const DEFAULT_TURN_ORDER = 'sequential';

// Set game advanced options for all existing games to how the game has worked until now.
Migrations.add({
    version: 11,
    name: 'Set game advanced options for all existing games to how the game has worked until now.',
    up: function() {
        Games.update(
            {},
            {
                $set: {
                    winPoints: 0,
                    equalTurns: false,
                    cardLimit: 0,
                    cardTime: 0,
                    turnOrder: DEFAULT_TURN_ORDER,
                    recycleCards: true,
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
                    winPoints: 1,
                    equalTurns: 1,
                    cardLimit: 1,
                    cardTime: 1,
                    turnOrder: 1,
                    recycleCards: 1,
                },
            },
            {multi: true}
        );
    }
});