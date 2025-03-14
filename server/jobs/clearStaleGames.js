import { Jobs } from 'meteor/msavin:sjobs'
import { Games } from '../../imports/api/Games';

Jobs.register({

    'clearStaleGames'(thresholdInHours = 72, frequencyInHours = 1) {
        const instance = this;

        const hoursAgo = moment.utc().subtract(thresholdInHours, 'hours');
        const selector = {
            deletedAt: null,
            endedAt: null,
            updatedAt: {$lt: hoursAgo.toDate()},
        };

        Logger.log('Deleting Games: ' + JSON.stringify(selector));
        const numDeleted = Games.update(selector, {$set: {deletedAt: new Date()}}, {multi: true});

        Logger.log('Stale Games Deleted: ' + numDeleted);

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