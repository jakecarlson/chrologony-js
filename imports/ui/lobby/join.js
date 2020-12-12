import { Template } from 'meteor/templating';
import { LoadingState } from '../../modules/LoadingState';
import { Meteor } from "meteor/meteor";

import { Games } from '../../api/Games';
import { Cards } from '../../api/Cards';

import './join.html';

Template.join.onCreated(function joinOnCreated() {
    this.currentGame = new ReactiveVar(null);
    this.autorun(() => {
        LoadingState.stop();
    });
});

Template.join.helpers({

    games() {
        return Games.find(
            {},
            {
                sort: {
                    createdAt: -1,
                },
            }
        );
    },

    started(game) {
        return game.startedAt;
    },

    hasPassword(game) {
        return game.password;
    },

    title(game) {
        return game.title();
    },

    category(game) {
        return game.category().name;
    },

    winCondition(game) {
        if (game.winPoints) {
            return game.winPoints;
        } else {
            return 'No';
        }
    },

    difficulty(game) {
        const avg = Math.round((game.minDifficulty + game.maxDifficulty) / 2);
        return Cards.DIFFICULTIES[avg];
    },

    numPlayers(game) {
        return game.players.length;
    },

    guessTime(game) {
        if (game.cardTime) {
            return game.cardTime + 's';
        } else {
            return 'No';
        }
    },

    playersStr(game) {
        return Formatter.pluralize('Player', game.players.length);
    },

    isPlayer(game) {
        return game.hasPlayer(Meteor.userId());
    },

});

Template.join.events({

    'click .game-open'(e, i) {
        const game = getGame(e);
        if (game && !game.password) {
            Helpers.joinGame(game._id);
        }
    },

    'click .game-password'(e, i) {
        const game = getGame(e);
        i.currentGame.set(game);
    },

    'submit #joinPassword'(e, i) {
        LoadingState.start(e);
        const form = e.target;
        Helpers.joinGame(i.currentGame.get()._id, form.password.value);
    },

});

function getGame(e) {
    const el = $(e.target).closest('.game');
    const gameId = el.attr('data-id');
    return Games.findOne(gameId);
}