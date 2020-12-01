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

    if (Meteor.isCordova) {
        if (Helpers.isAndroid()) {
            StatusBar.overlaysWebView(false);
            setTimeout(function() {
                StatusBar.overlaysWebView(true);
            }, 100);
            handleMobileViewportChange();
        }
        document.addEventListener('orientationchange', handleMobileViewportChange, false);
        screen.orientation.addEventListener('change', handleMobileViewportChange, false);
        document.addEventListener('resize', handleMobileViewportChange, false);
    }

});

function handleMobileViewportChange(e) {

    // If the devices is in portrait mode, show the status bar
    if (Helpers.isPortrait()) {

        StatusBar.show();

        // Calculate the Android top safe area
        if (window.AndroidNotch && Helpers.isAndroid()) {
            window.AndroidNotch.getInsetTop(px => {
                setAndroidSafeAreaInsetTop(px);
            }, (err) => Logger.log("Failed to get insets top: " + err));
        }

        // Re-apply the backdrop-filter blur effect for the status bar
        const statusBarStyle = document.getElementById('status').style;
        statusBarStyle.display = "none";
        setTimeout(function() {
            statusBarStyle.webkitBackdropFilter = "blur(32px)";
            statusBarStyle.backdropFilter = "blur(32px)";
            statusBarStyle.display = "block";
        }, 0);

    // If the device is in landscape mode, hide the status bar
    } else {

        StatusBar.hide();

        // Reset the Android top safe area
        setAndroidSafeAreaInsetTop(0);

    }

}

function setAndroidSafeAreaInsetTop(px) {
    document.documentElement.style.setProperty("--safe-area-inset-top", px + "px");
}