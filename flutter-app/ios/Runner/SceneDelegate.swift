import Flutter
import UIKit

/// UIScene lifecycle required by iOS 27 / Xcode 27 SDK.
/// Without this, UIKit traps in UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?
  private static var pluginsRegistered = false

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else { return }

    let window = UIWindow(windowScene: windowScene)
    let storyboard = UIStoryboard(name: "Main", bundle: nil)
    let rootVC = storyboard.instantiateInitialViewController()
    window.rootViewController = rootVC
    window.makeKeyAndVisible()
    self.window = window

    if let appDelegate = UIApplication.shared.delegate as? FlutterAppDelegate {
      appDelegate.window = window
    }

    // Register plugins only after FlutterViewController (and its engine) exists.
    if !Self.pluginsRegistered,
       let flutterVC = rootVC as? FlutterViewController {
      GeneratedPluginRegistrant.register(with: flutterVC)
      Self.pluginsRegistered = true
    }
  }
}
