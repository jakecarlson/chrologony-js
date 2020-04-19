import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import './players_list.html';
import './player.js';

Template.players_list.onCreated(function players_listOnCreated() {
    this.state = new ReactiveDict();
    console.log(this.data.turn);
    Meteor.subscribe('players', this.data.room._id);
});

Template.players_list.helpers({
    players() {
        return Meteor.users.find({currentRoomId: this.room._id});
    },
    isTurnOwner(userId) {
        console.log(this.turn);
        return (this.turn && (this.turn.userId == userId));
    }
});

Template.players_list.events({

});