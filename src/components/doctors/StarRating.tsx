import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
}

export function StarRating({ rating, count, size = 14 }: StarRatingProps) {
  return (
    <View className="flex-row items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i < Math.round(rating) ? '#F59E0B' : '#CBD5E1'}
        />
      ))}
      <Text className="text-slate-500 text-xs ml-1">
        {rating.toFixed(1)}{count !== undefined ? ` (${count})` : ''}
      </Text>
    </View>
  );
}
