import '../imports/startup/accounts/config';
import '../imports/startup/accounts/templates';
import '../imports/startup/template-helpers';
import '../imports/modules/Logger';
import '../imports/modules/Formatter';
import '../imports/modules/Helpers';
import '../imports/modules/Flasher';
import '../imports/modules/Mobile';
import '../imports/modules/SoundManager';
import '../imports/modules/GameObserver';

import './routes';
import '../imports/ui/body';

import 'bootstrap';
import 'bootswatch/dist/pulse/bootstrap.min.css';
import 'bootstrap4-toggle';
import 'bootstrap4-toggle/css/bootstrap4-toggle.min.css';

Meteor.startup(function() {

    Logger.init();

    if (Mobile.is()) {
        document.addEventListener("deviceready", Mobile.init, false);
    } else {
        window.addEventListener('orientationchange', handleViewportChange, false);
        window.addEventListener('resize', handleViewportChange, false);
    }

});

function handleViewportChange(e) {
    const orientation = (window.innerHeight > window.innerWidth) ? 'portrait' : 'landscape';
    const body = $(document.body);
    body.removeClass('portrait');
    body.removeClass('landscape');
    body.addClass(orientation);
}