import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";
import { LoadingState } from "../../modules/LoadingState";

import { Cards } from "../../api/Cards";

import './player.html';
import './card.js';

Template.player.onCreated(function playerOnCreated() {
    this.expanded = new ReactiveVar(false);
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

    expanded() {
        return Template.instance().expanded.get();
    },

    profileName() {
        return this.player.profile.name;
    },

    numLockedCards() {
        return Cards.find(
            {
                ownerId: this.player._id,
                gameId: this.room.currentGameId,
                lockedAt: {$ne: null},
            }
        ).count();
    },

    numPendingCards() {
        return Cards.find(
            {
                ownerId: this.player._id,
                gameId: this.room.currentGameId,
                $or: [
                    {lockedAt: {$ne: null}},
                    {turnId: this.turn._id, correct: true},
                ],
            }
        ).count();
    },

    gameInProgress() {
        return this.turn;
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

    cards() {
        if (this.player && this.turn) {
            return Cards.find(
                {
                    gameId: this.turn.gameId,
                    ownerId: this.player._id,
                    $or: [
                        {turnId: this.turn._id},
                        {lockedAt: {$ne: null}},
                    ]
                },
                {
                    sort: {
                        pos: 1,
                        createdAt: -1,
                    }
                }
            );
        } else {
            return [];
        }
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

    'click .player-name'(e, i) {
        i.expanded.set(!i.expanded.get());
    },

});

function isTurnOwner(turn, playerId) {
    return (turn && (turn.ownerId == playerId))
}