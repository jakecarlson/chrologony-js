import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from "meteor/reactive-dict";
import { Session } from "meteor/session";

import './player.html';

Template.player.onCreated(function playerOnCreated() {
    this.state = new ReactiveDict();
});

Template.player.helpers({
    isTurnOwner() {
        return (this.turn && (this.turn.userId == this.player._id));
    },
    id() {
        return this.player.id;
    },
    username() {
        return this.player.username;
    }
});

Template.player.events({

});