import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import { Games } from '../api/games';

import './game.html';

Template.game.onCreated(function gameOnCreated() {
    this.autorun(() => {
        // this.subscribe('turns', this.data.room.currentGameId);
        // this.subscribe('cards', this.data.room.currentGameId);
    });

});

Template.game.helpers({

    gameInProgress() {
        return (this.room && this.room.currentGameId);
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
                // console.log(i.parentData());
                Session.set('loading', false);
            }
        });

    },

});