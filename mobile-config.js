// This section sets up some basic app metadata, the entire section is optional.
App.info({
    id: 'com.chrologony',
    name: 'Chrologony',
    description: 'Best Game of All Time',
    author: 'Jake Carlson',
    email: 'chrologony@carlsonville.com',
    website: 'https://chrologony.com',
    version: '2021.02.20'
});

// Set general Cordova preferences
App.setPreference('BackgroundColor', '0xFF593196');
App.setPreference('StatusBarOverlaysWebView', false);
App.setPreference('StatusBarBackgroundColor', '#000000');
App.setPreference('StatusBarStyle', 'lightcontent');
App.setPreference('HideKeyboardFormAccessoryBar', true);
App.setPreference('Orientation', 'default');
// App.setPreference('Fullscreen', true);

// Set iOS Cordova preferences
App.setPreference('StatusBarOverlaysWebView', true, 'ios');
App.setPreference('Orientation', 'all', 'ios');

// Set Android Cordova preferences
App.setPreference('android-targetSdkVersion', '29', 'android');
App.setPreference('AndroidLaunchMode', 'singleInstance', 'android');

// Configure Facebook login
App.configurePlugin('com.phonegap.plugins.facebookconnect', {
    APP_ID: '237901244101201',
    API_KEY: '5c552215b03607be636f602c31a4c94b'
});

// Configure Google+ login
App.configurePlugin('cordova-plugin-googleplus', {
    REVERSED_CLIENT_ID: 'com.googleusercontent.apps.1005996420969-in8dhq9s7ock8gq0tgc4vces6jiqngbb',
    WEB_APPLICATION_CLIENT_ID: '1005996420969-in8dhq9s7ock8gq0tgc4vces6jiqngbb.apps.googleusercontent.com'
});

// Add custom tags for a particular PhoneGap/Cordova plugin to the end of the
// generated config.xml. 'Universal Links' is shown as an example here.
App.appendToConfig(`

    <universal-links>
        <host name="localhost:3000" scheme="http" event="ulink" />
        <host name="app.chrologony.com" scheme="https" event="ulink" />
        <ios-team-id value="UBJNW65P8U" />
    </universal-links>
    
    <access origin="*" />
    <allow-navigation href="*://www.google.com/recaptcha/*" />
    <allow-navigation href="https://www.google.com/maps/*" />
    <allow-navigation href="https://c.sharethis.mgr.consensu.org/*" />
    <allow-navigation href="about:*" />
    
    <platform name="ios">
        <resource-file target="GoogleService-Info.plist"/>
    </platform>
  
`);

App.icons({

    // iOS
    app_store: 'mobile/icon-1024x1024.png',
    iphone_2x: 'mobile/icon-120x120.png',
    iphone_3x: 'mobile/icon-180x180.png',
    ipad_2x: 'mobile/icon-152x152.png',
    ipad_pro: 'mobile/icon-167x167.png',
    ios_settings_2x: 'mobile/icon-58x58.png',
    ios_settings_3x: 'mobile/icon-87x87.png',
    ios_spotlight_2x: 'mobile/icon-80x80.png',
    ios_spotlight_3x: 'mobile/icon-120x120.png',
    ios_notification_2x: 'mobile/icon-40x40.png',
    ios_notification_3x: 'mobile/icon-60x60.png',
    ipad: 'mobile/icon-76x76.png',
    ios_settings: 'mobile/icon-29x29.png',
    ios_spotlight: 'mobile/icon-40x40.png',
    ios_notification: 'mobile/icon-20x20.png',
    iphone_legacy: 'mobile/icon-57x57.png',
    iphone_legacy_2x: 'mobile/icon-114x114.png',
    ipad_spotlight_legacy: 'mobile/icon-50x50.png',
    ipad_spotlight_legacy_2x: 'mobile/icon-100x100.png',
    ipad_app_legacy: 'mobile/icon-72x72.png',
    ipad_app_legacy_2x: 'mobile/icon-144x144.png',

    // Android
    android_mdpi: 'mobile/icon-48x48.png',
    android_hdpi: 'mobile/icon-72x72.png',
    android_xhdpi: 'mobile/icon-96x96.png',
    android_xxhdpi: 'mobile/icon-144x144.png',
    android_xxxhdpi: 'mobile/icon-192x192.png',

});

App.launchScreens({

    // iOS
    iphone: 'mobile/splash-320x480.png',
    iphone5: 'mobile/splash-640x1136.png',
    iphone_2x: 'mobile/splash-640x960.png',
    iphone6: 'mobile/splash-750x1334.png',
    ipad_portrait: 'mobile/splash-768x1024.png',
    ipad_landscape: 'mobile/splash-1024x768.png',
    ipad_portrait_2x: 'mobile/splash-1536x2048.png',
    ipad_landscape_2x: 'mobile/splash-2048x1536.png',
    iphone6p_portrait: 'mobile/splash-1242x2208.png',
    iphone6p_landscape: 'mobile/splash-2208x1242.png',
    iphoneX_portrait: 'mobile/splash-1125x2436.png',
    iphoneX_landscape: 'mobile/splash-2436x1125.png',

    // Android
    android_mdpi_portrait: 'mobile/splash-320x480.png',
    android_mdpi_landscape: 'mobile/splash-480x320.png',
    android_hdpi_portrait: 'mobile/splash-480x800.png',
    android_hdpi_landscape: 'mobile/splash-800x480.png',
    android_xhdpi_portrait: 'mobile/splash-720x1280.png',
    android_xhdpi_landscape: 'mobile/splash-1280x720.png',
    android_xxhdpi_portrait: 'mobile/splash-960x1600.png',
    android_xxhdpi_landscape: 'mobile/splash-1600x960.png',
    android_xxxhdpi_portrait: 'mobile/splash-1280x1920.png',
    android_xxxhdpi_landscape: 'mobile/splash-1920x1280.png',

});
