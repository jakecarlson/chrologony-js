import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { LoadingState } from "../startup/LoadingState";

import { Rooms } from '../api/rooms';

import './body.html';
import './join.js';
import './room.js';
import './categories_manager.js';
import './clues_manager.js';
import './register.js';
import './login.js';
import './flasher.js';


Template.body.onCreated(function bodyOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('signup', false);

    this.autorun(() => {

        LoadingState.start();
        this.subscribe('rooms');
        this.subscribe('userData')

        if (this.subscriptionsReady()) {
            Tracker.afterFlush(() => {
                $(function () {
                    $('[data-toggle="popover"]').popover();
                });
            });
            LoadingState.stop();
        }

    });

});

Template.body.helpers({

    currentRoom() {
        return Rooms.findOne({_id: Meteor.user().currentRoomId, deletedAt: null});
    },

    username() {
        return Meteor.user().username;
    },

    copyright() {
        const firstYear = 2020;
        const currentYear = moment.utc(new Date()).format('YYYY');
        if (currentYear > firstYear) {
            return firstYear + ' - ' + currentYear;
        } else {
            return currentYear;
        }
    },

    signup() {
        return Template.instance().state.get('signup');
    },

});

Template.body.events({

    'click .logout': function(e, i){
        e.preventDefault();
        Meteor.logout();
    },

    'click .signup a': function(e, i){
        e.preventDefault();
        i.state.set('signup', true);
    },

    'click .back-to-login': function(e, i){
        e.preventDefault();
        i.state.set('signup', false);
    },

    'submit #register': function(e, i){
        i.state.set('signup', false);
    },

});