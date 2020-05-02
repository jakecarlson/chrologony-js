import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from '../startup/LoadingState';

import './join.html';
import {ReactiveDict} from "meteor/reactive-dict";

Template.join.onCreated(function joinOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('error', false);

});

Template.join.helpers({
    error() {
        return Template.instance().state.get('error');
    },
});

Template.join.events({

    'submit #join'(e, i) {

        LoadingState.start(e);

        // Get value from form element
        const target = e.target;
        const attrs = {
            name: target.name.value,
            password: target.password.value,
        };

        Meteor.call('room.findOrCreate', attrs, function(error, id) {
            if (error) {
                i.state.set('error', true);
            } else {
                console.log("Room Set: " + id);
                Accounts.resetAuthMessages();
                target.name.value = '';
                target.password.value = '';
                i.state.set('error', false);
            }
            LoadingState.stop();
        });

    },

});