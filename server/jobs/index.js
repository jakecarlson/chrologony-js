import { Jobs } from 'meteor/msavin:sjobs'
import './clearStaleGames';
import './importQueued';

JobsQueue = {
    init() {

        // Delete stale games periodically
        if (Meteor.settings.jobs.clearStaleGames.frequencyInHours) {
            Jobs.run(
                'clearStaleGames',
                Meteor.settings.jobs.clearStaleGames.thresholdInHours,
                Meteor.settings.jobs.clearStaleGames.frequencyInHours,
                {singular: true}
            );
        }

        // Run the importer periodically
        if (Meteor.settings.jobs.importQueued.frequencyInHours) {
            Jobs.run(
                'importQueued',
                Meteor.settings.jobs.importQueued.frequencyInHours,
                {singular: true}
            );
        }

    }
}