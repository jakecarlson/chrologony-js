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
                $(function() {
                    $('[data-toggle="popover"]').popover();
                })
            });

            LoadingState.stop();

        }

    });

});