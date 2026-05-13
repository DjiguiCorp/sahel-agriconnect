import 'package:dio/dio.dart';

/// All REST calls go through Dio (no `http` package): 15s timeouts, interceptors
/// for slow / dropped rural links, and JSON maps with `success: false` on errors.
class ApiService {
  /// Production default. Override at compile time, e.g.:
  /// `flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3001`
  /// Android emulator → host machine: `http://10.0.2.2:3001`
  static const String _defaultBaseUrl = 'https://sahelagriconnect.onrender.com';

  static String get baseUrl {
    const fromEnv = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    final t = fromEnv.trim();
    if (t.isEmpty) return _defaultBaseUrl;
    return t.replaceAll(RegExp(r'/$'), '');
  }

  static const _timeout = Duration(seconds: 15);

  static final _dio = Dio(
    BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: _timeout,
      receiveTimeout: _timeout,
      sendTimeout: _timeout,
      headers: const {'Content-Type': 'application/json'},
    ),
  )..interceptors.add(
      InterceptorsWrapper(
        onError: (DioException e, handler) {
          if (e.type == DioExceptionType.connectionTimeout ||
              e.type == DioExceptionType.receiveTimeout ||
              e.type == DioExceptionType.sendTimeout) {
            return handler.resolve(
              Response(
                requestOptions: e.requestOptions,
                data: {
                  'success': false,
                  'error': 'Connection timeout — check your internet',
                },
                statusCode: 408,
              ),
            );
          }
          if (e.type == DioExceptionType.connectionError) {
            return handler.resolve(
              Response(
                requestOptions: e.requestOptions,
                data: {
                  'success': false,
                  'error': 'No internet connection',
                },
                statusCode: 503,
              ),
            );
          }
          handler.next(e);
        },
      ),
    );

  static Map<String, dynamic> _decode(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {'data': data};
  }

  static Map<String, dynamic> _failureFromDio(DioException e) {
    final raw = e.response?.data;
    if (raw != null) {
      final m = Map<String, dynamic>.from(_decode(raw));
      m.putIfAbsent('success', () => false);
      return m;
    }
    return {
      'success': false,
      'error': e.message ?? 'Request failed',
    };
  }

  static Future<Map<String, dynamic>> get(String path, {String? token}) async {
    try {
      final res = await _dio.get(
        path,
        options: Options(
          headers: {if (token != null) 'Authorization': 'Bearer $token'},
        ),
      );
      return _decode(res.data);
    } on DioException catch (e) {
      return _failureFromDio(e);
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    String? token,
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
      return _failureFromDio(e);
    } catch (e) {
      return {'success': false, 'error': e.toString()};
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

  // ── Cooperatives ──────────────────────────────────────────
  static Future<Map<String, dynamic>> coopLogin(
    String email,
    String password,
  ) =>
      post('/api/cooperatives/login', {'email': email, 'password': password});

  static Future<Map<String, dynamic>> getCoopPortal(String token) =>
      get('/api/cooperatives/my-portal', token: token);

  static Future<Map<String, dynamic>> getCoopPublicStats() =>
      get('/api/cooperatives/public-stats');

  // ── Government ────────────────────────────────────────────
  static Future<Map<String, dynamic>> govLogin(
    String email,
    String password,
  ) =>
      post('/api/government/login', {'email': email, 'password': password});

  static Future<Map<String, dynamic>> getGovDashboard(String token) =>
      get('/api/government/dashboard', token: token);

  // ── Processors ────────────────────────────────────────────
  static Future<Map<String, dynamic>> processorSession(String email) =>
      post('/api/processors/session', {'email': email});

  static Future<Map<String, dynamic>> getProcessorPortal(String token) =>
      get('/api/processors/my-portal', token: token);

  // ── Marketplace ───────────────────────────────────────────
  static Future<Map<String, dynamic>> getMarketplacePrices() =>
      get('/api/marketplace/prices');
}
