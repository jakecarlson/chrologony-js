# chrologony-js

## Manual Build Steps

1. Change `plugins/cordova-universal-links-plugin/hooks/lib/android/manifestWriter.js` from
```
var pathToManifest = path.join(cordovaContext.opts.projectRoot, 'platforms', 'android', 'cordovaLib', 'AndroidManifest.xml');
```
to
```
var pathToManifest = path.join( cordovaContext.opts.projectRoot, 'platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
```          

2. iOS: submit using Xcode

3. Android: sign the app and upload
```
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 app-release-unsigned.apk chrologony
$ANDROID_SDK_ROOT/build-tools/30.0.2/zipalign 4 app-release-unsigned.apk chrologony.apk
```
