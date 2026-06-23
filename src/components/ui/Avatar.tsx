import React from 'react';
import { View, Text, Image } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
}

export function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="bg-slate-200"
      />
    );
  }

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="bg-primary-100 items-center justify-center"
    >
      <Text style={{ fontSize: size * 0.36 }} className="text-primary-600 font-bold">
        {initials}
      </Text>
    </View>
  );
}
