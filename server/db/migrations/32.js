import { Clues } from '../../../imports/api/Clues';

// Add date parts to all clues.
Migrations.add({

    version: 32,
    name: 'Add date parts to all clues.',

    up: function() {
        Clues.rawCollection().updateMany(
            {year: {$exists: false}},
            [
                {
                    $set: {
                        year: {$year: "$date"},
                        month: {$month: "$date"},
                        day: {$dayOfMonth: "$date"},
                    }
                }
            ]
        );
    },

    down: function() {
        Clues.update({}, {$unset: {year: 1, month: 1, day: 1}}, {multi: true});
    },

});