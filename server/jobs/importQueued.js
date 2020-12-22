import { Jobs } from 'meteor/msavin:sjobs'
import { Meteor } from "meteor/meteor";

Jobs.register({

    'importQueued'(frequencyInHours = 1) {
        const instance = this;

        Meteor.call('importer.importQueued');

        instance.replicate({
            in: {
                hours: frequencyInHours,
            }
        });
        instance.remove();

    }

});