import { Template } from 'meteor/templating';
import { Flasher } from './flasher.js';
import { ReactiveDict } from "meteor/reactive-dict";

import './auth.html';
import './login.js';
import './register.js';

Template.auth.onCreated(function authOnCreated() {
    this.state = new ReactiveDict();
    this.state.set('signup', false);
});

Template.auth.helpers({

    signup() {
        return Template.instance().state.get('signup');
    },

});

Template.auth.events({

    'click .signup a': function(e, i){
        e.preventDefault();
        Flasher.clear();
        i.state.set('signup', true);
    },

    'click .back-to-login': function(e, i){
        e.preventDefault();
        Flasher.clear();
        i.state.set('signup', false);
    },

});