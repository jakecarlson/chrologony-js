import { Meteor } from "meteor/meteor";
import { Session } from "meteor/session";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { LoadingState } from "../modules/LoadingState";

import './embed.html';
import './game/board.js';
import './game/clue_more.js';

import { Games } from "../api/Games";
import { Turns } from "../api/Turns";

Template.embed.onCreated(function embedOnCreated() {

    LoadingState.start();

    Meteor.call('user.anonymous', function(err, success) {
        Meteor.connection.setUserId('anonymous');
    });

    Session.set('muted', true);

    this.initialized = false;
    this.game = new ReactiveVar(null);
    this.turn = new ReactiveVar(null);
    this.clueMore = new ReactiveVar(null);

    this.autorun((computation) => {

        LoadingState.start();

        Helpers.subscribe(this, 'games');

        const user = Meteor.user({fields: {currentGameId: 1}});
        if (user) {

            this.game.set(user.currentGame());
            if (this.game.get()) {

                Helpers.subscribe(this, 'games', [this.game.get()._id]);

                if (Session.get('currentGameId')) {

                    Helpers.subscribe(this, 'turns', Session.get('currentGameId'));
                    Helpers.subscribe(this, 'cards', Session.get('currentGameId'));
                    Helpers.subscribe(this, 'cardClues', Session.get('currentGameId'));

                    this.game.set(Games.findOne(Session.get('currentGameId')));
                    if (this.game.get() && this.game.get().currentTurnId) {
                        this.turn.set(Turns.findOne(this.game.get().currentTurnId));
                    }

                } else {
                    this.game.set(null);
                    this.turn.set(null);
                }

                if (this.subscriptionsReady()) {

                    const self = this;
                    Tracker.afterFlush(() => {
                        $('#clueMore').on('hidden.bs.modal', function(e) {
                            self.clueMore.set(null);
                        });
                    });

                    this.initialized = true;
                    LoadingState.stop();

                }

            } else {
                LoadingState.stop();
            }

        }

    });

    GameObserver.observe(this, true);

});

Template.embed.helpers({

    dataReady() {
        return (Meteor.user() && Template.instance().game.get());
    },

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

});

Template.embed.events({

    'click .more': Helpers.showClueMore,

});