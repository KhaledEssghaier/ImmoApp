export interface FavoriteAddedEvent {
  userId: string;
  propertyId: string;
  source: string;
  timestamp: Date;
}

export interface FavoriteRemovedEvent {
  userId: string;
  propertyId: string;
  timestamp: Date;
}

export const FAVORITE_EVENTS = {
  ADDED: 'favorite.added',
  REMOVED: 'favorite.removed',
};
