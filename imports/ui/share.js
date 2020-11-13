import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';

import './footer.html';

Template.footer.onCreated(function footerOnCreated() {
    this.autorun(() => {
        Tracker.afterFlush(() => {
            if (window.__sharethis__) {
                window.__sharethis__.load('inline-share-buttons', {
                    alignment: 'center', // left, right, center, justified.
                    // container: STRING, // id of the dom element to load the buttons into
                    enabled: true,
                    // font_size: INTEGER, // small = 11, medium = 12, large = 16.
                    // id: STRING, // load the javascript into a specific dom element by id attribute
                    labels: 'none', // "cta", "counts", or "none"
                    // min_count: INTEGER, // minimum amount of shares before showing the count
                    padding: 8, // small = 8, medium = 10, large = 12.
                    radius: 0, // in pixels
                    networks: [
                        'facebook',
                        'twitter',
                        'pinterest',
                        'linkedin',
                        'whatsapp',
                        'weibo',
                        'email',
                        'sms'
                    ],
                    show_total: false,
                    show_mobile_buttons: true, // forces sms to show on desktop
                    use_native_counts: true, // uses native facebook counts from the open graph api
                    size: 32, // small = 32, medium = 40, large = 48.
                    spacing: 8, // spacing = 8, no spacing = 0.
                });
            }
        });
    });
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

    documentationLink() {
        return Meteor.settings.public.app.documentationUrl;
    },

});

Template.footer.events({

});