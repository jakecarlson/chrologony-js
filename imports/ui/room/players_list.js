import { Template } from 'meteor/templating';

import './players_list.html';
import './player.js';

Template.players_list.onCreated(function players_listOnCreated() {
    // this.subscribe('players', this.data.room._id);
    this.autorun(() => {

    });
});

Template.players_list.helpers({

    dataReady() {
        return this.room;
    },

    players() {
        return this.room.players();
    },

    isTurnOwner(userId) {
        return (this.turn.ownerId == userId);
    },

});

Template.players_list.events({

});