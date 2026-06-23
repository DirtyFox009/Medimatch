import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  rounded?: boolean;
  className?: string;
}

export function Skeleton({ width = '100%', height = 16, rounded = false, className }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{ width, height, opacity, borderRadius: rounded ? 999 : 8 }}
      className={`bg-slate-200 ${className ?? ''}`}
    />
  );
}

export function DoctorCardSkeleton() {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 gap-3" style={{ elevation: 2 }}>
      <View className="flex-row gap-3 items-center">
        <Skeleton width={56} height={56} rounded />
        <View className="flex-1 gap-2">
          <Skeleton height={16} width="70%" />
          <Skeleton height={12} width="50%" />
        </View>
      </View>
      <Skeleton height={12} width="90%" />
      <View className="flex-row gap-2">
        <Skeleton height={28} width={80} rounded />
        <Skeleton height={28} width={60} rounded />
      </View>
    </View>
  );
}
