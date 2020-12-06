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
        return this.game.players();
    },

    isTurnOwner(userId) {
        return (this.turn.ownerId == userId);
    },

    numPlayers() {
        return this.game.numPlayers();
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
                return leader.profile.name;
            }
        }
        return '-';
    },

});

Template.players_list.events({

});