import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from "meteor/reactive-var";
import { Session } from "meteor/session";
import { LoadingState } from '../modules/LoadingState';

import { Categories } from '../api/Categories';
import { Games } from '../api/Games';

import './game_creator.html';
import './precisions_selector.js';
import './categories_search.js';

Template.game_creator.onCreated(function gameOnCreated() {

    this.advanced = new ReactiveVar(false);

    this.autorun(() => {
        Tracker.afterFlush(() => {
            this.easy = $('.difficulty .easy input');
            this.moderate = $('.difficulty .moderate input');
            this.hard = $('.difficulty .hard input');
        });
    });

});

Template.game_creator.helpers({

    category() {
        return (this.lastGame) ? this.lastGame.category() : null;
    },

    basic() {
        return !Template.instance().advanced.get();
    },

    advanced() {
        return Template.instance().advanced.get();
    },

    categorySearchPlaceholder() {
        return (!Template.instance().advanced.get()) ? 'Search for Game Category (required) ...' : false;
    },

    winConditions() {
        let selected = 10;
        if (this.lastGame && this.lastGame.winPoints) {
            selected = this.lastGame.winPoints;
        }
        return [
            {display: 'None (Owner Decides)', value: 0, selected: (0 == selected)},
            {display: '25 Cards', value: 25, selected: (25 == selected)},
            {display: '10 Cards', value: 10, selected: (10 == selected)},
            {display: '5 Cards', value: 5, selected: (5 == selected)},
        ];
    },

    guessLimits() {
        const selected = (this.lastGame) ? this.lastGame.cardLimit : 0;
        return [
            {display: 'Unlimited (Streak)', value: 0, selected: (0 == selected)},
            {display: '10', value: 10, selected: (10 == selected)},
            {display: '5', value: 5, selected: (5 == selected)},
            {display: '3', value: 3, selected: (3 == selected)},
            {display: '1', value: 1, selected: (1 == selected)},
        ];
    },

    turnOrders() {
        const selected = (this.lastGame) ? this.lastGame.turnOrder : Games.DEFAULT_TURN_ORDER;
        return [
            {display: 'Sequential', value: 'sequential', selected: ('sequential' == selected)},
            {display: 'Snake', value: 'snake', selected: ('snake' == selected)},
            {display: 'Random', value: 'random', selected: ('random' == selected)},
        ];
    },

    timeLimits() {
        const selected = (this.lastGame) ? this.lastGame.cardTime : 0;
        return [
            {display: 'No Limit', value: 0, selected: (0 == selected)},
            {display: '3 Minutes', value: 180, selected: (180 == selected)},
            {display: '2 Minutes', value: 120, selected: (120 == selected)},
            {display: '1 Minute', value: 60, selected: (60 == selected)},
            {display: '30 Seconds', value: 30, selected: (30 == selected)},
            {display: '15 Seconds', value: 15, selected: (15 == selected)},
        ];
    },

    scoreThresholds() {
        const selected = (this.lastGame) ? this.lastGame.minScore : 0;
        return [
            {display: 'No Restriction', value: 0, selected: (0 == selected)},
            {display: '1+ (Any Positive)', value: 1, selected: (1 == selected)},
            {display: '10+', value: 10, selected: (10 == selected)},
            {display: '25+', value: 25, selected: (25 == selected)},
            {display: '50+', value: 50, selected: (50 == selected)},
            {display: '100+', value: 100, selected: (100 == selected)},
        ];
    },

    equalTurns() {
        return (this.lastGame && this.lastGame.equalTurns);
    },

    showHints() {
        return (this.lastGame && this.lastGame.showHints);
    },

    recycleCards() {
        return (this.lastGame && this.lastGame.recycleCards);
    },

    autoProceed() {
        return (this.lastGame && this.lastGame.autoProceed);
    },

    comparisonPrecision() {
        return (this.lastGame) ? this.lastGame.comparisonPrecision : Games.DEFAULT_PRECISION;
    },

    displayPrecision() {
        return (this.lastGame) ? this.lastGame.displayPrecision : Games.DEFAULT_PRECISION;
    },

    easy() {
        return (!this.lastGame || (this.lastGame && (this.lastGame.minDifficulty == 1)));
    },

    hard() {
        return (!this.lastGame || (this.lastGame && (this.lastGame.maxDifficulty == 3)));
    },

    moderate() {
        return (!this.lastGame || (this.lastGame && (this.lastGame.minDifficulty <= 2) && (this.lastGame.maxDifficulty >= 2)));
    },

    playerLimits() {
        const selected = (this.lastGame) ? this.lastGame.playerLimit : 8;
        return [
            {display: 'Unlimited', value: 0, selected: (0 == selected)},
            {display: '24', value: 24, selected: (24 == selected)},
            {display: '16', value: 16, selected: (16 == selected)},
            {display: '8', value: 8, selected: (8 == selected)},
            {display: '4', value: 4, selected: (4 == selected)},
            {display: '2', value: 2, selected: (2 == selected)},
            {display: 'Solo', value: 1, selected: (1 == selected)},
        ];
    },

    noJoinAfterStart() {
        return (this.lastGame && this.lastGame.noJoinAfterStart);
    },

    autoShowMore() {
        return (this.lastGame && this.lastGame.autoShowMore);
    },

});

Template.game_creator.events({

    'click #gameOptionsToggle'(e, i) {
        i.advanced.set(!i.advanced.get());
        $(e.target).closest('.modal').toggleClass('advanced');
        $('[data-toggle="tooltip"]').tooltip();
    },

    'change .difficulty input'(e, i) {

        // Set timeout or this ends up in an infinite loop
        Meteor.setTimeout(function() {

            const changed = $(e.target);
            const easy = i.easy.is(':checked');
            const moderate = i.moderate.is(':checked');
            const hard = i.hard.is(':checked');

            // Don't allow moderate to be disabled if easy and hard are enabled
            if (!moderate && easy && hard) {
                i.moderate.closest('label').button('toggle');
            }

            // Force at least 1 difficulty to be toggled
            let difficulties = 0;
            if (easy) ++difficulties;
            if (moderate) ++difficulties;
            if (hard) ++difficulties;
            if (difficulties < 1) {
                changed.closest('label').button('toggle');
            }

        }, 100);

    },

    'change #gameCategoryId'(e, i) {
        const form = e.target.form;
        const categoryId = $(e.target).val();
        const category = Categories.findOne(categoryId);
        Helpers.setSelectValue(form.comparisonPrecision, category.precision);
        Helpers.setSelectValue(form.displayPrecision, category.precision);
    },

    'submit #gameCreator'(e, i) {

        LoadingState.start(e);
        const form = e.target;

        // Only proceed if a category was selected
        const categoryId = $(form.categoryId).val();
        if (categoryId) {

            let difficulties = [];
            form.difficulty.forEach(function(input) {
                if (input.checked) {
                    difficulties.push(parseInt(input.value));
                }
            });

            // Get values from form element
            const attrs = {
                categoryId: categoryId,
                name: form.name.value,
                password: form.password.value,
                private: form.private.checked,
                winPoints: parseInt(Helpers.getSelectValue(form.winPoints)),
                equalTurns: form.equalTurns.checked,
                minDifficulty: difficulties[0],
                maxDifficulty: difficulties[difficulties.length-1],
                minScore: parseInt(Helpers.getSelectValue(form.minScore)),
                cardLimit: parseInt(Helpers.getSelectValue(form.cardLimit)),
                autoProceed: form.autoProceed.checked,
                cardTime: parseInt(Helpers.getSelectValue(form.cardTime)),
                turnOrder: Helpers.getSelectValue(form.turnOrder),
                recycleCards: form.recycleCards.checked,
                showHints: form.showHints.checked,
                comparisonPrecision: Helpers.getSelectValue(form.comparisonPrecision),
                displayPrecision: Helpers.getSelectValue(form.displayPrecision),
                playerLimit: parseInt(Helpers.getSelectValue(form.playerLimit)),
                noJoinAfterStart: form.noJoinAfterStart.checked,
                autoShowMore: form.autoShowMore.checked,
            };

            Meteor.call('game.create', attrs, function(err, id) {

                if (err) {
                    Logger.log(err);
                    Flasher.error('An active game with that name already exists.');
                } else {

                    Logger.log("Created Game: " + id);
                    Session.set('lastOwnedGameId', id);

                    Helpers.subscribe(i, 'games', Helpers.currentAndPreviousGameIds());

                    Session.set('gamePassword', form.password.value);
                    form.password.value = '';
                    Helpers.joinGame(id);

                }

                LoadingState.stop();
                TourGuide.resume();

            });

        } else {
            Flasher.error('You must select a category to create a game.');
            LoadingState.stop();
        }

    },

});