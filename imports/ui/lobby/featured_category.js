import { Template } from 'meteor/templating';
import { LoadingState } from '../../modules/LoadingState';
import { Meteor } from "meteor/meteor";

import './featured_category.html';
import {Session} from "meteor/session";

Template.featured_category.onCreated(function featured_categoryOnCreated() {
});

Template.featured_category.helpers({


});

Template.featured_category.events({

    'click'(e, i) {

        const attrs = {
            categoryId: this.category._id,
            comparisonPrecision: this.category.precision,
            displayPrecision: this.category.precision,
            private: true,
            autoShowMore: true,
        };

        Meteor.call('game.create', attrs, function(err, id) {
            if (err) {
                Logger.log(err);
            } else {
                Logger.log("Created Game: " + id);
                Session.set('lastOwnedGameId', id);
                Helpers.subscribe(i, 'games', Helpers.currentAndPreviousGameIds());
                Helpers.joinGame(id);
            }
            LoadingState.stop();
        });

    },

});