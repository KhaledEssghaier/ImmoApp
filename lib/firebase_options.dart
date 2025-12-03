// File generated manually for Firebase configuration
import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

/// Default [FirebaseOptions] for use with your Firebase apps.
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
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for macos - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.windows:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for windows - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      case TargetPlatform.linux:
        throw UnsupportedError(
          'DefaultFirebaseOptions have not been configured for linux - '
          'you can reconfigure this by running the FlutterFire CLI again.',
        );
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyBOdizqm0ugSjVTQ2pWF7qWHhMjnRVJPvg',
    appId: '1:690927469353:web:a6c7c5fabdd9b9e610ed38',
    messagingSenderId: '690927469353',
    projectId: 'applicationimmobiliers',
    authDomain: 'applicationimmobiliers.firebaseapp.com',
    storageBucket: 'applicationimmobiliers.firebasestorage.app',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAe-Hig7gfMhNySZJkiik8Ax0KAVZumZE4',
    appId: '1:690927469353:android:0383d1845e8a90b910ed38',
    messagingSenderId: '690927469353',
    projectId: 'applicationimmobiliers',
    storageBucket: 'applicationimmobiliers.firebasestorage.app',
  );

  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyBgCDpBLi-CvxAcNwF_nR3MjM3WzopnwSI',
    appId: '1:690927469353:ios:992df5ffa9a5923a10ed38',
    messagingSenderId: '690927469353',
    projectId: 'applicationimmobiliers',
    iosBundleId: 'com.example.appimmo',
    storageBucket: 'applicationimmobiliers.firebasestorage.app',
  );
}
