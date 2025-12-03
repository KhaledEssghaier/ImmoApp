import 'package:hive_flutter/hive_flutter.dart';
import '../../models/favorite_state.dart';

class FavoritesLocalDataSource {
  static const String _favoritesBoxName = 'favorites';
  static const String _queueBoxName = 'favorites_queue';
  static const String _favoritesKey = 'favorite_ids';

  Box<dynamic>? _favoritesBox;
  Box<dynamic>? _queueBox;

  Future<void> init() async {
    // Hive.initFlutter() should be called once in main.dart, not here
    _favoritesBox = await Hive.openBox(_favoritesBoxName);
    _queueBox = await Hive.openBox(_queueBoxName);
  }

  /// Get cached favorite IDs
  Set<String> getCachedFavoriteIds() {
    if (_favoritesBox == null) return {};
    final List<dynamic>? ids = _favoritesBox!.get(_favoritesKey);
    if (ids == null) return {};
    return ids.cast<String>().toSet();
  }

  /// Cache favorite IDs
  Future<void> cacheFavoriteIds(Set<String> ids) async {
    if (_favoritesBox == null) return;
    await _favoritesBox!.put(_favoritesKey, ids.toList());
  }

  /// Add to offline queue
  Future<void> enqueueOperation(FavoriteOperation operation) async {
    if (_queueBox == null) return;
    final queue = getQueue();
    queue.add(operation);
    await _queueBox!.put('queue', queue.map((op) => op.toJson()).toList());
  }

  /// Get offline queue
  List<FavoriteOperation> getQueue() {
    if (_queueBox == null) return [];
    final List<dynamic>? queueData = _queueBox!.get('queue');
    if (queueData == null) return [];

    return queueData
        .map(
          (item) => FavoriteOperation.fromJson(Map<String, dynamic>.from(item)),
        )
        .toList();
  }

  /// Clear offline queue
  Future<void> clearQueue() async {
    if (_queueBox == null) return;
    await _queueBox!.delete('queue');
  }

  /// Remove specific operation from queue
  Future<void> removeFromQueue(FavoriteOperation operation) async {
    if (_queueBox == null) return;
    final queue = getQueue();
    queue.removeWhere(
      (op) =>
          op.propertyId == operation.propertyId &&
          op.action == operation.action &&
          op.timestamp == operation.timestamp,
    );
    await _queueBox!.put('queue', queue.map((op) => op.toJson()).toList());
  }

  /// Clear all cached data
  Future<void> clearAll() async {
    if (_favoritesBox != null) await _favoritesBox!.clear();
    if (_queueBox != null) await _queueBox!.clear();
  }
}
