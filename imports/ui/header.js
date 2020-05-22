import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './header.html';

Template.header.onCreated(function headerOnCreated() {

});

Template.header.helpers({

    username() {
        return (Meteor.user()) ? Meteor.user().username : null;
    },

});

Template.header.events({

    'click .logout': function(e, i){
        e.preventDefault();
        Meteor.logout();
    },

});