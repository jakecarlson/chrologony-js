import { Meteor } from 'meteor/meteor';
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { LoadingState } from "../modules/LoadingState";
import { Session } from "meteor/session";

import '../modules/TourGuide';
import './layout_authenticated.html';
import './content/privacy.js';
import './content/terms.js';
import './lobby/lobby.js';
import './game/game.js';
import './child_manager.js';
import './header.js';
import './share.js';
import './flasher.js';

import { Clues } from "../api/Clues";
import { Categories } from "../api/Categories";

Template.layout_authenticated.onCreated(function layout_authenticatedOnCreated() {

    LoadingState.start();

    this.currentClue = new ReactiveVar(null);
    this.categories = new ReactiveVar([]);

    this.autorun(() => {

        FlowRouter.watchPathChange();
        Helpers.subscribe(this, 'games', Helpers.currentAndPreviousGameIds());
        Helpers.subscribe(this, 'categories');

        if (this.subscriptionsReady()) {

            const self = this;
            Tracker.afterFlush(() => {

                $('#manageChildCategories').on('hidden.bs.modal', function(e) {
                    self.currentClue.set(null);
                });

            });

            LoadingState.stop();

        }

    });

});

Template.layout_authenticated.onRendered(function layout_authenticatedOnRendered() {

});

Template.layout_authenticated.helpers({

    currentClueName() {
        const clue = Template.instance().currentClue.get();
        return (clue) ? Formatter.date(clue.date) : null;
    },

    currentClue() {
        return Template.instance().currentClue.get();
    },

    categories() {
        return Template.instance().categories.get();
    },

    categoryMapper() {
        return getCategoryMapper();
    },

    whitelistedCategories() {
        const categories = Categories.find({source: 'user'});
        return categories.fetch().map(function(category) { return category._id; });
    },

    columnsBoard() {
        return ((FlowRouter.getRouteName() != 'game') || !Session.get('fullBoard'));
    },

})

Template.layout_authenticated.events({

    'click .tour-link'(e, i) {
        e.preventDefault();
        FlowRouter.go('lobby');
        TourGuide.start();
    },

    'click .categories'(e, i) {
        e.preventDefault();
        const link = $(e.target).closest('a');
        const id = link.attr('data-id');
        const clue = Clues.findOne(id);
        i.currentClue.set(clue);
        if (clue && clue.categories) {
            Meteor.call('category.get', clue.categories, function(err, res) {
                if (err) {
                    Logger.log(err, 3);
                    return;
                }
                launchCategoriesModal(i, res.map(getCategoryMapper()));
            });
        } else {
            launchCategoriesModal(i, []);
        }
    },

});

function launchCategoriesModal(i, categories) {
    i.categories.set(categories);
    LoadingState.stop();
    $('#manageChildCategories').modal('show');
}

function getCategoryMapper() {
    return (function(category){ return {id: category._id, value: category.theme + ': ' + category.name} });
}