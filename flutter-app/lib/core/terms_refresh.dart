import 'package:flutter/foundation.dart';

/// Notifies [GoRouter] after the user accepts Terms, Privacy, and User Agreement.
class TermsRefresh extends ChangeNotifier {
  TermsRefresh(this._accepted);

  bool _accepted;

  bool get accepted => _accepted;

  void onAccepted() {
    _accepted = true;
    notifyListeners();
  }
}
