import { ReactiveVar } from "meteor/reactive-var";
import { Template } from "meteor/templating";
import { LoadingState } from "../modules/LoadingState";

import './layout_embedded.html';
import './room/room.js';
import {Meteor} from "meteor/meteor";
import {Session} from "meteor/session";

Template.layout_embedded.onCreated(function layout_embeddedOnCreated() {

    LoadingState.start();

    Meteor.call('user.anonymous', function(err, success) {
        Meteor.connection.setUserId('anonymous');
    });

    this.categories = new ReactiveVar([]);

    Session.set('muted', true);

    this.autorun(() => {
        this.subscribe('rooms', (Meteor.user()) ? Meteor.user().currentRoomId : null);
        this.subscribe('categories');
        if (this.subscriptionsReady()) {
            LoadingState.stop();
        }
    });

});

Template.layout_embedded.onRendered(function layout_embeddedOnRendered() {

});

Template.layout_embedded.helpers({

    categories() {
        return Template.instance().categories.get();
    },

})

Template.layout_embedded.events({

});