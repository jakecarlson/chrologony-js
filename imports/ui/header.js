import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { LoadingState } from '../modules/LoadingState';

import './header.html';

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

    dataReady() {
        return true;
    },

    passwordLink() {
        return FlowRouter.path('changePassword');
    },

    loginLink() {
        return FlowRouter.path('home');
    },

    signupLink() {
        return FlowRouter.path('signUp');
    },

    cluesLink() {
        return FlowRouter.path('clues');
    },

    categoriesLink() {
        return FlowRouter.path('categories');
    },

    isMuted() {
        return Helpers.isMuted();
    },

    isNotGuest() {
        return !Meteor.user().guest;
    },

    showPasswordLink() {
        return Meteor.user().canChangePassword();
    },

    privacyLink() {
        return FlowRouter.path('privacy');
    },

    termsLink() {
        return FlowRouter.path('terms');
    },

    supportLink() {
        return Meteor.settings.public.app.supportUrl;
    },

    profileLink() {
        return FlowRouter.path('profile');
    },

});

Template.header.events({

    'click .external-link': Helpers.handleExternalLink,

    'click .logout-link'(e, i) {
        LoadingState.start(e);
        e.preventDefault();
        Logger.audit('logout', {guest: Helpers.isGuest()});
        Logger.track('logout', {guest: Helpers.isGuest()});
        AccountsTemplates.logout();
    },

    'click a'(e, i) {
        const path = $(e.target).closest('a').attr('href');
        if ((path.substr(0, 1) == '/') && (path != window.location.pathname)) {
            LoadingState.start();
            if (TourGuide.isActive()) {
                if ($(e.target).hasClass('categories-link')) {
                    FlowRouter.go('categories');
                    TourGuide.resume();
                } else if ($(e.target).hasClass('clues-link')) {
                    FlowRouter.go('clues');
                    TourGuide.resume();
                } else {
                    e.preventDefault();
                }
            }
        }
    },

    'click #mute'(e, i) {
        e.preventDefault();
        Meteor.call('user.updateProfile', {muted: !Helpers.isMuted()}, function(err) {
            if (err) {
                Flasher.error('Mute setting failed to save. Please try again.');
            }
        });
    },

});