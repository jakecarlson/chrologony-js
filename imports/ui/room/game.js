import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { LoadingState } from '../../startup/LoadingState';

import './game.html';

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

});

Template.game.events({

    'submit #game'(e, i) {

        LoadingState.start(e);

        // Get value from form element
        const target = e.target;
        const attrs = {
            categoryId: target.categoryId.options[target.categoryId.selectedIndex].value,
            roomId: this.room._id,
        };

        Meteor.call('game.create', attrs, function(error, id) {
            if (!error) {
                Logger.log("Created Game: " + id);
            }
            LoadingState.stop();
        });

    },

});