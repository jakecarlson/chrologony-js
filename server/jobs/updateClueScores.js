import { Jobs } from 'meteor/msavin:sjobs'
import { Promise } from "meteor/promise";
import { Clues } from '../../imports/api/Clues';
import { Votes } from "../../imports/api/Votes";

Jobs.register({

    'updateClueScores'(frequencyInHours = 6) {
        const instance = this;

        const clues = Promise.await(
            Votes.rawCollection().aggregate(
                [
                    {$group: {_id: "$clueId", score: {$sum: "$value"}}},
                    {$sort: {score: -1}},
                ]
            ).toArray()
        );

        let numUpdated = 0;
        clues.forEach(function(clue) {
            if (clue._id) {
                numUpdated += Clues.update(clue._id, {$set: {score: Clues.DEFAULT_SCORE + clue.score}});
            }
        });

        Logger.log('Clue Scores Updated: ' + numUpdated);

        if (frequencyInHours) {
            instance.replicate({
                in: {
                    hours: frequencyInHours,
                }
            });
            instance.remove();
        }

    }

});