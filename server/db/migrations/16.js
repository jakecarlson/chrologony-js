import { Categories } from '../../../imports/api/Categories';

// Consolidate category-level precision.
Migrations.add({
    version: 16,
    name: 'Consolidate category-level precision.',
    up: function() {
        Categories.update(
            {},
            {
                $set: {precision: 'date'},
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
                $unset: {precision: 'date'},
                $set: {
                    comparisonPrecision: 'date',
                    displayPrecision: 'date',
                },
            },
            {multi: true}
        );
    }
});