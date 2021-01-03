import { Schemas } from "../../../imports/modules/Schemas";
import { Clues } from '../../../imports/api/Clues';

const INDEXES = [

    {
        collection: Clues,
        indexes: {
            date: {
                date: 1,
            },
            year: {
                year: 1,
            },
            month: {
                month: 1,
            },
            day: {
                day: 1,
            },
        },
    },

];

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
        Schemas.createIndexes(INDEXES);
    },

    down: function() {
        Schemas.dropIndexes(INDEXES);
        Clues.update({}, {$unset: {year: 1, month: 1, day: 1}}, {multi: true});
    },

});