import React from 'react';
import { IconButton } from 'react-native-paper';
import { addFavorite, removeFavorite, isFavorite } from '../services/favorites';

type FavoriteButtonProps = {
  requestId: string;
  onToggle?: (isFavorite: boolean) => void;
};

export function FavoriteButton({ requestId, onToggle }: FavoriteButtonProps) {
  const [favorite, setFavorite] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    isFavorite(requestId)
      .then(setFavorite)
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleToggle = async () => {
    try {
      if (favorite) {
        await removeFavorite(requestId);
      } else {
        await addFavorite(requestId);
      }
      setFavorite(!favorite);
      onToggle?.(!favorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <IconButton
      icon={favorite ? 'bookmark' : 'bookmark-outline'}
      disabled={loading}
      onPress={handleToggle}
    />
  );
} 