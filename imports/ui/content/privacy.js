import './privacy.html';
import {Meteor} from "meteor/meteor";

Template.privacy.onCreated(function privacyOnCreated() {

});

Template.privacy.helpers({

    appName() {
        return Meteor.settings.public.app.name;
    },

    appUrl() {
        return Meteor.absoluteUrl();
    },

});

Template.privacy.events({

});