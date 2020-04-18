import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Session } from 'meteor/session';

import './game.html';

Template.game.onCreated(function gameOnCreated() {
    this.state = new ReactiveDict();

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
            roomId: Session.get('room'),
        };

        Meteor.call('game.insert', attrs, function(error, id) {
            if (!error) {
                console.log("Created Game: " + id)
            }
        });

    },

});