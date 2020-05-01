import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from 'meteor/session';

import { Rooms } from '../api/rooms';

import './body.html';
import './join.js';
import './room.js';
import './categories_manager.js';
import './clues_manager.js';
import './register.js';
import './login.js';

Template.body.onCreated(function bodyOnCreated() {

    this.state = new ReactiveDict();
    this.state.set('signup', false);

    Session.set('registrationError', false);
    Session.set('registrationSuccess', false);
    Session.set('loginSuccess', false);
    Session.set('loginError', false);
    Session.set('logoutSuccess', false);
    Session.set('loading', false);

    this.autorun(() => {
        this.subscribe('rooms', Meteor.user() ? Meteor.user().currentRoomId : null);
        this.subscribe('userData');
        this.subscribe('clues');
    });

});

Template.body.helpers({

    currentRoom() {
        return Rooms.findOne(Meteor.user().currentRoomId);
    },

    showCategoryManager() {
        return (Meteor.user() && !Meteor.user().currentRoomId);
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

    registrationSuccess() {
        return Session.get('registrationSuccess');
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

});