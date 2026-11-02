import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    // With UIScene, the Flutter engine/view controller are created in SceneDelegate.
    // Registering plugins here (before the scene connects) crashes plugins like camera
    // that expect a live FlutterPluginRegistry/engine. Registration happens in SceneDelegate.
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
