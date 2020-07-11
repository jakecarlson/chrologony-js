import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from '../../modules/LoadingState';

import './game.html';
import SimpleSchema from "simpl-schema";

Template.game.onCreated(function gameOnCreated() {
    this.autorun(() => {

    });
});

Template.game.helpers({

    gameInProgress() {
        return this.game;
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

});

Template.game.events({

    'submit #game'(e, i) {

        LoadingState.start(e);

        // Get value from form element
        const target = e.target;
        const attrs = {
            roomId: this.room._id,
            categoryId: getSelectValue(target.categoryId),
            winPoints: parseInt(getSelectValue(target.winPoints)),
            equalTurns: Helpers.toBool(target.equalTurns),
            cardLimit: parseInt(getSelectValue(target.cardLimit)),
            cardTime: parseInt(getSelectValue(target.cardTime)),
            turnOrder: getSelectValue(target.turnOrder),
            recycleCards: Helpers.toBool(target.recycleCards),
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

function getSelectValue(select) {
    return select.options[select.selectedIndex].value;
}