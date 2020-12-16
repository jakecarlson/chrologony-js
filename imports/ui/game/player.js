import { Template } from 'meteor/templating';
import { LoadingState } from "../../modules/LoadingState";

import { Cards } from "../../api/Cards";

import './player.html';
import {Meteor} from "meteor/meteor";

Template.player.onCreated(function playerOnCreated() {

});

Template.player.helpers({

    dataReady() {
        return (this.game && this.player && this.player.profile);
    },

    status() {
        return Formatter.capitalize(getStatus(this.player, this.game._id));
    },

    statusColor() {
        const status = getStatus(this.player, this.game._id);
        const colorMap = {
            here: 'success',
            online: 'warning',
            offline: 'muted',
        };
        return colorMap[status];
    },

    isOnline() {
        return true;
    },

    isInGame() {
        return true;
    },

    isTurnOwner() {
        return isTurnOwner(this.turn, this.player._id);
    },

    id() {
        return this.player._id;
    },

    numLockedCards() {
        return Cards.find(
            {
                gameId: this.game._id,
                ownerId: this.player._id,
                lockedAt: {$ne: null},
            }
        ).count();
    },

    numPendingCards() {
        return Cards.find(
            {
                gameId: this.game._id,
                ownerId: this.player._id,
                $or: [
                    {lockedAt: {$ne: null}},
                    {turnId: this.turn._id, correct: true},
                ],
            }
        ).count();
    },

    gameInProgress() {
        return this.game.startedAt;
    },

    canEject() {
        return ((this.game.ownerId == Meteor.userId()) && (this.player._id != Meteor.userId()));
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
        Meteor.call('game.leave', this.game._id, this.player._id, function(err, id) {
            if (!err) {
                Logger.log("Player Ejected from Game: " + id);
            } else {
                throw new Meteor.Error('game-not-left', 'Could not leave the game.', err);
            }
            LoadingState.stop();
        });
    },

});

function isTurnOwner(turn, playerId) {
    return (turn && (turn.ownerId == playerId))
}

function getStatus(player, gameId) {
    if (player.isOnline()) {
        if (player.isInGame(gameId)) {
            return 'here';
        } else {
            return 'online';
        }
    } else {
        return 'offline';
    }
}