import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';

import './header.html';

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

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

});

Template.header.events({

});