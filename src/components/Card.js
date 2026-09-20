import React, { useEffect, useRef } from 'react';
import { Animated, Platform } from 'react-native';
import styles from '../style/components/CardStyles';

export default function Card({ children, style }) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 360,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [entrance]);

  return (
    <Animated.View
      style={[
        styles.card,
        { opacity: entrance, transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

