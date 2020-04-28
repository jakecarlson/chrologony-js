import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

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

        e.preventDefault();

        // Get value from form element
        const target = e.target;
        const attrs = {
            categoryId: target.categoryId.options[target.categoryId.selectedIndex].value,
            roomId: this.room._id,
        };

        Session.set('loading', true);
        Meteor.call('game.insert', attrs, function(error, id) {
            if (!error) {
                console.log("Created Game: " + id);
                Meteor.subscribe('games', id);
                Meteor.subscribe('turns', id);
                Meteor.subscribe('cards', id);
                Session.set('loading', false);
            }
        });

    },

});