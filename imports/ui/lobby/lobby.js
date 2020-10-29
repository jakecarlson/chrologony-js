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

});

Template.lobby.events({

});