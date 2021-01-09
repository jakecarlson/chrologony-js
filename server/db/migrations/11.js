import { Games } from '../../../imports/api/Games';

const DEFAULT_MIN_DIFFICULTY = 1;
const DEFAULT_MAX_DIFFICULTY = 3;

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
                    turnOrder: Games.DEFAULT_TURN_ORDER,
                    recycleCards: true,
                    minDifficulty: DEFAULT_MIN_DIFFICULTY,
                    maxDifficulty: DEFAULT_MAX_DIFFICULTY,
                    minScore: 0,
                },
                $unset: {
                    streak: 1,
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
                    minDifficulty: 1,
                    maxDifficulty: 1,
                    minScore: 1,
                },
                $set: {
                    streak: false,
                },
            },
            {multi: true}
        );
    }
});