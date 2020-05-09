import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from "../startup/LoadingState";

import { Rooms } from '../api/rooms';

import './body.html';
import './header.js';
import './auth/auth.js';
import './room/room.js';
import './lobby/lobby.js';
import './footer.js';
import './flasher.js';

Template.body.onCreated(function bodyOnCreated() {

    this.autorun(() => {

        LoadingState.start();
        this.subscribe('rooms');
        this.subscribe('userData')

        if (this.subscriptionsReady()) {

            if (Meteor.user()) {
                Session.set('currentRoomId', Meteor.user().currentRoomId);
            } else {
                Session.set('currentRoomId', null);
            }

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
        if (Session.get('currentRoomId')) {
            let room = Rooms.findOne({_id: Session.get('currentRoomId'), deletedAt: null});
            if (room) {
                return room;
            }
        }
        return null;
    },

});

Template.body.events({

});