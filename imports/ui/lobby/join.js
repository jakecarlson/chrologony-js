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
        const category = game.category();
        if (category) {
            return category.label();
        }
        return '[Private]';
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

    isOwner(game) {
        return game.isOwner();
    },

    statusColor(game) {
        if (game.hasPlayer()) {
            if (game.isTurnOwner()) {
                return 'active';
            } else if (game.startedAt) {
                return 'success';
            } else {
                return 'warning';
            }
        } else {
            if (game.startedAt) {
                return 'danger';
            } else {
                return 'muted-light';
            }
        }
    },

    statusMsg(game) {
        let str = '';
        if (game.hasPlayer()) {
            str += 'You have already joined, ';
            if (game.isTurnOwner()) {
                str += 'and it\'s your turn!';
            } else if (game.startedAt) {
                str += 'and the game is in progress.';
            } else {
                str += 'but the game hasn\'t started yet.';
            }
        } else {
            str += 'You have not joined, ';
            if (game.startedAt) {
                str += 'and the game is already in progress.';
            } else {
                str += 'and the game hasn\'t started yet.';
            }
        }
        return str;
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
        if (game.hasPlayer(Meteor.userId())) {
            e.preventDefault();
            Helpers.joinGame(game._id);
        } else {
            i.currentGame.set(game);
        }
    },

    'submit #joinPassword'(e, i) {
        LoadingState.start(e);
        const form = e.target;
        Helpers.joinGame(i.currentGame.get()._id, form.password.value);
    },

    'click #join .create'(e, i) {
        setTimeout(function() {
            TourGuide.resume();
        }, 250);
    },

});

function getGame(e) {
    const el = $(e.target).closest('.game');
    const gameId = el.attr('data-id');
    return Games.findOne(gameId);
}