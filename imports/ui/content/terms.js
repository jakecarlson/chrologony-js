import './terms.html';
import {Meteor} from "meteor/meteor";

Template.terms.onCreated(function termsOnCreated() {

});

Template.terms.helpers({

    appName() {
        return Meteor.settings.public.app.name;
    },

    appUrl() {
        return Meteor.absoluteUrl();
    },

});

Template.terms.events({

});