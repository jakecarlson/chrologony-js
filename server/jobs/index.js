import { Jobs } from 'meteor/msavin:sjobs'
import './clearStaleGames';
import './importQueuedImports';
import './updateClueCounts';
import './updateClueScores';
import './updateClueDifficulties';
import './updateFeaturedCategories';

JobsQueue = {
    init() {

        // Delete stale games
        if (Meteor.settings.jobs.clearStaleGames.frequencyInHours) {
            Jobs.run(
                'clearStaleGames',
                Meteor.settings.jobs.clearStaleGames.thresholdInHours,
                Meteor.settings.jobs.clearStaleGames.frequencyInHours,
                {singular: true}
            );
        }

        // Run the importer
        initJob('importQueuedImports', Meteor.settings.jobs.importQueuedImports.frequencyInHours);

        // Update clue counts
        initJob('updateClueCounts', Meteor.settings.jobs.updateClueCounts.frequencyInHours);

        // Update clue scores
        initJob('updateClueScores', Meteor.settings.jobs.updateClueScores.frequencyInHours);

        // Update clue difficulties
        initJob('updateClueDifficulties', Meteor.settings.jobs.updateClueDifficulties.frequencyInHours);

        // Update featured categories
        initJob('updateFeaturedCategories', Meteor.settings.jobs.updateFeaturedCategories.frequencyInHours);

    }
}

function initJob(name, frequencyInHours) {
    if (frequencyInHours) {
        Jobs.run(
            name,
            frequencyInHours,
            {singular: true}
        );
    }
}