import { Template } from 'meteor/templating';
import { Meteor } from "meteor/meteor";

import { Cards } from '../../api/Cards';

import './lobby_game.html';

Template.lobby_game.onCreated(function lobby_gameOnCreated() {

});

Template.lobby_game.helpers({

    started() {
        return this.game.startedAt;
    },

    hasPassword() {
        return this.game.password;
    },

    title() {
        return this.game.title();
    },

    category() {
        const category = this.game.category();
        if (category) {
            return category.label();
        }
        return '[Private]';
    },

    winCondition() {
        if (this.game.winPoints) {
            return this.game.winPoints;
        } else {
            return 'No';
        }
    },

    difficulty() {
        const avg = Math.round((this.game.minDifficulty + this.game.maxDifficulty) / 2);
        return Cards.DIFFICULTIES[avg];
    },

    numPlayers() {
        return this.game.players.length;
    },

    guessTime() {
        if (this.game.cardTime) {
            return this.game.cardTime + 's';
        } else {
            return 'No';
        }
    },

    playersStr() {
        return Formatter.pluralize('Player', this.game.players.length);
    },

    isOwner() {
        return this.game.isOwner();
    },

    statusColor() {
        if (this.game.hasPlayer()) {
            if (this.game.isTurnOwner()) {
                return 'active';
            } else if (this.game.startedAt) {
                return 'success';
            } else {
                return 'warning';
            }
        } else {
            if (this.game.startedAt) {
                return 'danger';
            } else {
                return 'muted-light';
            }
        }
    },

    statusMsg() {
        let str = '';
        if (this.game.hasPlayer()) {
            str += 'You have already joined, ';
            if (this.game.isTurnOwner()) {
                str += 'and it\'s your turn!';
            } else if (this.game.startedAt) {
                str += 'and the game is in progress.';
            } else {
                str += 'but the game hasn\'t started yet.';
            }
        } else {
            str += 'You have not joined, ';
            if (this.game.startedAt) {
                str += 'and the game is already in progress.';
            } else {
                str += 'and the game hasn\'t started yet.';
            }
        }
        return str;
    },

});

Template.lobby_game.events({

});