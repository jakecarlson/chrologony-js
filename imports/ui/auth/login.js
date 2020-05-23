import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { Flasher } from '../flasher';
import { LoadingState } from '../../modules/LoadingState';

import './login.html';

Template.login.onCreated(function loginOnCreated() {
    this.autorun(() => {
        FlowRouter.watchPathChange();
    });
});

Template.login.helpers({

});

Template.login.events({

    'submit form': function(e) {
        LoadingState.start(e);
        const username = e.target.username.value;
        const password = e.target.password.value;
        Flasher.clear();
        Meteor.loginWithPassword(username, password, function(err) {
            if (!err) {
                if (FlowRouter.getQueryParam('redirect')) {
                    FlowRouter.go(FlowRouter.getQueryParam('redirect'));
                } else {
                    FlowRouter.go('lobby');
                }
            }
        });
    },

    'click a': function(e, i){
        e.preventDefault();
        Flasher.clear();
        FlowRouter.go('register');
    },

});