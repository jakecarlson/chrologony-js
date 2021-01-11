import { Jobs } from 'meteor/msavin:sjobs'
import { Meteor } from "meteor/meteor";

Jobs.register({

    'importQueuedImports'(frequencyInHours = 1) {
        const instance = this;

        Meteor.call('importer.importQueued');

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