import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { LoadingState } from "../modules/LoadingState";

import { Games } from "../api/Games";
import { Turns } from "../api/Turns";

import './embed.html';
import './categories_selector.js';
import './game/board.js';
import './game/clue_more.js';

Template.embed.onCreated(function embedOnCreated() {

    LoadingState.start();
    Meteor.call('user.anonymous', function(err, success) {
        Meteor.connection.setUserId('anonymous');
    });

    this.initialized = false;
    this.game = new ReactiveVar(null);
    this.turn = new ReactiveVar(null);
    this.clueMore = new ReactiveVar(null);

    this.autorun((computation) => {

        Helpers.subscribe(this, 'categories');

        if (Session.get('currentGameId')) {

            LoadingState.start();
            Helpers.subscribe(this, 'anonymousGame', Session.get('currentGameId'));
            Helpers.subscribe(this, 'turns', Session.get('currentGameId'));
            Helpers.subscribe(this, 'cards', Session.get('currentGameId'));
            Helpers.subscribe(this, 'cardClues', Session.get('currentGameId'));

            if (this.subscriptionsReady()) {

                this.game.set(Games.findOne(Session.get('currentGameId')));
                if (this.game.get() && this.game.get().currentTurnId) {
                    this.turn.set(Turns.findOne(this.game.get().currentTurnId));
                }

                const self = this;
                Tracker.afterFlush(() => {
                    $('#clueMore').on('hidden.bs.modal', function (e) {
                        self.clueMore.set(null);
                    });
                });

                this.initialized = true;
                LoadingState.stop();

            }

        }

    });

    GameObserver.observe(this, true);

});

Template.embed.helpers({

    currentGame() {
        return Template.instance().game.get();
    },

    currentTurn() {
        return Template.instance().turn.get();
    },

    clueMore() {
        return Template.instance().clueMore.get();
    },

    showHeader() {
        return !FlowRouter.getQueryParam('hide_header');
    },

    title() {
        return Meteor.settings.public.app.name + ': ' + Meteor.settings.public.app.tagline;
    },

    signupLink() {
        return Meteor.absoluteUrl('sign-up');
    },

});

Template.embed.events({

    'submit #playNow'(e, i) {

        LoadingState.start(e);

        // Get values from form element
        const attrs = {
            categoryId: $('#gameCategoryId').val(),
            name: null,
            password: null,
            private: true,
            winPoints: 5,
            equalTurns: false,
            minDifficulty: 1,
            maxDifficulty: 3,
            minScore: 0,
            cardLimit: 0,
            autoProceed: false,
            cardTime: 0,
            turnOrder: Games.DEFAULT_TURN_ORDER,
            recycleCards: false,
            showHints: false,
            comparisonPrecision: Games.DEFAULT_PRECISION,
            displayPrecision: Games.DEFAULT_PRECISION,
            playerLimit: 1,
            noJoinAfterStart: false,
            autoShowMore: false,
        };

        Meteor.call('game.create', attrs, function(err, id) {
            if (!err) {
                Logger.log("Created Game: " + id);
                Session.set('currentGameId', id);
                Meteor.call('game.start', id, false, function(err, gameId) {
                    if (!err) {
                        Logger.log("Started Game: " + gameId);
                    } else {
                        throw new Meteor.Error('game-not-created', 'Could not start the game.', err);
                    }
                    LoadingState.stop();
                });
            } else {
                throw new Meteor.Error('game-not-created', 'Could not create the game.', err);
            }
        });

    },

    'click .more': Helpers.showClueMore,

});