class FavoriteOperation {
  final String propertyId;
  final FavoriteActionType action;
  final DateTime timestamp;
  final String? source;

  FavoriteOperation({
    required this.propertyId,
    required this.action,
    required this.timestamp,
    this.source = 'mobile',
  });

  Map<String, dynamic> toJson() => {
    'propertyId': propertyId,
    'action': action.toString().split('.').last,
    'timestamp': timestamp.toIso8601String(),
    'source': source,
  };

  factory FavoriteOperation.fromJson(Map<String, dynamic> json) {
    return FavoriteOperation(
      propertyId: json['propertyId'] as String,
      action: FavoriteActionType.values.firstWhere(
        (e) => e.toString().split('.').last == json['action'],
      ),
      timestamp: DateTime.parse(json['timestamp'] as String),
      source: json['source'] as String?,
    );
  }
}

enum FavoriteActionType { add, remove }

enum FavoriteSyncStatus { synced, pending, failed }

class FavoriteState {
  final Set<String> favoriteIds;
  final Map<String, FavoriteSyncStatus> statusMap;
  final List<FavoriteOperation> pendingQueue;
  final bool isSyncing;
  final DateTime? lastSyncTime;
  final String? error;

  FavoriteState({
    Set<String>? favoriteIds,
    Map<String, FavoriteSyncStatus>? statusMap,
    List<FavoriteOperation>? pendingQueue,
    this.isSyncing = false,
    this.lastSyncTime,
    this.error,
  }) : favoriteIds = favoriteIds ?? {},
       statusMap = statusMap ?? {},
       pendingQueue = pendingQueue ?? [];

  FavoriteState copyWith({
    Set<String>? favoriteIds,
    Map<String, FavoriteSyncStatus>? statusMap,
    List<FavoriteOperation>? pendingQueue,
    bool? isSyncing,
    DateTime? lastSyncTime,
    String? error,
  }) {
    return FavoriteState(
      favoriteIds: favoriteIds ?? this.favoriteIds,
      statusMap: statusMap ?? this.statusMap,
      pendingQueue: pendingQueue ?? this.pendingQueue,
      isSyncing: isSyncing ?? this.isSyncing,
      lastSyncTime: lastSyncTime ?? this.lastSyncTime,
      error: error,
    );
  }

  bool isFavorite(String propertyId) => favoriteIds.contains(propertyId);

  FavoriteSyncStatus getStatus(String propertyId) =>
      statusMap[propertyId] ?? FavoriteSyncStatus.synced;

  bool get hasPendingOperations => pendingQueue.isNotEmpty;
}
