import { LoadingState } from '../modules/LoadingState';
import {Meteor} from "meteor/meteor";

Template.registerHelper('collectionNotEmpty', function(collection) {
    return (collection.count() > 0);
});

Template.registerHelper('loading', function() {
    return LoadingState.active();
});

Template.registerHelper('notLoading', function() {
    return !LoadingState.active();
});

Template.registerHelper('selectedValue', function(id) {
    return (id == this.val);
});

Template.registerHelper('appName', function() {
    return Meteor.settings.public.app.name;
});

Template.registerHelper('appDescription', function() {
    return Meteor.settings.public.app.description;
});

Template.registerHelper('appTagline', function() {
    return Meteor.settings.public.app.tagline;
});

Template.registerHelper('appImage', function() {
    return Meteor.absoluteUrl('logo.png');
});

Template.registerHelper('appUrl', function() {
    return Meteor.absoluteUrl();
});