import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { LoadingState } from '../../modules/LoadingState';

import './lobby.html';
import './join.js';
import './categories_manager.js';
import './clues_manager.js';

Template.lobby.onCreated(function lobbyOnCreated() {

    this.autorun(() => {

        FlowRouter.watchPathChange();
        if (FlowRouter.current().context.hash == 'tour') {
            TourGuide.start();
        }

        LoadingState.stop();

    });

});

Template.lobby.helpers({

    joinIsActive() {
        return (FlowRouter.getRouteName() == 'lobby');
    },

    cluesIsActive() {
        return ['clues', 'clues.categoryId', 'clues.categoryId.clueId'].includes(FlowRouter.getRouteName());
    },

    categoriesIsActive() {
        return (FlowRouter.getRouteName() == 'categories');
    },

});

Template.lobby.events({

    'click #cluesTab'(e, i) {
        if (
            !TourGuide.isActive() ||
            (TourGuide.isActive() && TourGuide.isCluesStep())
        ) {
            FlowRouter.go('clues');
            if (TourGuide.isActive()) {
                TourGuide.resume();
            }
        } else {
            e.preventDefault();
        }
    },

    'click #categoriesTab'(e, i) {
        if (
            !TourGuide.isActive() ||
            (TourGuide.isActive() && TourGuide.isCategoriesStep())
        ) {
            FlowRouter.go('categories');
            if (TourGuide.isActive()) {
                TourGuide.resume();
            }
        } else {
            e.preventDefault();
        }
    },

});