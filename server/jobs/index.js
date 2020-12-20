import { Jobs } from 'meteor/msavin:sjobs'
import './clearStaleGames';

JobsQueue = {
    init() {

        // Delete stale games periodically
        Jobs.run(
            'clearStaleGames',
            Meteor.settings.jobs.clearStaleGames.thresholdInHours,
            Meteor.settings.jobs.clearStaleGames.nextRunInHours,
            {singular: true}
        );

    }
}