import { LoadingState } from '../modules/LoadingState';
import {Meteor} from "meteor/meteor";
import {FlowRouter} from "meteor/ostrio:flow-router-extra";

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
    return Meteor.absoluteUrl('share.png');
});

Template.registerHelper('appUrl', function() {
    return Meteor.absoluteUrl();
});

Template.registerHelper('appKeywords', function() {
    return Meteor.settings.robots.keywords;
});

Template.registerHelper('appAuthor', function() {
    return Meteor.settings.robots.author;
});

Template.registerHelper('appColor', function() {
    return Meteor.settings.robots.color;
});

Template.registerHelper('gaPropertyId', function() {
    return Meteor.settings.public.analyticsSettings['Google Analytics'].trackingId;
});

Template.registerHelper('gaScriptUrl', function() {
    return 'https://www.googletagmanager.com/gtag/js?id=' + Meteor.settings.public.analyticsSettings['Google Analytics'].trackingId;
});

Template.registerHelper('fbAppId', function() {
    return Meteor.settings.robots.facebookAppId;
});

Template.registerHelper('doctype', function() {
    return "<!DOCTYPE html>";
});

Template.registerHelper('mobileApp', function() {
    return Meteor.isCordova;
});

Template.registerHelper('privacyLink', function() {
    return FlowRouter.path('privacy');
});

Template.registerHelper('termsLink', function() {
    return FlowRouter.path('terms');
});

Template.registerHelper('supportLink', function() {
    return Meteor.settings.public.app.supportUrl;
});