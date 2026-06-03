// Generated from ios/Runner/GoogleService-Info.plist via FlutterFire.
// Re-run `flutterfire configure` if you rotate Firebase credentials.
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
    apiKey: 'AIzaSyCx1F_2p7YzjBXSLOf18zonmzwvAH4ukZA',
    appId: '1:1072783610602:ios:cd76e261f6699e51be3d93',
    messagingSenderId: '1072783610602',
    projectId: 'sahel-agriconnect',
    storageBucket: 'sahel-agriconnect.firebasestorage.app',
    iosBundleId: 'com.sahelagriconnect.app',
  );

  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyCx1F_2p7YzjBXSLOf18zonmzwvAH4ukZA',
    appId: '1:1072783610602:ios:cd76e261f6699e51be3d93',
    messagingSenderId: '1072783610602',
    projectId: 'sahel-agriconnect',
    storageBucket: 'sahel-agriconnect.firebasestorage.app',
    iosBundleId: 'com.sahelagriconnect.app',
  );
}
