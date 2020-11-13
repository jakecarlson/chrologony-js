import './share.html';

Template.share.onRendered(function shareOnRendered() {
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
    $('.share-modal').on('show.bs.modal', function () {
        $('.share-modal').find(':hidden').addBack().show();
    });
});

Template.share.helpers({

    copyright() {
        const firstYear = 2020;
        const currentYear = moment.utc(new Date()).format('Y');
        if (currentYear > firstYear) {
            return firstYear + ' - ' + currentYear;
        } else {
            return currentYear;
        }
    },

});

Template.share.events({

});