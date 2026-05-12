// Run `dart pub global activate flutterfire_cli` then `flutterfire configure`
// to replace placeholders with your Firebase project values.
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) {
      return web;
    }
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not configured for this platform. '
          'Run flutterfire configure or set up firebase_options.dart.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: '1:000000000000:web:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'sahel-agriconnect',
    authDomain: 'sahel-agriconnect.firebaseapp.com',
    storageBucket: 'sahel-agriconnect.appspot.com',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: '1:000000000000:android:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'sahel-agriconnect',
    storageBucket: 'sahel-agriconnect.appspot.com',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: '1:000000000000:ios:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'sahel-agriconnect',
    storageBucket: 'sahel-agriconnect.appspot.com',
    iosBundleId: 'com.sahel.sahelAgriconnect',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'REPLACE_ME',
    appId: '1:000000000000:ios:0000000000000000000000',
    messagingSenderId: '000000000000',
    projectId: 'sahel-agriconnect',
    storageBucket: 'sahel-agriconnect.appspot.com',
    iosBundleId: 'com.sahel.sahelAgriconnect',
  );
}
