import { Meteor } from 'meteor/meteor';
import './layout_authenticated.html';
import './lobby/lobby.js';
import './room/room.js';
import './header.js';
import './footer.js';
import './flasher.js';
import {LoadingState} from "../modules/LoadingState";

Template.layout_authenticated.onCreated(function layout_authenticatedOnCreated() {

    LoadingState.start();
    this.subscribe('rooms', (Meteor.user()) ? Meteor.user().currentRoomId : null);
    this.subscribe('categories');

    if (this.subscriptionsReady()) {

        LoadingState.stop();

    }

});