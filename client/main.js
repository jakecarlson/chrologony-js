import '../imports/startup/accounts/config';
import '../imports/startup/accounts/templates';
import '../imports/startup/template-helpers';
import '../imports/modules/Logger';
import '../imports/modules/Formatter';
import '../imports/modules/Helpers';
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

    if (Meteor.isCordova && (window.cordova.platformId == 'android')) {
        StatusBar.overlaysWebView(false);
        setTimeout(function() {
            StatusBar.overlaysWebView(true);
        }, 100);
        setSafeAreaInsets();
        document.addEventListener('orientationchange', setSafeAreaInsets, false);
        screen.orientation.addEventListener('change', setSafeAreaInsets, false);
        document.addEventListener('resize', setSafeAreaInsets, false);
    }

});

function setSafeAreaInsets(e) {
    if (window.AndroidNotch) {
        const style = document.documentElement.style;
        window.AndroidNotch.getInsetTop(px => {
            if (['portrait', 'portrait-primary', 'portrait-secondary'].includes(screen.orientation.type)) {
                StatusBar.show();
            } else {
                px = 0;
                StatusBar.hide();
            }
            style.setProperty("--safe-area-inset-top", px + "px");
        }, (err) => Logger.log("Failed to get insets top: " + err));
    }
}