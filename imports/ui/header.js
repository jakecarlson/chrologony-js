import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';

import './header.html';

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

    profileName() {
        const user = Meteor.user({fields: {"profile.name": 1}});
        if (user) {
            return user.profile.name;
        }
        return null;
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
    },

    'click #mute'(e, i) {
        e.preventDefault();
        Session.set('muted', !Session.get('muted'));
    },

});