import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { AccountsTemplates } from 'meteor/useraccounts:core';

import './header.html';

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

    username() {
        return (Meteor.user()) ? Meteor.user().username : null;
    },

});

Template.header.events({

    'click .change-password': function(e, i){
        e.preventDefault();
        // Meteor.logout();
        FlowRouter.go('/change-password');
    },

    'click .logout': function(e, i){
        e.preventDefault();
        AccountsTemplates.logout();
        // AccountsTemplates.setState('signIn');
    },

});