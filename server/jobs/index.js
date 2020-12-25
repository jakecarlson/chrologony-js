import { Jobs } from 'meteor/msavin:sjobs'
import './clearStaleGames';
import './importQueued';
import './updateClueCounts';
import './updateClueScores';
import './updateClueDifficulties';

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
        if (Meteor.settings.jobs.importQueued.frequencyInHours) {
            Jobs.run(
                'importQueued',
                Meteor.settings.jobs.importQueued.frequencyInHours,
                {singular: true}
            );
        }

        // Update clue counts
        if (Meteor.settings.jobs.updateClueCounts.frequencyInHours) {
            Jobs.run(
                'updateClueCounts',
                Meteor.settings.jobs.updateClueCounts.frequencyInHours,
                {singular: true}
            );
        }

        // Update clue scores
        if (Meteor.settings.jobs.updateClueScores.frequencyInHours) {
            Jobs.run(
                'updateClueScores',
                Meteor.settings.jobs.updateClueScores.frequencyInHours,
                {singular: true}
            );
        }

        // Update clue difficulties
        if (Meteor.settings.jobs.updateClueDifficulties.frequencyInHours) {
            Jobs.run(
                'updateClueDifficulties',
                Meteor.settings.jobs.updateClueDifficulties.frequencyInHours,
                {singular: true}
            );
        }

    }
}