import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './game.html';

Template.game.onCreated(function gameOnCreated() {
    this.state = new ReactiveDict();
    Meteor.subscribe('turns', this.data.room.currentGameId);
});

Template.game.helpers({

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
                Meteor.subscribe('turns', id);
                Session.set('loading', false);
            }
        });

    },

});