import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../data/datasources/favorites_remote_datasource.dart';
import '../data/datasources/favorites_local_datasource.dart';
import '../models/favorite_state.dart';
import '../../../core/services/api_client.dart';

/// Provider for remote data source
final favoritesRemoteDataSourceProvider = Provider<FavoritesRemoteDataSource>((
  ref,
) {
  final apiClient = ref.watch(apiClientProvider);
  return FavoritesRemoteDataSource(apiClient);
});

/// Provider for local data source
final favoritesLocalDataSourceProvider = Provider<FavoritesLocalDataSource>((
  ref,
) {
  return FavoritesLocalDataSource();
});

/// Main favorites provider
final favoritesProvider =
    StateNotifierProvider<FavoritesNotifier, FavoriteState>((ref) {
      final remoteDataSource = ref.watch(favoritesRemoteDataSourceProvider);
      final localDataSource = ref.watch(favoritesLocalDataSourceProvider);
      return FavoritesNotifier(remoteDataSource, localDataSource);
    });

class FavoritesNotifier extends StateNotifier<FavoriteState> {
  final FavoritesRemoteDataSource _remoteDataSource;
  final FavoritesLocalDataSource _localDataSource;

  FavoritesNotifier(this._remoteDataSource, this._localDataSource)
    : super(FavoriteState()) {
    _init();
  }

  Future<void> _init() async {
    await _localDataSource.init();

    // Load cached favorites
    final cachedIds = _localDataSource.getCachedFavoriteIds();
    final queue = _localDataSource.getQueue();

    state = state.copyWith(
      favoriteIds: cachedIds,
      pendingQueue: queue,
      statusMap: Map.fromEntries(
        queue.map((op) => MapEntry(op.propertyId, FavoriteSyncStatus.pending)),
      ),
    );

    // Try to sync on init
    await syncWithServer();
  }

  /// Toggle favorite (optimistic update)
  Future<void> toggleFavorite(String propertyId) async {
    final isFavorite = state.isFavorite(propertyId);

    if (isFavorite) {
      await removeFavorite(propertyId);
    } else {
      await addFavorite(propertyId);
    }
  }

  /// Add favorite (optimistic update + offline queue)
  Future<void> addFavorite(String propertyId) async {
    // Optimistic update
    final newIds = Set<String>.from(state.favoriteIds)..add(propertyId);
    final newStatus = Map<String, FavoriteSyncStatus>.from(state.statusMap)
      ..[propertyId] = FavoriteSyncStatus.pending;

    state = state.copyWith(
      favoriteIds: newIds,
      statusMap: newStatus,
      error: null,
    );

    // Save to cache immediately
    await _localDataSource.cacheFavoriteIds(newIds);

    // Try API call
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        await _remoteDataSource.addFavorite(propertyId);

        // Success - mark as synced
        final syncedStatus = Map<String, FavoriteSyncStatus>.from(
          state.statusMap,
        )..[propertyId] = FavoriteSyncStatus.synced;

        state = state.copyWith(statusMap: syncedStatus);
      } catch (e) {
        // Failed - add to queue
        await _enqueueOperation(
          FavoriteOperation(
            propertyId: propertyId,
            action: FavoriteActionType.add,
            timestamp: DateTime.now(),
          ),
        );
      }
    } else {
      // Offline - add to queue
      await _enqueueOperation(
        FavoriteOperation(
          propertyId: propertyId,
          action: FavoriteActionType.add,
          timestamp: DateTime.now(),
        ),
      );
    }
  }

  /// Remove favorite (optimistic update + offline queue)
  Future<void> removeFavorite(String propertyId) async {
    // Optimistic update
    final newIds = Set<String>.from(state.favoriteIds)..remove(propertyId);
    final newStatus = Map<String, FavoriteSyncStatus>.from(state.statusMap)
      ..[propertyId] = FavoriteSyncStatus.pending;

    state = state.copyWith(
      favoriteIds: newIds,
      statusMap: newStatus,
      error: null,
    );

    // Save to cache immediately
    await _localDataSource.cacheFavoriteIds(newIds);

    // Try API call
    final isOnline = await _checkConnectivity();

    if (isOnline) {
      try {
        await _remoteDataSource.removeFavorite(propertyId);

        // Success - remove status
        final syncedStatus = Map<String, FavoriteSyncStatus>.from(
          state.statusMap,
        )..remove(propertyId);

        state = state.copyWith(statusMap: syncedStatus);
      } catch (e) {
        // Failed - add to queue
        await _enqueueOperation(
          FavoriteOperation(
            propertyId: propertyId,
            action: FavoriteActionType.remove,
            timestamp: DateTime.now(),
          ),
        );
      }
    } else {
      // Offline - add to queue
      await _enqueueOperation(
        FavoriteOperation(
          propertyId: propertyId,
          action: FavoriteActionType.remove,
          timestamp: DateTime.now(),
        ),
      );
    }
  }

  /// Sync with server (reconcile state)
  Future<void> syncWithServer() async {
    if (state.isSyncing) return;

    state = state.copyWith(isSyncing: true, error: null);

    try {
      final isOnline = await _checkConnectivity();
      if (!isOnline) {
        state = state.copyWith(isSyncing: false);
        return;
      }

      // Process pending queue first (FIFO)
      await _processPendingQueue();

      // Get server state
      List<String> serverIds;
      try {
        serverIds = await _remoteDataSource.getFavoriteIds();
      } catch (e) {
        // If error contains 401, user is not logged in - fail silently
        if (e.toString().contains('401') ||
            e.toString().contains('Unauthorized') ||
            e.toString().contains('No token')) {
          state = state.copyWith(
            isSyncing: false,
            error: 'Please log in to sync favorites',
          );
          return;
        }
        // For other errors, rethrow
        rethrow;
      }
      final serverSet = serverIds.toSet();

      // Merge: apply local operations to server state
      final localIds = Set<String>.from(state.favoriteIds);
      final queue = state.pendingQueue;

      // If no pending operations, use server state as source of truth
      if (queue.isEmpty) {
        state = state.copyWith(
          favoriteIds: serverSet,
          statusMap: {},
          lastSyncTime: DateTime.now(),
          isSyncing: false,
        );

        await _localDataSource.cacheFavoriteIds(serverSet);
        return;
      }

      // Use sync endpoint to reconcile
      final result = await _remoteDataSource.syncFavorites(localIds.toList());
      final currentIds = (result['current'] as List).cast<String>().toSet();

      state = state.copyWith(
        favoriteIds: currentIds,
        statusMap: {},
        pendingQueue: [],
        lastSyncTime: DateTime.now(),
        isSyncing: false,
      );

      await _localDataSource.cacheFavoriteIds(currentIds);
      await _localDataSource.clearQueue();
    } catch (e) {
      state = state.copyWith(isSyncing: false, error: e.toString());
    }
  }

  /// Process pending offline queue
  Future<void> _processPendingQueue() async {
    final queue = List<FavoriteOperation>.from(state.pendingQueue);

    for (final operation in queue) {
      try {
        if (operation.action == FavoriteActionType.add) {
          await _remoteDataSource.addFavorite(operation.propertyId);
        } else {
          await _remoteDataSource.removeFavorite(operation.propertyId);
        }

        // Success - remove from queue
        await _localDataSource.removeFromQueue(operation);

        // Update state
        final newQueue = List<FavoriteOperation>.from(state.pendingQueue)
          ..removeWhere(
            (op) =>
                op.propertyId == operation.propertyId &&
                op.action == operation.action &&
                op.timestamp == operation.timestamp,
          );

        final newStatus = Map<String, FavoriteSyncStatus>.from(state.statusMap)
          ..[operation.propertyId] = FavoriteSyncStatus.synced;

        state = state.copyWith(pendingQueue: newQueue, statusMap: newStatus);
      } catch (e) {
        // Mark as failed but keep in queue for retry
        final newStatus = Map<String, FavoriteSyncStatus>.from(state.statusMap)
          ..[operation.propertyId] = FavoriteSyncStatus.failed;

        state = state.copyWith(statusMap: newStatus);
      }
    }
  }

  /// Enqueue operation for offline sync
  Future<void> _enqueueOperation(FavoriteOperation operation) async {
    await _localDataSource.enqueueOperation(operation);

    final newQueue = List<FavoriteOperation>.from(state.pendingQueue)
      ..add(operation);
    final newStatus = Map<String, FavoriteSyncStatus>.from(state.statusMap)
      ..[operation.propertyId] = FavoriteSyncStatus.pending;

    state = state.copyWith(pendingQueue: newQueue, statusMap: newStatus);
  }

  /// Check network connectivity
  Future<bool> _checkConnectivity() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return connectivityResult != ConnectivityResult.none;
  }

  /// Refresh favorites from server
  Future<void> refresh() async {
    await syncWithServer();
  }

  /// Clear all favorites (local and remote)
  Future<void> clearAll() async {
    try {
      // Clear local first
      await _localDataSource.clearAll();

      state = FavoriteState();

      // Sync will handle server-side clearing
      await syncWithServer();
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }
}

/// Provider to check if a property is favorited
final isFavoriteProvider = Provider.family<bool, String>((ref, propertyId) {
  final favoritesState = ref.watch(favoritesProvider);
  return favoritesState.isFavorite(propertyId);
});

/// Provider to get favorite status for a property
final favoriteStatusProvider = Provider.family<FavoriteSyncStatus, String>((
  ref,
  propertyId,
) {
  final favoritesState = ref.watch(favoritesProvider);
  return favoritesState.getStatus(propertyId);
});

/// Provider to check if there are pending operations
final hasPendingFavoritesProvider = Provider<bool>((ref) {
  final favoritesState = ref.watch(favoritesProvider);
  return favoritesState.hasPendingOperations;
});
