import { LoadingState } from "../modules/LoadingState";
import './layout_authenticated.js';
import './layout_unauthenticated.js';
import Clipboard from "clipboard";

Template.body.onCreated(function bodyOnCreated() {

    this.autorun(() => {

        LoadingState.start();

        this.subscribe('userData')

        if (this.subscriptionsReady()) {

            Tracker.afterFlush(() => {
                let clipboards = new Clipboard('[data-clipboard-text]');
                clipboards.on('success', function(e) {
                    var btn = $(e.trigger);
                    btn.popover('show');
                    setTimeout(function() {btn.popover('hide');},3000);
                });
            });

            LoadingState.stop();

        }

    });

});