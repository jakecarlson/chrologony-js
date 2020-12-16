Mobile = {

    init() {

        Mobile.handleUpdate();
        Mobile.setElementReferences();
        Mobile.setBodyClasses();
        Mobile.registerViewportChangeHandlers();

        if (Mobile.isIOS()) {
            Mobile.initIOS();
        } else if (Mobile.isAndroid()) {
            Mobile.initAndroid();
        } else {
            Mobile.initDefault();
        }

    },

    setBodyClasses() {
        Mobile.bodyEl.addClass('platform-' + window.cordova.platformId);
        Mobile.setOrientationClass();
    },

    handleUpdate() {

        if (Meteor.isDevelopment) {
            Reloader.configure({
                check: false, // don't check on startup
                refresh: 'instantly' // refresh as soon as updates are available
            });
        } else {
            Reloader.configure({
                check: 'everyStart', // Check for new code every time the app starts
                checkTimer: 3000,  // Wait 3 seconds to see if new code is available
                refresh: 'startAndResume', // Refresh to already downloaded code on both start and resume
                idleCutoff: 1000 * 60 // Wait 1 minute before treating a resume as a start
            });
        }

        if (Reloader.updateAvailable.get()) {
            Logger.log('New Update Downloaded');
        }

    },

    registerViewportChangeHandlers() {
        document.addEventListener('orientationchange', Mobile.handleViewportChange, false);
        screen.orientation.addEventListener('change', Mobile.handleViewportChange, false);
        document.addEventListener('resize', Mobile.handleViewportChange, false);
    },

    setElementReferences() {
        Mobile.bodyEl = $(document.body);
        Mobile.statusBarEl = document.getElementById('status');
    },

    setOrientationClass() {

        // Set orientation class
        if (Mobile.orientation) {
            Mobile.bodyEl.removeClass(Mobile.getOrientationClass());
        }
        Mobile.orientation = screen.orientation.type;
        Mobile.bodyEl.addClass(Mobile.getOrientationClass());

        // Set edge-to-edge class
        const xMargins = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-x"));
        Mobile.bodyEl.toggleClass('edge-to-edge', (xMargins == 0));

    },

    getOrientationClass() {
        return 'orientation-' + Mobile.orientation;
    },

    initAndroid() {
        Mobile.start();
    },

    initIOS() {
        Mobile.statusBarEl.style.display = "none";
        setTimeout(Mobile.start, 250);
        Keyboard.shrinkView(true);
    },

    initDefault() {
        Mobile.start();
    },

    start() {
        Mobile.handleViewportChange();
        setTimeout(Mobile.hideSplashScreen, 250);
    },

    is() {
        return Meteor.isCordova;
    },

    isAndroid() {
        return (window.cordova.platformId == 'android');
    },

    isIOS() {
        return (window.cordova.platformId == 'ios');
    },

    isPortrait() {
        return ['portrait', 'portrait-primary', 'portrait-secondary'].includes(screen.orientation.type);
    },

    handleViewportChange() {

        // Set current orientation
        Mobile.setOrientationClass();

        // If the devices is in portrait mode, show the status bar
        Logger.log('Orientation: ' + Mobile.orientation);
        if (Mobile.isPortrait()) {

            // Calculate the Android top safe area
            if (window.AndroidNotch && Mobile.isAndroid()) {
                window.AndroidNotch.getInsetTop(px => {
                    Mobile.setSafeAreaInsetTop(px);
                }, (err) => Logger.log("Failed to get insets top: " + err));
            }

            Mobile.showStatusBar();

        // If the device is in landscape mode, hide the status bar
        } else {

            Mobile.hideStatusBar();

            // Reset the Android top safe area
            if (window.AndroidNotch && Mobile.isAndroid()) {
                Mobile.setSafeAreaInsetTop(0);
            }

        }

    },

    setSafeAreaInsetTop(px) {
        Logger.log('Safe Top Inset: ' + px);
        const str = px + "px";
        document.documentElement.style.setProperty("--safe-area-inset-top", px + "px");
    },

    hideSplashScreen() {
        if (
            (typeof(navigator) !== 'undefined') &&
            navigator.splashscreen
        ) {
            Logger.log('Mobile: Hide splash screen');
            navigator.splashscreen.hide();
        }
    },

    hideStatusBar() {
        Mobile.statusBarEl.style.display = "none";
        StatusBar.hide();
    },

    showStatusBar() {
        StatusBar.show();
        Mobile.statusBarEl.style.display = "block";
    },

};