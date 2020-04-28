import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './players_list.html';
import './player.js';

Template.players_list.onCreated(function players_listOnCreated() {
    this.autorun(() => {
        this.subscribe('players', this.data.room._id);
    });

});

Template.players_list.helpers({
    players() {
        return Meteor.users.find({currentRoomId: this.room._id});
    },
    isTurnOwner(userId) {
        return (this.turn && (this.turn.userId == userId));
    }
});

Template.players_list.events({

});