import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { LoadingState } from '../startup/LoadingState';

import './login.html';

Template.login.onCreated(function loginOnCreated() {
    this.autorun(() => {

    });
});

Template.login.helpers({
    error() {
        return Session.get('loginError');
    },
    logout() {
        return Session.get('logoutSuccess');
    },
});

Template.login.events({

    'submit form': function(e) {
        LoadingState.start(e);
        let username = e.target.username.value;
        let password = e.target.password.value;
        Meteor.loginWithPassword(username, password);
        LoadingState.stop();
    }

});