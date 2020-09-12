import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';

import './header.html';
import {LoadingState} from "../modules/LoadingState";
import {Flasher} from "./flasher";

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

    appName() {
        return Meteor.settings.public.app.name;
    },

    profileName() {
        return Meteor.user({fields: {"profile.name": 1}}).profile.name;
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

    lobbyLink() {
        return FlowRouter.path('lobby');
    },

    cluesLink() {
        return FlowRouter.path('clues');
    },

    categoriesLink() {
        return FlowRouter.path('categories');
    },

    logoutLink() {
        return FlowRouter.path('logout');
    },

    isMuted() {
        return Session.get('muted');
    },

});

Template.header.events({

    'click a'(e, i) {
        if (TourGuide.isActive()) {
            if ($(e.target).hasClass('category-link')) {
                FlowRouter.go('categories');
                TourGuide.resume();
            } else {
                e.preventDefault();
            }
        }
    },

    'click #mute'(e, i) {
        e.preventDefault();
        Session.set('muted', !Session.get('muted'));
    },

});