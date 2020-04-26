import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import { Rooms } from '../api/rooms';

import './body.html';
import './join.js';
import './room.js';
import './categories_manager.js';
import './clues_manager.js';

Template.body.onCreated(function bodyOnCreated() {
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
    }
});

Template.body.events({

});