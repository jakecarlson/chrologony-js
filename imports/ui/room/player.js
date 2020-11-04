import { Template } from 'meteor/templating';
import { LoadingState } from "../../modules/LoadingState";

import { Cards } from "../../api/Cards";

import './player.html';

Template.player.onCreated(function playerOnCreated() {

});

Template.player.helpers({

    dataReady() {
        return (this.room && this.player);
    },

    isTurnOwner() {
        return isTurnOwner(this.turn, this.player._id);
    },

    id() {
        return this.player._id;
    },

    profileName() {
        return this.player.profile.name;
    },

    numLockedCards() {
        return Cards.find(
            {
                gameId: this.room.gameId(),
                ownerId: this.player._id,
                lockedAt: {$ne: null},
            }
        ).count();
    },

    numPendingCards() {
        return Cards.find(
            {
                gameId: this.room.gameId(),
                ownerId: this.player._id,
                $or: [
                    {lockedAt: {$ne: null}},
                    {turnId: this.turn._id, correct: true},
                ],
            }
        ).count();
    },

    gameInProgress() {
        return this.room.gameId();
    },

    canEject() {
        return ((this.room.ownerId == Meteor.userId()) && (this.player._id != Meteor.userId()));
    },

    lockedBadgeClasses() {
        let str = 'badge';
        if (isTurnOwner(this.turn, this.player._id)) {
            str += ' badge-success';
        } else {
            str += ' badge-light';
        }
        str += ' float-right ml-2';
        return str;
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

function isTurnOwner(turn, playerId) {
    return (turn && (turn.ownerId == playerId))
}