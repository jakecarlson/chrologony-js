import { Template } from "meteor/templating";
import { LoadingState } from "../modules/LoadingState";

import './body.html';
import './layout_authenticated.js';
import './layout_unauthenticated.js';
import './embed.js';

Template.body.onCreated(function bodyOnCreated() {

    this.autorun(() => {

        LoadingState.start();

        this.subscribe('userData');
        this.subscribe('categories');

        if (this.subscriptionsReady()) {

            Tracker.afterFlush(() => {
                $(function() {
                    $('[data-toggle="popover"]').popover();
                    $('[data-toggle="tooltip"]').tooltip();
                });
            });

            LoadingState.stop();

        }

    });

});

Template.body.onRendered(function bodyOnRendered() {
    Logger.log('Rendered body');
});