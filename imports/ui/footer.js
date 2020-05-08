import './footer.html';

Template.footer.onCreated(function footerOnCreated() {

});

Template.footer.helpers({

    copyright() {
        const firstYear = 2020;
        const currentYear = moment.utc(new Date()).format('YYYY');
        if (currentYear > firstYear) {
            return firstYear + ' - ' + currentYear;
        } else {
            return currentYear;
        }
    },

});

Template.footer.events({

});