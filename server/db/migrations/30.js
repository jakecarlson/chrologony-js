import { Clues } from '../../../imports/api/Clues';
import {Promise} from "meteor/promise";
import {Cards} from "../../../imports/api/Cards";

// Add time zone field to clues.
Migrations.add({

    version: 30,
    name: 'Add time zone field to clues.',

    up: function() {
        Clues.update({}, {$set: {timeZone: Clues.DEFAULT_TIMEZONE}}, {multi: true});
        const utcClues = Promise.await(
            Clues.rawCollection().aggregate([
                {
                    $project: {
                        hour: {$hour: "$date"},
                        date: 1,
                        timeZone: 1,
                    }
                },
                {
                    $match: {
                        timeZone: Clues.DEFAULT_TIMEZONE,
                        $or: [
                            {hour: 0},
                            {hour: 6},
                        ]
                    }
                },
                {
                    $project: {
                        _id: 1,
                        date: 1,
                        hour: {$hour: "$date"},
                    }
                }
            ]).toArray()
        );
        utcClues.forEach(function(clue) {
            const date = clue.date;
            date.setUTCHours(12);
            Clues.update(clue._id, {$set: {date: date}})
        });
    },

    down: function() {
        Clues.update({}, {$unset: {timezone: 1}}, {multi: true});
    },

});