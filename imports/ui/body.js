import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import { Rooms } from '../api/rooms';

import './body.html';
import './join.js';
import './room.js';
import './categories_manager.js';
import './events_manager.js';

Template.body.onCreated(function bodyOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('rooms', Meteor.user() ? Meteor.user().currentRoomId : null);
    Meteor.subscribe('userData');
});

Template.body.helpers({
    currentRoom() {
        return Rooms.findOne(Meteor.user().currentRoomId);
    },
    showCategoryManager() {
        return (Meteor.user() && !Meteor.user().currentRoomId);
    }
});

Template.body.events({

});