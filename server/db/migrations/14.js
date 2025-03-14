import { Categories } from '../../../imports/api/Categories';
import { Games } from '../../../imports/api/Games';

// Allow time display and comparison precision to be set at the category and game level.
Migrations.add({
    version: 14,
    name: 'Allow time display and comparison precision to be set at the category and game level.',
    up: function() {
        Categories.update(
            {},
            {
                $set: {
                    displayPrecision: Categories.DEFAULT_PRECISION,
                    comparisonPrecision: Categories.DEFAULT_PRECISION,
                },
            },
            {multi: true}
        );
        Games.update(
            {},
            {
                $set: {
                    displayPrecision: Categories.DEFAULT_PRECISION,
                    comparisonPrecision: Categories.DEFAULT_PRECISION,
                },
            },
            {multi: true}
        );
    },
    down: function() {
        Categories.update(
            {},
            {
                $unset: {
                    displayPrecision: 1,
                    comparisonPrecision: 1,
                },
            },
            {multi: true}
        );
        Games.update(
            {},
            {
                $unset: {
                    displayPrecision: 1,
                    comparisonPrecision: 1,
                },
            },
            {multi: true}
        );
    }
});