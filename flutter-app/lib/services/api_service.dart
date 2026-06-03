import 'package:dio/dio.dart';

/// All REST calls go through Dio (no `http` package).
///
/// - 45s timeout so Render's free-tier cold starts have room to wake up.
/// - One automatic retry on connection timeout / connection error, with a
///   3-second backoff (covers the typical Render wakeup window).
/// - Failures are funneled through [_friendlyError] so callers always get
///   `{success: false, error: '<human readable>'}` instead of raw stack
///   traces like `Exception: DioException [connect timeout]...`.
class ApiService {
  /// Production default. Override at compile time, e.g.:
  /// `flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3001`
  /// Android emulator → host machine: `http://10.0.2.2:3001`
  static const String _defaultBaseUrl = 'https://sahel-agriconnect.onrender.com';

  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    final t = fromEnv.trim();
    if (t.isEmpty) return _defaultBaseUrl;
    return t.replaceAll(RegExp(r'/$'), '');
  }

  static const _timeout = Duration(seconds: 45);

  static final _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: _timeout,
      receiveTimeout: _timeout,
      sendTimeout: _timeout,
      headers: const {'Content-Type': 'application/json'},
    ),
  );

  static Map<String, dynamic> _decode(dynamic data) {
    if (data == null) return <String, dynamic>{};
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'data': data};
  }

  static Future<Map<String, dynamic>> get(
    String path, {
    String? token,
    int retries = 1,
  }) async {
    try {
      final res = await _dio.get(
        path,
        options: Options(
          headers: {if (token != null) 'Authorization': 'Bearer $token'},
        ),
      );
      return _decode(res.data);
    } on DioException catch (e) {
      if (retries > 0 &&
          (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.connectionError)) {
        await Future.delayed(const Duration(seconds: 3));
        return get(path, token: token, retries: retries - 1);
      }
      return _decode(e.response?.data)
        ..putIfAbsent('success', () => false)
        ..putIfAbsent('error', () => _friendlyError(e));
    } catch (_) {
      return {'success': false, 'error': _friendlyError(null)};
    }
  }

  static Future<Map<String, dynamic>> delete(
    String path, {
    String? token,
    int retries = 1,
  }) async {
    try {
      final res = await _dio.delete(
        path,
        options: Options(
          headers: {if (token != null) 'Authorization': 'Bearer $token'},
        ),
      );
      return _decode(res.data);
    } on DioException catch (e) {
      if (retries > 0 &&
          (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.connectionError)) {
        await Future.delayed(const Duration(seconds: 3));
        return delete(path, token: token, retries: retries - 1);
      }
      return _decode(e.response?.data)
        ..putIfAbsent('success', () => false)
        ..putIfAbsent('error', () => _friendlyError(e));
    } catch (_) {
      return {'success': false, 'error': _friendlyError(null)};
    }
  }

  static Future<Map<String, dynamic>> patch(
    String path,
    Map<String, dynamic> body, {
    String? token,
    int retries = 1,
  }) async {
    try {
      final res = await _dio.patch(
        path,
        data: body,
        options: Options(
          headers: {if (token != null) 'Authorization': 'Bearer $token'},
        ),
      );
      return _decode(res.data);
    } on DioException catch (e) {
      if (retries > 0 &&
          (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.connectionError)) {
        await Future.delayed(const Duration(seconds: 3));
        return patch(path, body, token: token, retries: retries - 1);
      }
      return _decode(e.response?.data)
        ..putIfAbsent('success', () => false)
        ..putIfAbsent('error', () => _friendlyError(e));
    } catch (_) {
      return {'success': false, 'error': _friendlyError(null)};
    }
  }

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    String? token,
    int retries = 1,
  }) async {
    try {
      final res = await _dio.post(
        path,
        data: body,
        options: Options(
          headers: {if (token != null) 'Authorization': 'Bearer $token'},
        ),
      );
      return _decode(res.data);
    } on DioException catch (e) {
      if (retries > 0 &&
          (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.connectionError)) {
        await Future.delayed(const Duration(seconds: 3));
        return post(path, body, token: token, retries: retries - 1);
      }
      return _decode(e.response?.data)
        ..putIfAbsent('success', () => false)
        ..putIfAbsent('error', () => _friendlyError(e));
    } catch (_) {
      return {'success': false, 'error': _friendlyError(null)};
    }
  }

  /// Translates a Dio exception (or null for unknown failures) into a
  /// short, user-facing message. Callers display this directly without
  /// any `Exception:` or `DioException` prefixes.
  static String _friendlyError(DioException? e) {
    if (e == null) return 'An unexpected error occurred. Please try again.';
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
      case DioExceptionType.sendTimeout:
        return 'Server is starting up — please wait a moment and try again.';
      case DioExceptionType.connectionError:
        return 'No internet connection. Please check your network.';
      default:
        final status = e.response?.statusCode;
        if (status == 404) return 'Account not found. Please check your details.';
        if (status == 401) return 'Invalid credentials. Please try again.';
        if (status == 400) return 'Invalid request. Please check your input.';
        if (status != null && status >= 500) {
          return 'Server error. Please try again in a moment.';
        }
        return e.message ?? 'Request failed. Please try again.';
    }
  }

  // ── Farmers ──────────────────────────────────────────────
  static Future<Map<String, dynamic>> getPublicStats() =>
      get('/api/farmers/public-stats');

  static Future<Map<String, dynamic>> farmerLookup(String email) =>
      get('/api/farmers?email=${Uri.encodeComponent(email)}');

  static Future<Map<String, dynamic>> farmerSession(String email) =>
      post('/api/farmers/session', {'email': email});

  // ── Investors ─────────────────────────────────────────────
  static Future<Map<String, dynamic>> investorLogin(
    String email, [
    String password = '',
  ]) =>
      post('/api/investors/login', {
        'email': email,
        if (password.isNotEmpty) 'password': password,
      });

  static Future<Map<String, dynamic>> getOpportunities({String? token}) =>
      get('/api/opportunities', token: token);

  static Future<Map<String, dynamic>> getInvestorPortfolio(
    String email,
    String token,
  ) =>
      get(
        '/api/investments/investor/${Uri.encodeComponent(email)}',
        token: token,
      );

  /// Investor dashboard: portfolio + open opportunities.
  static Future<Map<String, dynamic>> getKycStatus(String email) async {
    if (email.trim().isEmpty) {
      return {'success': false, 'error': 'Email required'};
    }
    return get('/api/kyc/status/${Uri.encodeComponent(email.trim().toLowerCase())}');
  }

  static Future<Map<String, dynamic>> submitInvestorKyc(
    Map<String, dynamic> body,
  ) async {
    return post('/api/kyc/submit', body);
  }

  static Future<Map<String, dynamic>> getInvestorPortal(
    String token, {
    String? email,
  }) async {
    final opportunities = await getOpportunities(token: token);
    if (email == null || email.isEmpty) {
      return {
        ...opportunities,
        'investments': <dynamic>[],
      };
    }
    final portfolio = await getInvestorPortfolio(email, token);
    return {
      'investments': portfolio['investments'] ?? <dynamic>[],
      'opportunities': opportunities['opportunities'] ??
          opportunities['data'] ??
          <dynamic>[],
    };
  }

  // ── Cooperatives ──────────────────────────────────────────
  static Future<Map<String, dynamic>> coopLogin(
    String email,
    String password,
  ) =>
      post('/api/cooperatives/login', {'email': email, 'password': password});

  static Future<Map<String, dynamic>> getCoopPortal(
    String token, {
    String? country,
  }) =>
      get(
        '/api/cooperatives/my-portal${_countryQuery(country)}',
        token: token,
      );

  static Future<Map<String, dynamic>> getCoopPublicStats() =>
      get('/api/cooperatives/public-stats');

  // ── Government ────────────────────────────────────────────
  static Future<Map<String, dynamic>> govLogin(
    String email,
    String password, {
    String? country,
  }) =>
      post('/api/government/login', {
        'email': email,
        'password': password,
        if (country != null && country.isNotEmpty) 'country': country,
      });

  static Future<Map<String, dynamic>> getGovDashboard(
    String token, {
    String? country,
  }) =>
      get(
        '/api/government/dashboard${_countryQuery(country)}',
        token: token,
      );

  // ── NGO / Partners portal ─────────────────────────────────
  static Future<Map<String, dynamic>> ngoLogin(
    String email,
    String password,
  ) =>
      post('/api/ngo/login', {'email': email, 'password': password});

  static Future<Map<String, dynamic>> getNgoPortal(String token) =>
      get('/api/ngo/portal', token: token);

  static Future<Map<String, dynamic>> createNgoProgram(
    String token,
    Map<String, dynamic> body,
  ) =>
      post('/api/ngo/programs', body, token: token);

  static Future<Map<String, dynamic>> createNgoBeneficiary(
    String token,
    Map<String, dynamic> body,
  ) =>
      post('/api/ngo/beneficiaries', body, token: token);

  static Future<Map<String, dynamic>> generateNgoReport(
    String token,
    String reportType, {
    bool isFr = false,
  }) =>
      post(
        '/api/ngo/reports/$reportType/generate?lang=${isFr ? 'fr' : 'en'}',
        <String, dynamic>{},
        token: token,
      );

  static String ngoReportDownloadUrl(String reportId) =>
      '$baseUrl/api/ngo/reports/$reportId/download';

  // ── Processors ────────────────────────────────────────────
  static Future<Map<String, dynamic>> processorSession(String email) =>
      post('/api/processors/session', {'email': email});

  static Future<Map<String, dynamic>> getProcessorPortal(
    String token, {
    String? country,
  }) =>
      get(
        '/api/processors/my-portal${_countryQuery(country)}',
        token: token,
      );

  static String _countryQuery(String? country) {
    if (country == null || country.isEmpty) return '';
    return '?country=${Uri.encodeComponent(country)}';
  }

  // ── Marketplace ───────────────────────────────────────────
  static Future<Map<String, dynamic>> getMarketplacePrices() =>
      get('/api/marketplace/prices');

  // ── Expert requests (Think Tank, disease detection, etc.) ─
  static Future<Map<String, dynamic>> submitExpertRequest({
    required String farmerName,
    required String farmerEmail,
    required String problemDescription,
    String? farmerPhone,
    String? country,
    String? region,
    String? cropType,
    String? diseaseDetected,
    bool cooperativeMember = false,
    String? cooperativeName,
    String? cooperativeId,
    String preferredContactMethod = 'email',
    String urgency = 'within_week',
    String source = 'think_tank',
  }) =>
      post('/api/experts/request', {
        'farmerName': farmerName,
        'farmerEmail': farmerEmail,
        'problemDescription': problemDescription,
        if (farmerPhone != null && farmerPhone.isNotEmpty) 'farmerPhone': farmerPhone,
        if (country != null && country.isNotEmpty) 'country': country,
        if (region != null && region.isNotEmpty) 'region': region,
        if (cropType != null && cropType.isNotEmpty) 'cropType': cropType,
        if (diseaseDetected != null && diseaseDetected.isNotEmpty)
          'diseaseDetected': diseaseDetected,
        'cooperativeMember': cooperativeMember,
        if (cooperativeMember && cooperativeName != null && cooperativeName.isNotEmpty)
          'cooperativeName': cooperativeName,
        if (cooperativeId != null && cooperativeId.isNotEmpty)
          'cooperativeId': cooperativeId,
        'preferredContactMethod': preferredContactMethod,
        'urgency': urgency,
        'source': source,
      });
}
