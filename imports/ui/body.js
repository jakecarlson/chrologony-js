import { Template } from "meteor/templating";
import { LoadingState } from "../modules/LoadingState";

import './layout_authenticated.js';
import './layout_unauthenticated.js';
import './embed.js';

import './body.html';

Template.body.onCreated(function bodyOnCreated() {

    this.autorun(() => {

        LoadingState.start();

        this.subscribe('userData');
        this.subscribe('categories');

        if (this.subscriptionsReady()) {

            if (Reload.isWaitingForResume()) {
                Logger.log('Waiting for Auto-Update');
                if (!Meteor.isProduction) {
                    Logger.log('Initiate Auto-Update');
                    window.location.replace(window.location.href);
                }
            }

            Tracker.afterFlush(() => {
                $(function() {
                    $('[data-toggle="popover"]').popover();
                    $('[data-toggle="tooltip"]').tooltip();
                    $('.alert-dismissible').fadeTo(2000, 500).slideUp(500, function(){
                        $('.alert-dismissible').alert('close');
                    });
                });
            });

            LoadingState.stop();

        }

    });

});

Template.body.onRendered(function bodyOnRendered() {
    Logger.log('Rendered body');
    if (
        Meteor.isCordova &&
        (typeof(navigator) !== 'undefined') &&
        navigator.splashscreen
    ) {
        Logger.log('Mobile: Wait .25 seconds to hide splash screen');
        setTimeout(function() {
            Logger.log('Mobile: Hide splash screen');
            navigator.splashscreen.hide();
        }, 250);
    }
});