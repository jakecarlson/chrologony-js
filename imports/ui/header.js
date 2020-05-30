import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import './header.html';

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

    username() {
        return Formatter.username(Meteor.user({fields: {"username": 1, "profile.name": 1}}));
    },

});

Template.header.events({

    'click .change-password': function(e, i){
        e.preventDefault();
        // Meteor.logout();
        FlowRouter.go('changePassword');
    },

    'click .logout': function(e, i){
        e.preventDefault();
        AccountsTemplates.logout();
        FlowRouter.go('home');
    },

});