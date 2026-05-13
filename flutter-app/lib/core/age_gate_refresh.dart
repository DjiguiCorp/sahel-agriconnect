import 'package:flutter/foundation.dart';

/// Notifies [GoRouter] after the user passes the age gate (see [AgeGateScreen]).
class AgeGateRefresh extends ChangeNotifier {
  AgeGateRefresh(this._accepted);

  bool _accepted;

  bool get accepted => _accepted;

  void onAcceptedFromPrefs() {
    _accepted = true;
    notifyListeners();
  }
}
