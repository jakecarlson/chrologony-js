import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from '../../modules/LoadingState';

import './game.html';

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