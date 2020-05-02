import { Template } from 'meteor/templating';

import './player.html';
import {Cards} from "../api/cards";

Template.player.onCreated(function playerOnCreated() {

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
    },

    numLockedCards() {
        return Cards.find({userId: this.player._id, lockedAt: {$ne: null}}).count();
    },

});

Template.player.events({

});