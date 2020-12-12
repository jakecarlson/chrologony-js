import { Template } from 'meteor/templating';

import './players_list.html';
import './player.js';

Template.players_list.onCreated(function players_listOnCreated() {

});

Template.players_list.helpers({

    dataReady() {
        return this.game;
    },

    players() {
        return this.game.playersWithNames();
    },

    isTurnOwner(userId) {
        return (this.turn.ownerId == userId);
    },

    numPlayers() {
        return this.game.players.length;
    },

    currentRound() {
        if (this.game) {
            return this.game.currentRound;
        }
        return '-';
    },

    currentLeader() {
        if (this.game) {
            const leader = this.game.currentLeader();
            if (leader) {
                return leader.name();
            }
        }
        return '-';
    },

});

Template.players_list.events({

});