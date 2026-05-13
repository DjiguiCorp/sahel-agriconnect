import 'dart:convert';

import 'package:http/http.dart' as http;

class ApiService {
  static const baseUrl = 'https://sahel-agriconnect.onrender.com';

  static Map<String, dynamic> _decode(dynamic decoded) {
    if (decoded is Map<String, dynamic>) return decoded;
    if (decoded is Map) return Map<String, dynamic>.from(decoded);
    return {'data': decoded};
  }

  static Future<Map<String, dynamic>> get(String path, {String? token}) async {
    final response = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    return _decode(json.decode(response.body));
  }

  static Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body, {
    String? token,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: json.encode(body),
    );
    return _decode(json.decode(response.body));
  }

  // Farmers
  static Future<Map<String, dynamic>> getPublicStats() =>
      get('/api/farmers/public-stats');

  static Future<Map<String, dynamic>> farmerLookup(String email) =>
      get('/api/farmers?email=${Uri.encodeComponent(email)}');

  static Future<Map<String, dynamic>> farmerSession(String email) =>
      post('/api/farmers/session', {'email': email});

  // Investors
  static Future<Map<String, dynamic>> investorLogin(String email,
          [String password = '']) =>
      post('/api/investors/login', {
        'email': email,
        if (password.isNotEmpty) 'password': password,
      });

  static Future<Map<String, dynamic>> getOpportunities({String? token}) =>
      get('/api/opportunities', token: token);

  // Cooperatives
  static Future<Map<String, dynamic>> coopLogin(
          String email, String password) =>
      post('/api/cooperatives/login', {'email': email, 'password': password});

  static Future<Map<String, dynamic>> getCoopPortal(String token) =>
      get('/api/cooperatives/my-portal', token: token);

  static Future<Map<String, dynamic>> getCoopPublicStats() =>
      get('/api/cooperatives/public-stats');

  // Government
  static Future<Map<String, dynamic>> govLogin(
          String email, String password) =>
      post('/api/government/login', {'email': email, 'password': password});

  static Future<Map<String, dynamic>> getGovDashboard(String token) =>
      get('/api/government/dashboard', token: token);

  static Future<Map<String, dynamic>> processorSession(String email) =>
      post('/api/processors/session', {'email': email});
}
