import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from '../../modules/LoadingState';

import './game.html';

Template.game.onCreated(function gameOnCreated() {
    this.autorun(() => {
        Tracker.afterFlush(() => {
            this.easy = $('.difficulty .easy');
            this.moderate = $('.difficulty .moderate');
            this.hard = $('.difficulty .hard');
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
        return [
            {display: 'None (Owner Decides)', value: 0},
            {display: '25 Cards', value: 25},
            {display: '10 Cards', value: 10},
            {display: '5 Cards', value: 5},
        ];
    },

    guessLimits() {
        return [
            {display: 'Unlimited (Streak)', value: 0},
            {display: '10', value: 10},
            {display: '5', value: 5},
            {display: '3', value: 3},
            {display: '1', value: 1},
        ];
    },

    turnOrders() {
        return [
            {display: 'Sequential', value: 'sequential'},
            {display: 'Snake', value: 'snake'},
            {display: 'Random', value: 'random'},
        ];
    },

    timeLimits() {
        return [
            {display: 'No Limit', value: 0},
            {display: '3 Minutes', value: 180},
            {display: '2 Minutes', value: 120},
            {display: '1 Minute', value: 60},
            {display: '30 Seconds', value: 30},
            {display: '15 Seconds', value: 15},
        ];
    },

    scoreThresholds() {
        return [
            {display: 'No Restriction', value: 0},
            {display: '1+ (Any Positive)', value: 1},
            {display: '10+', value: 10},
            {display: '25+', value: 25},
            {display: '50+', value: 50},
            {display: '100+', value: 100},
        ];
    },

});

Template.game.events({

    'click .difficulty label'(e, i) {

        const clicked = $(e.target);

        // Don't allow the moderate toggle to be off if easy and hard are selected
        if (
            clicked.hasClass('moderate') &&
            i.easy.hasClass('active') &&
            i.hard.hasClass('active')
        ) {
            i.moderate.button('toggle');
        }

        // Disallow deselecting all difficulties
        if (clicked.hasClass('active')) {
            let numActive = 0;
            if (i.easy.hasClass('active')) ++numActive;
            if (i.moderate.hasClass('active')) ++numActive;
            if (i.hard.hasClass('active')) ++numActive;
            if (numActive < 2) {
                clicked.button('toggle');
            }
        }

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