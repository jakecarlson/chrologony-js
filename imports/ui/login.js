import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Flasher } from './flasher';
import { LoadingState } from '../startup/LoadingState';

import './login.html';

Template.login.onCreated(function loginOnCreated() {
    this.autorun(() => {

    });
});

Template.login.helpers({

});

Template.login.events({

    'submit form': function(e) {
        LoadingState.start(e);
        let username = e.target.username.value;
        let password = e.target.password.value;
        Meteor.loginWithPassword(username, password);
        Flasher.clear();
        LoadingState.stop();
    }

});