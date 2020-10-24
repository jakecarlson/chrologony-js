import { Template } from 'meteor/templating';

import './players_list.html';
import './player.js';
import {Cards} from "../../api/Cards";

Template.players_list.onCreated(function players_listOnCreated() {

});

Template.players_list.helpers({

    dataReady() {
        return this.room;
    },

    players() {
        return this.room.players();
    },

    isTurnOwner(userId) {
        return (this.turn.ownerId == userId);
    },

    numPlayers() {
        return this.room.players().count();
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