import { LoadingState } from '../modules/LoadingState';
import {Meteor} from "meteor/meteor";
import {FlowRouter} from "meteor/ostrio:flow-router-extra";

/* Application */
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

/* Utilities */
Template.registerHelper('dump', function(varToDump) {
    return JSON.stringify(varToDump);
});

/* Control */
Template.registerHelper('collectionNotEmpty', function(collection) {
    return (collection.count() > 0);
});

Template.registerHelper('arrayNotEmpty', function(array) {
    return (array.length > 0);
});

/* State */
Template.registerHelper('loading', function() {
    return LoadingState.active();
});

Template.registerHelper('notLoading', function() {
    return !LoadingState.active();
});

/* Meta / Analytics */
Template.registerHelper('doctype', function() {
    return "<!DOCTYPE html>";
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

/* Helpers */
Template.registerHelper('selectedValue', function(id, val = false) {
    if (!val) {
        val = this.val;
    }
    return (id == this.val);
});

Template.registerHelper('mobileApp', function() {
    return Meteor.isCordova;
});

Template.registerHelper('profileName', function(user) {
    return (user) ? user.name() : null;
});

/* Links */
Template.registerHelper('privacyLink', function() {
    return FlowRouter.path('privacy');
});

Template.registerHelper('termsLink', function() {
    return FlowRouter.path('terms');
});

Template.registerHelper('supportLink', function() {
    return Meteor.settings.public.app.supportUrl;
});

Template.registerHelper('lobbyLink', function() {
    return FlowRouter.path('lobby');
});

/* Formatters */
Template.registerHelper('capitalize', function(str) {
    return Formatter.capitalize(str);
});

Template.registerHelper('pluralize', function(str, qty) {
    return Formatter.pluralize(str, qty);
});

Template.registerHelper('datetime', function(val) {
    return (val ? Formatter.datetime(val) : null);
});

Template.registerHelper('relativeTime', function(val) {
    return (val ? Formatter.relativeTime(val) : null);
});

Template.registerHelper('number', function(val) {
    return numeral(val).format('0,0');
});