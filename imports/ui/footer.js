import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';

import './footer.html';

Template.footer.onCreated(function footerOnCreated() {

});

Template.footer.helpers({

    copyright() {
        const firstYear = 2020;
        const currentYear = moment.utc(new Date()).format('Y');
        if (currentYear > firstYear) {
            return firstYear + ' - ' + currentYear;
        } else {
            return currentYear;
        }
    },

    privacyLink() {
        return FlowRouter.path('privacy');
    },

    termsLink() {
        return FlowRouter.path('terms');
    },

});

Template.footer.events({

});