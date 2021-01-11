import { Jobs } from 'meteor/msavin:sjobs'
import { Meteor } from "meteor/meteor";

Jobs.register({

    'setFeaturedCategories'() {
        const instance = this;

        Meteor.call(
            'category.setFeatured',
            Meteor.settings.categories.numFeatured,
            Meteor.settings.categories.featuredSource
        );

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