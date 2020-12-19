import './footer.html';

Template.footer.onCreated(function footerOnCreated() {
    this.autorun(() => {

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

    iosLink() {
        return Meteor.settings.public.app.iosUrl;
    },

    androidLink() {
        return Meteor.settings.public.app.androidUrl;
    },

});

Template.footer.events({

    'click .external-link': Helpers.handleExternalLink,

});