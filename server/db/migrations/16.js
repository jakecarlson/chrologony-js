import { Categories } from '../../../imports/api/Categories';

// Consolidate category-level precision.
Migrations.add({
    version: 16,
    name: 'Consolidate category-level precision.',
    up: function() {
        Categories.update(
            {},
            {
                $set: {precision: Categories.DEFAULT_PRECISION},
                $unset: {
                    comparisonPrecision: 1,
                    displayPrecision: 1,
                },
            },
            {multi: true}
        );
    },
    down: function() {
        Categories.update(
            {},
            {
                $unset: {precision: 1},
                $set: {
                    comparisonPrecision: Categories.DEFAULT_PRECISION,
                    displayPrecision: Categories.DEFAULT_PRECISION,
                },
            },
            {multi: true}
        );
    }
});