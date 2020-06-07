import { Meteor } from 'meteor/meteor';
import { LoadingState } from "../modules/LoadingState";
import '../modules/TourGuide';

import './layout_authenticated.html';
import './content/privacy.js';
import './content/terms.js';
import './lobby/lobby.js';
import './room/room.js';
import './header.js';
import './footer.js';
import './flasher.js';
import {FlowRouter} from "meteor/ostrio:flow-router-extra";

Template.layout_authenticated.onCreated(function layout_authenticatedOnCreated() {

    LoadingState.start();
    this.subscribe('rooms', (Meteor.user()) ? Meteor.user().currentRoomId : null);
    this.subscribe('categories');

    if (this.subscriptionsReady()) {

        LoadingState.stop();

    }

});

Template.layout_authenticated.onRendered(function layout_authenticatedOnRendered() {

});

Template.layout_authenticated.events({

    'click .tour-link'(e, i) {
        e.preventDefault();
        FlowRouter.go('lobby');
        TourGuide.start();
    },

});