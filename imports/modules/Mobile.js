Mobile = {

    init() {

        if (this.is()) {

            if (
                (typeof(navigator) !== 'undefined') &&
                navigator.splashscreen
            ) {
                Logger.log('Mobile: Wait .25 seconds to hide splash screen');
                setTimeout(function() {
                    Logger.log('Mobile: Hide splash screen');
                    navigator.splashscreen.hide();
                }, 250);
            }

            this.bodyEl = document.body;
            this.statusBarEl = document.getElementById('status');
            this.alertEl = document.getElementById('alert');

            if (this.isAndroid()) {
                StatusBar.overlaysWebView(false);
                setTimeout(function() {
                    StatusBar.overlaysWebView(true);
                }, 100);
            }
            this.handleViewportChange();

            document.addEventListener('orientationchange', this.handleViewportChange, false);
            screen.orientation.addEventListener('change', this.handleViewportChange, false);
            document.addEventListener('resize', this.handleViewportChange, false);

        }

    },

    is() {
        return Meteor.isCordova;
    },

    isAndroid() {
        return (window.cordova.platformId == 'android');
    },

    isPortrait() {
        return ['portrait', 'portrait-primary', 'portrait-secondary'].includes(screen.orientation.type);
    },

    handleViewportChange() {

        // If the devices is in portrait mode, show the status bar
        Logger.log('Orientation: ' + screen.orientation.type);
        if (Mobile.isPortrait()) {

            StatusBar.show();

            // Calculate the Android top safe area
            if (window.AndroidNotch && Mobile.isAndroid()) {
                window.AndroidNotch.getInsetTop(px => {
                    Mobile.setSafeAreaInsetTop(px);
                }, (err) => Logger.log("Failed to get insets top: " + err));
            }

            Mobile.statusBarEl.style.display = "block";

        // If the device is in landscape mode, hide the status bar
        } else {

            StatusBar.hide();
            Mobile.statusBarEl.style.display = "none";

            // Reset the Android top safe area
            if (window.AndroidNotch && Mobile.isAndroid()) {
                Mobile.setSafeAreaInsetTop(0);
            }

        }

    },

    setSafeAreaInsetTop(px) {
        Logger.log('Safe Top Inset: ' + px);
        const str = px + "px";
        this.bodyEl.style.setProperty('padding-top', str);
        this.statusBarEl.style.setProperty('height', str);
        this.alertEl.style.setProperty('top', (px + 8) + 'px');
    },

};