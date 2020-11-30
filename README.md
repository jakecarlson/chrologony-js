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
