import { Meteor } from "meteor/meteor";
import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";
import { LoadingState } from '../../modules/LoadingState';

import { Games } from '../../api/Games';

import './join.html';
import './lobby_game.js';

Template.join.onCreated(function joinOnCreated() {

    this.currentGame = new ReactiveVar(null);

    this.games = new ReactiveVar(getGames());
    this.autorun(() => {
        const games = getGames();
        if (games.count() > 0) {
            this.games.set(games);
        }
    });

});

Template.join.helpers({

    dataReady() {
        return Template.instance().games.get();
    },

    games() {
        return Template.instance().games.get();
    },

    hasPassword(game) {
        return game.password;
    },

    isOwner(game) {
        return game.isOwner();
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

function getGames() {
    return Games.find(
        {endedAt: null},
        {sort: {createdAt: -1}}
    );
}