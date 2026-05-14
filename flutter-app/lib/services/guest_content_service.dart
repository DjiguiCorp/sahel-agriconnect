import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'api_service.dart';

// ════════════════════════════════════════════════════════════════════
//                        Public data models
// ════════════════════════════════════════════════════════════════════
//
// All `fromJson` factories are defensive: missing keys, null values, or
// wrong types fall back to safe defaults so a single malformed record
// never bubbles up as an exception to a guest preview screen.

/// A crop that public users can browse on the home / discover screens.
class CropData {
  final String id;
  final String name;
  final String season;
  final double currentPrice;
  final String currency;
  final bool trending;

  const CropData({
    required this.id,
    required this.name,
    required this.season,
    required this.currentPrice,
    required this.currency,
    required this.trending,
  });

  factory CropData.fromJson(Map<String, dynamic> j) => CropData(
        id: _str(j['id'] ?? j['_id']),
        name: _str(j['name'] ?? j['crop']),
        season: _str(j['season']),
        currentPrice: _double(j['currentPrice'] ?? j['price']),
        currency: _str(j['currency'], fallback: 'XOF'),
        trending: j['trending'] == true || j['trend'] == 'up',
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'season': season,
        'currentPrice': currentPrice,
        'currency': currency,
        'trending': trending,
      };
}

/// A single market-price datapoint (snapshot of crop pricing & trend).
class MarketStat {
  final String crop;
  final double price;
  final String trend;
  final double percentChange;

  const MarketStat({
    required this.crop,
    required this.price,
    required this.trend,
    required this.percentChange,
  });

  factory MarketStat.fromJson(Map<String, dynamic> j) => MarketStat(
        crop: _str(j['crop'] ?? j['name']),
        price: _double(j['price'] ?? j['currentPrice']),
        trend: _str(j['trend'], fallback: 'flat'),
        percentChange: _double(j['percentChange'] ?? j['change']),
      );

  Map<String, dynamic> toJson() => {
        'crop': crop,
        'price': price,
        'trend': trend,
        'percentChange': percentChange,
      };
}

/// A featured cooperative on the public landing.
class Cooperative {
  final String id;
  final String name;
  final int memberCount;
  final String description;

  const Cooperative({
    required this.id,
    required this.name,
    required this.memberCount,
    required this.description,
  });

  factory Cooperative.fromJson(Map<String, dynamic> j) => Cooperative(
        id: _str(j['id'] ?? j['_id']),
        name: _str(j['name'] ?? j['cooperativeName']),
        memberCount: _int(j['memberCount']),
        description: _str(j['description'] ?? j['region']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'memberCount': memberCount,
        'description': description,
      };
}

/// A short user story shown to build trust for prospective signups.
class Testimonial {
  final String id;
  final String author;
  final String role;
  final String message;
  final String location;

  const Testimonial({
    required this.id,
    required this.author,
    required this.role,
    required this.message,
    required this.location,
  });

  factory Testimonial.fromJson(Map<String, dynamic> j) => Testimonial(
        id: _str(j['id'] ?? j['_id']),
        author: _str(j['author'] ?? j['name']),
        role: _str(j['role']),
        message: _str(j['message'] ?? j['quote']),
        location: _str(j['location'] ?? j['country']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'author': author,
        'role': role,
        'message': message,
        'location': location,
      };
}

/// An AfriYield (or farmer) opportunity card. The same shape works for
/// both audiences — the audience filter is applied server-side.
class Opportunity {
  final String id;
  final String title;
  final String description;
  final double returnRate;
  final double minInvestment;

  const Opportunity({
    required this.id,
    required this.title,
    required this.description,
    required this.returnRate,
    required this.minInvestment,
  });

  factory Opportunity.fromJson(Map<String, dynamic> j) => Opportunity(
        id: _str(j['id'] ?? j['_id']),
        title: _str(j['title'] ?? j['name']),
        description: _str(j['description'] ?? j['summary']),
        returnRate: _double(j['returnRate'] ?? j['targetYield']),
        minInvestment: _double(j['minInvestment'] ?? j['ticketSize']),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'returnRate': returnRate,
        'minInvestment': minInvestment,
      };
}

// ════════════════════════════════════════════════════════════════════
//                            Service
// ════════════════════════════════════════════════════════════════════

/// Loads public/preview data for unauthenticated ("guest") users.
///
/// Design goals:
/// - **Never throw.** Every public method returns a safe default
///   ([List] of zero items) on failure. Errors are logged, not surfaced.
/// - **Two-layer cache.** Responses are kept in-memory for [cacheTtl]
///   (1 hour) and mirrored to [SharedPreferences] so they survive app
///   restarts and can be served when the network is down.
/// - **Bounded latency.** Each network call is wrapped in a 30-second
///   outer timeout; if the API doesn't answer in time we fall back to
///   any cached value (fresh, stale, or on disk) before giving up.
class GuestContentService {
  // ── Configuration ─────────────────────────────────────────────────

  /// In-memory cache freshness window. Disk cache has no expiry — it's
  /// strictly an offline-survival mechanism that gets refreshed as soon
  /// as any successful network call lands.
  static const Duration cacheTtl = Duration(hours: 1);

  /// Maximum wait per network request. Anything longer falls back to
  /// cached data so guest screens never feel stuck.
  static const Duration networkTimeout = Duration(seconds: 30);

  // ── Cache keys ────────────────────────────────────────────────────

  static const String cacheCrops = 'crops';
  static const String cacheMarketStats = 'stats';
  static const String cacheCooperatives = 'cooperatives';
  static const String cacheTestimonials = 'testimonials';
  static const String cacheFarmerOpps = 'farmer_opportunities';
  static const String cacheInvestorOpps = 'investor_opportunities';

  /// SharedPreferences key for the cached payload.
  static String _prefsKey(String key) => 'guest_cache_$key';

  /// SharedPreferences key for the millisecond timestamp the payload
  /// was written. Useful for diagnostics; we don't expire disk entries.
  static String _prefsTsKey(String key) => 'guest_cache_${key}_ts';

  // ── In-memory cache ───────────────────────────────────────────────

  static final Map<String, _CacheEntry> _memCache =
      <String, _CacheEntry>{};

  // ════════════════════ Public methods ════════════════════════════════

  /// Returns the public crop catalogue. Empty list on any failure.
  static Future<List<CropData>> getPublicCrops() async {
    final raw = await _fetchList(
      cacheKey: cacheCrops,
      path: '/api/public/crops',
      listKeys: const ['crops'],
    );
    return _mapSafely(raw, CropData.fromJson);
  }

  /// Returns market price statistics across major crops. Empty on failure.
  static Future<List<MarketStat>> getMarketStats() async {
    final raw = await _fetchList(
      cacheKey: cacheMarketStats,
      path: '/api/public/market-stats',
      listKeys: const ['stats', 'markets', 'prices'],
    );
    return _mapSafely(raw, MarketStat.fromJson);
  }

  /// Returns featured cooperatives shown on the public landing.
  static Future<List<Cooperative>> getCooperatives() async {
    final raw = await _fetchList(
      cacheKey: cacheCooperatives,
      path: '/api/public/cooperatives',
      listKeys: const ['cooperatives', 'coops'],
    );
    return _mapSafely(raw, Cooperative.fromJson);
  }

  /// Returns short user stories surfaced on the public landing.
  static Future<List<Testimonial>> getTestimonials() async {
    final raw = await _fetchList(
      cacheKey: cacheTestimonials,
      path: '/api/public/testimonials',
      listKeys: const ['testimonials', 'stories'],
    );
    return _mapSafely(raw, Testimonial.fromJson);
  }

  /// Returns opportunities targeted at the farmer audience (programs,
  /// grants, projects). Caches under [cacheFarmerOpps].
  static Future<List<Opportunity>> getFarmerOpportunities() async {
    final raw = await _fetchList(
      cacheKey: cacheFarmerOpps,
      path: '/api/public/opportunities?audience=farmer',
      listKeys: const ['opportunities'],
    );
    return _mapSafely(raw, Opportunity.fromJson);
  }

  /// Returns AfriYield Exchange-style opportunities for the investor
  /// audience. Caches under [cacheInvestorOpps] separately so the two
  /// audiences don't fight for the same slot.
  static Future<List<Opportunity>> getInvestorOpportunities() async {
    final raw = await _fetchList(
      cacheKey: cacheInvestorOpps,
      path: '/api/public/opportunities?audience=investor',
      listKeys: const ['opportunities'],
    );
    return _mapSafely(raw, Opportunity.fromJson);
  }

  /// Returns the raw cached payload (in-memory first, then disk) for
  /// the given [cacheKey] without making a network request. Returns
  /// `null` if nothing is cached anywhere. The list is JSON-shaped
  /// (a `List<dynamic>` of `Map<String, dynamic>` records).
  ///
  /// Useful for letting UI render instantly from cache before the
  /// matching `getX()` call has resolved over the network.
  static Future<List<dynamic>?> getCachedData(String cacheKey) async {
    final mem = _memCache[cacheKey];
    if (mem != null) return List<dynamic>.from(mem.data);
    return _readFromDisk(cacheKey);
  }

  /// Wipes both the in-memory and on-disk cache. Call this from your
  /// logout flow (e.g. `AuthState.logout()`) so a different user
  /// signing in on the same device doesn't see the previous user's
  /// leftover preview data.
  static Future<void> clearCache() async {
    _memCache.clear();
    try {
      final prefs = await SharedPreferences.getInstance();
      for (final key in _allCacheKeys) {
        await prefs.remove(_prefsKey(key));
        await prefs.remove(_prefsTsKey(key));
      }
      _log('cache cleared');
    } catch (e) {
      _log('clearCache failed: $e');
    }
  }

  // ════════════════════ Internals ════════════════════════════════════

  static const List<String> _allCacheKeys = [
    cacheCrops,
    cacheMarketStats,
    cacheCooperatives,
    cacheTestimonials,
    cacheFarmerOpps,
    cacheInvestorOpps,
  ];

  /// The single network+cache code path shared by every public getter.
  ///
  /// Order of operations:
  /// 1. Fresh in-memory cache (< [cacheTtl] old) → return immediately.
  /// 2. Network fetch, capped at [networkTimeout].
  ///    a. Success → refresh memory + disk caches, return parsed list.
  ///    b. Failure → fall through to the offline path.
  /// 3. Stale in-memory cache → return (better than empty).
  /// 4. Disk cache → return (also re-hydrates memory).
  /// 5. Empty list — never throws.
  static Future<List<dynamic>> _fetchList({
    required String cacheKey,
    required String path,
    List<String> listKeys = const [],
  }) async {
    // 1. Fresh in-memory cache.
    final mem = _memCache[cacheKey];
    if (mem != null && !mem.isExpired) {
      _log('cache HIT (memory, fresh): $cacheKey');
      return List<dynamic>.from(mem.data);
    }

    // 2. Network fetch with our own 30s ceiling. ApiService uses 45s
    //    internally for the cold-start window, so we lower the bar to
    //    keep guest screens snappy.
    try {
      final res = await ApiService.get(path).timeout(
        networkTimeout,
        onTimeout: () => <String, dynamic>{
          'success': false,
          'error': 'Timeout after ${networkTimeout.inSeconds}s',
        },
      );

      if (res['success'] != false) {
        final list = _extractList(res, listKeys);
        _memCache[cacheKey] = _CacheEntry(
          data: list,
          cachedAt: DateTime.now(),
        );
        // Write-behind to disk. Fire-and-forget — if this fails we
        // still have a fresh memory cache for this session.
        _writeToDisk(cacheKey, list).catchError(
          (Object e) => _log('disk write failed for $cacheKey: $e'),
        );
        _log('network OK: $cacheKey (${list.length} items)');
        return list;
      }
      _log('network FAIL: $cacheKey — ${res['error']}');
    } catch (e) {
      _log('network EXCEPTION: $cacheKey — $e');
    }

    // 3. Stale in-memory cache (better than nothing).
    if (mem != null) {
      _log('cache HIT (memory, stale): $cacheKey');
      return List<dynamic>.from(mem.data);
    }

    // 4. Disk cache.
    final disk = await _readFromDisk(cacheKey);
    if (disk != null) {
      _memCache[cacheKey] = _CacheEntry(
        data: disk,
        // Mark as already-expired so the next call still tries the
        // network and only falls back here on continued failure.
        cachedAt: DateTime.now().subtract(cacheTtl + const Duration(minutes: 1)),
      );
      _log('cache HIT (disk): $cacheKey (${disk.length} items)');
      return disk;
    }

    // 5. Nothing anywhere — safe default.
    _log('cache MISS everywhere: $cacheKey');
    return const <dynamic>[];
  }

  /// Pulls a list out of a Map response, trying the explicit hints
  /// first and then common conventions (`data`, `items`, `results`).
  /// Returns an empty list if nothing list-shaped is found.
  static List<dynamic> _extractList(
    Map<String, dynamic> res,
    List<String> hints,
  ) {
    for (final k in [...hints, 'data', 'items', 'results']) {
      final v = res[k];
      if (v is List) return List<dynamic>.from(v);
    }
    return const <dynamic>[];
  }

  /// Maps a raw JSON list to a typed model list, dropping any rows
  /// that fail to parse instead of taking down the whole response.
  static List<T> _mapSafely<T>(
    List<dynamic> raw,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final out = <T>[];
    for (final item in raw) {
      if (item is! Map) continue;
      try {
        out.add(fromJson(Map<String, dynamic>.from(item)));
      } catch (e) {
        _log('row parse failed: $e');
      }
    }
    return List<T>.unmodifiable(out);
  }

  // ── Disk I/O ──────────────────────────────────────────────────────

  static Future<void> _writeToDisk(String cacheKey, List<dynamic> list) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_prefsKey(cacheKey), jsonEncode(list));
      await prefs.setInt(
        _prefsTsKey(cacheKey),
        DateTime.now().millisecondsSinceEpoch,
      );
    } catch (e) {
      _log('disk write threw for $cacheKey: $e');
    }
  }

  static Future<List<dynamic>?> _readFromDisk(String cacheKey) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_prefsKey(cacheKey));
      if (raw == null || raw.isEmpty) return null;
      final decoded = jsonDecode(raw);
      if (decoded is List) return List<dynamic>.from(decoded);
      return null;
    } catch (e) {
      _log('disk read threw for $cacheKey: $e');
      return null;
    }
  }

  // ── Logging ───────────────────────────────────────────────────────

  /// Debug-mode only. Stripped from release builds by `kDebugMode`.
  static void _log(String msg) {
    if (kDebugMode) debugPrint('[GuestContent] $msg');
  }
}

// ════════════════════════════════════════════════════════════════════
//                          Internal helpers
// ════════════════════════════════════════════════════════════════════

class _CacheEntry {
  final List<dynamic> data;
  final DateTime cachedAt;
  const _CacheEntry({required this.data, required this.cachedAt});

  bool get isExpired =>
      DateTime.now().difference(cachedAt) > GuestContentService.cacheTtl;
}

String _str(dynamic v, {String fallback = ''}) {
  if (v == null) return fallback;
  if (v is String) return v;
  return v.toString();
}

double _double(dynamic v) {
  if (v == null) return 0;
  if (v is double) return v;
  if (v is int) return v.toDouble();
  if (v is String) return double.tryParse(v) ?? 0;
  return 0;
}

int _int(dynamic v) {
  if (v == null) return 0;
  if (v is int) return v;
  if (v is double) return v.toInt();
  if (v is String) return int.tryParse(v) ?? 0;
  return 0;
}
