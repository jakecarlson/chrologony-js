import { Template } from 'meteor/templating';
import { Meteor } from "meteor/meteor";
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';

import { Games } from '../../api/Games';

import './lobby.html';
import './join.js';
import '../game_creator.js';
import './categories_manager.js';
import './clues_manager.js';
import './featured.js';

Template.lobby.onCreated(function lobbyOnCreated() {

    this.autorun(() => {

        if (typeof(Session.get('lastOwnedGameId')) == 'undefined') {
            Meteor.call('game.lastOwned',function(err, id) {
                if (!err) {
                    Logger.log("Last Owned Game: " + id);
                    Session.set('lastOwnedGameId', id);
                } else {
                    throw new Meteor.Error('last-game-not-received', 'Could not get the user\'s last game.', err);
                }
            });
        }

        FlowRouter.watchPathChange();
        if (FlowRouter.current().context.hash == 'tour') {
            TourGuide.start();
        }

        Tracker.afterFlush(() => {
            $(function() {
                $('[data-toggle="tooltip"]').tooltip();
                if (Mobile.is()) {
                    $('.game i[data-toggle="tooltip"]').tooltip('disable');
                }
            });
        });

    });

});

Template.lobby.helpers({

    lastGame() {
        const lastOwnedGame = Games.findOne(Session.get('lastOwnedGameId'));
        return lastOwnedGame;
    },

});

Template.lobby.events({

});