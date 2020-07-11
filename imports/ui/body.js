import { LoadingState } from "../modules/LoadingState";
import './layout_authenticated.js';
import './layout_unauthenticated.js';

import './body.html';

Template.body.onCreated(function bodyOnCreated() {

    this.autorun(() => {

        LoadingState.start();

        this.subscribe('userData');
        this.subscribe('categories');

        if (this.subscriptionsReady()) {

            Tracker.afterFlush(() => {
                $(function() {
                    $('[data-toggle="popover"]').popover();
                });
                $(function() {
                    $('[data-toggle="tooltip"]').tooltip();
                });
            });

            LoadingState.stop();

        }

    });

});