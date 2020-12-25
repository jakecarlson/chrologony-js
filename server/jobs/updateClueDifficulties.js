import { Jobs } from 'meteor/msavin:sjobs'
import { Promise } from "meteor/promise";
import { Cards } from '../../imports/api/Cards';
import { Clues } from '../../imports/api/Clues';

Jobs.register({

    'updateClueDifficulties'(frequencyInHours = 6) {
        const instance = this;

        const clues = Promise.await(
            Cards.rawCollection().aggregate(
                [
                    {$match: {correct: {$ne: null}}},
                    {$project: {clueId: 1, isWrong: {$cond: ["$correct", 0, 1]}}},
                    {$group: {_id: "$clueId", numGuessed: {$sum: 1}, numWrong: {$sum: "$isWrong"}}},
                    {$sort: {numGuessed: -1}},
                ]
            ).toArray()
        );

        let numUpdated = 0;
        clues.forEach(function(clue) {
            if (clue._id) {
                const difficulty = clue.numWrong / clue.numGuessed;
                numUpdated += Clues.update(clue._id, {$set: {difficulty: difficulty}});
            }
        });

        Logger.log('Clue Difficulties Updated: ' + numUpdated);

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