import { Template } from 'meteor/templating';
import { LoadingState } from "../../modules/LoadingState";

import { Cards } from "../../api/Cards";

import './player.html';

Template.player.onCreated(function playerOnCreated() {

});

Template.player.helpers({

    dataReady() {
        return (this.room && this.turn && this.player);
    },

    isTurnOwner() {
        return (this.turn.ownerId == this.player._id);
    },

    id() {
        return this.player.id;
    },

    profileName() {
        return this.player.profile.name;
    },

    numLockedCards() {
        return Cards.find(
            {
                ownerId: this.player._id,
                gameId: this.room.currentGameId,
                lockedAt: {$ne: null}
            }
        ).count();
    },

    gameInProgress() {
        return this.turn;
    },

    canEject() {
        return ((this.room.ownerId == Meteor.userId()) && (this.player._id != Meteor.userId()));
    },

});

Template.player.events({

    'click .eject'(e, i) {
        LoadingState.start(e);
        Meteor.call('room.leave', this.player._id, function(err, id) {
            if (!err) {
                Logger.log("Player Left Room: " + id);
            }
            LoadingState.stop();
        });
    },

});