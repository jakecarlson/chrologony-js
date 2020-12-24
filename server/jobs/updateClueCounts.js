import { Jobs } from 'meteor/msavin:sjobs'
import { Promise } from "meteor/promise";
import { Clues } from '../../imports/api/Clues';
import { Categories } from "../../imports/api/Categories";

Jobs.register({

    'updateClueCounts'(frequencyInHours = 6) {
        const instance = this;

        const categories = Promise.await(
            Clues.rawCollection().aggregate(
                [
                    {$project: {_id: 0, categories: 1}},
                    {$unwind: "$categories" },
                    {$group: {_id: "$categories", clues: {$sum: 1}}},
                    {$project: {_id: 1, clues: 1}},
                    {$sort: {clues: -1}},
                ]
            ).toArray()
        );

        let numUpdated = 0;
        categories.forEach(function(category) {
            if (category._id) {
                numUpdated += Categories.update(category._id, {$set: {cluesCount: category.clues}});
            }
        });

        Logger.log('Category Clue Counts Updated: ' + numUpdated);

        instance.replicate({
            in: {
                hours: frequencyInHours,
            }
        });
        instance.remove();

    }

});