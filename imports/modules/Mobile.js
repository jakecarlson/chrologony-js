Mobile = {

    init() {

        if (this.is()) {

            if (this.isAndroid()) {
                StatusBar.overlaysWebView(false);
                setTimeout(function() {
                    StatusBar.overlaysWebView(true);
                }, 100);
                this.handleViewportChange();
            }

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

    handleViewportChange(e) {

        const statusBarStyle = document.getElementById('status').style;

        // If the devices is in portrait mode, show the status bar
        Logger.log('Orientation: ' + screen.orientation.type);
        if (Mobile.isPortrait()) {

            StatusBar.show();

            // Calculate the Android top safe area
            if (window.AndroidNotch && Mobile.isAndroid()) {
                window.AndroidNotch.getInsetTop(px => {
                    Logger.log('Status Bar Height: ' + px);
                    Mobile.setSafeAreaInsetTop(px);
                }, (err) => Logger.log("Failed to get insets top: " + err));
            }

            // Re-apply the backdrop-filter blur effect for the status bar
            statusBarStyle.display = "block";

        // If the device is in landscape mode, hide the status bar
        } else {

            StatusBar.hide();
            statusBarStyle.display = "none";

            // Reset the Android top safe area
            Mobile.setSafeAreaInsetTop(0);

        }

    },

    setSafeAreaInsetTop(px) {
        const str = px + "px";
        document.documentElement.style.setProperty("--safe-area-inset-top", str);
    },

};