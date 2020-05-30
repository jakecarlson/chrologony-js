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
        if (Meteor.user() && Meteor.user().currentRoomId) {
            FlowRouter.go('room', {id: Meteor.user().currentRoomId});
        }
        LoadingState.stop();
    });
});

Template.lobby.helpers({

    joinIsActive() {
        return (FlowRouter.getRouteName() == 'lobby');
    },
    
    cluesIsActive() {
        return ['clues', 'clues.categoryId'].includes(FlowRouter.getRouteName());
    },

    categoriesIsActive() {
        return (FlowRouter.getRouteName() == 'categories');
    },

});

Template.lobby.events({

    'click #clues-tab'(e, i) {
        FlowRouter.go('clues');
    },

    'click #categories-tab'(e, i) {
        FlowRouter.go('categories');
    },

});