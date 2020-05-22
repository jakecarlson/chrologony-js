import { Meteor } from 'meteor/meteor';
import './layout_authenticated.html';
import './lobby/lobby.js';
import './room/room.js';
import './header.js';
import './footer.js';
import './flasher.js';

Template.layout_authenticated.onCreated(function layout_authenticatedOnCreated() {

    this.subscribe('userData');
    this.subscribe('rooms', (Meteor.user()) ? Meteor.user().currentRoomId : null);

});