import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';

import './header.html';

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

    username() {
        return Formatter.username(Meteor.user({fields: {"username": 1, "profile.name": 1}}));
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

    logoutLink() {
        return FlowRouter.path('logout');
    },

});

Template.header.events({

});