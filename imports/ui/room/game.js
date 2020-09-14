import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from '../../modules/LoadingState';

import { Categories } from '../../api/Categories';
import { Games } from '../../api/Games';

import './game.html';
import '../precisions_selector.js';

Template.game.onCreated(function gameOnCreated() {
    this.autorun(() => {
        Tracker.afterFlush(() => {
            this.easy = $('.difficulty .easy input');
            this.moderate = $('.difficulty .moderate input');
            this.hard = $('.difficulty .hard input');
        });
    });
});

Template.game.helpers({

    gameInProgress() {
        return this.turn;
    },

    categoryId() {
        return (this.game) ? this.game.categoryId : null;
    },

    winConditions() {
        const selected = (this.game) ? this.game.winPoints : 0;
        return [
            {display: 'None (Owner Decides)', value: 0, selected: (0 == selected)},
            {display: '25 Cards', value: 25, selected: (25 == selected)},
            {display: '10 Cards', value: 10, selected: (10 == selected)},
            {display: '5 Cards', value: 5, selected: (5 == selected)},
        ];
    },

    guessLimits() {
        const selected = (this.game) ? this.game.cardLimit : 0;
        return [
            {display: 'Unlimited (Streak)', value: 0, selected: (0 == selected)},
            {display: '10', value: 10, selected: (10 == selected)},
            {display: '5', value: 5, selected: (5 == selected)},
            {display: '3', value: 3, selected: (3 == selected)},
            {display: '1', value: 1, selected: (1 == selected)},
        ];
    },

    turnOrders() {
        const selected = (this.game) ? this.game.turnOrder : 'sequential';
        return [
            {display: 'Sequential', value: 'sequential', selected: ('sequential' == selected)},
            {display: 'Snake', value: 'snake', selected: ('snake' == selected)},
            {display: 'Random', value: 'random', selected: ('random' == selected)},
        ];
    },

    timeLimits() {
        const selected = (this.game) ? this.game.cardTime : 0;
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
        const selected = (this.game) ? this.game.minScore : 0;
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
        return (this.game && this.game.equalTurns);
    },

    showHints() {
        return (this.game && this.game.showHints);
    },

    recycleCards() {
        return (this.game && this.game.recycleCards);
    },

    comparisonPrecision() {
        return (this.game) ? this.game.comparisonPrecision : 'date';
    },

    displayPrecision() {
        return (this.game) ? this.game.displayPrecision : 'date';
    },

    easy() {
        return (!this.game || (this.game && (this.game.minDifficulty == 1)));
    },

    hard() {
        return (!this.game || (this.game && (this.game.maxDifficulty == 3)));
    },

    moderate() {
        return (!this.game || (this.game && (this.game.minDifficulty <= 2) && (this.game.maxDifficulty >= 2)));
    },

});

Template.game.events({

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
        const categoryId = Helpers.getSelectValue(e.target);
        const category = Categories.findOne(categoryId);
        Helpers.setSelectValue(form.comparisonPrecision, category.precision);
        Helpers.setSelectValue(form.displayPrecision, category.precision);
    },

    'submit #game'(e, i) {

        LoadingState.start(e);
        const form = e.target;

        let difficulties = [];
        form.difficulty.forEach(function(input) {
            if (input.checked) {
                difficulties.push(parseInt(input.value));
            }
        });

        // Get values from form element
        const attrs = {
            roomId: this.room._id,
            categoryId: Helpers.getSelectValue(form.categoryId),
            winPoints: parseInt(Helpers.getSelectValue(form.winPoints)),
            equalTurns: form.equalTurns.checked,
            minDifficulty: difficulties[0],
            maxDifficulty: difficulties[difficulties.length-1],
            minScore: parseInt(Helpers.getSelectValue(form.minScore)),
            cardLimit: parseInt(Helpers.getSelectValue(form.cardLimit)),
            cardTime: parseInt(Helpers.getSelectValue(form.cardTime)),
            turnOrder: Helpers.getSelectValue(form.turnOrder),
            recycleCards: form.recycleCards.checked,
            showHints: form.showHints.checked,
            comparisonPrecision: Helpers.getSelectValue(form.comparisonPrecision),
            displayPrecision: Helpers.getSelectValue(form.displayPrecision),
        };

        Meteor.call('game.create', attrs, function(err, id) {
            if (!err) {
                Logger.log("Created Game: " + id);
            }
            LoadingState.stop();
            TourGuide.resume();
        });

    },

});