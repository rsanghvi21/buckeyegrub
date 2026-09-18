import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Card, CardProps } from './Card';
import { colors, radii, spacing, typography } from '@/src/constants/theme';

export interface SwipeActionConfig {
  label: string;
  icon?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
  onPress: () => void;
}

export interface SwipeableCardProps extends CardProps {
  leftAction?: SwipeActionConfig;
  rightAction?: SwipeActionConfig;
  renderLeftActions?: (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => React.ReactNode;
  renderRightActions?: (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => React.ReactNode;
  onSwipeOpen?: (direction: 'left' | 'right') => void;
  onSwipeClose?: (direction: 'left' | 'right') => void;
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * SwipeableCard: Wraps elevated meal/item cards with gesture-driven swipe actions (e.g. swap, favorite, log).
 * Designed for cross-platform gestures in BuckeyeGrub.
 */
export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  leftAction,
  rightAction,
  renderLeftActions,
  renderRightActions,
  onSwipeOpen,
  onSwipeClose,
  containerStyle,
  children,
  style,
  ...cardProps
}) => {
  const swipeableRef = useRef<Swipeable>(null);

  const defaultRenderLeftActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!leftAction) return null;

    const trans = dragX.interpolate({
      inputRange: [0, 80],
      outputRange: [-20, 0],
      extrapolate: 'clamp',
    });

    return (
      <View
        style={[
          styles.actionContainer,
          styles.leftActionContainer,
          { backgroundColor: leftAction.backgroundColor || colors.scarlet },
        ]}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Pressable
            onPress={() => {
              swipeableRef.current?.close();
              leftAction.onPress();
            }}
            style={styles.actionPressable}
          >
            {leftAction.icon ? (
              <View style={styles.actionIcon}>{leftAction.icon}</View>
            ) : null}
            <Text
              style={[
                styles.actionText,
                { color: leftAction.textColor || colors.textInverse },
              ]}
            >
              {leftAction.label}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  const defaultRenderRightActions = (
    _progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    if (!rightAction) return null;

    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 20],
      extrapolate: 'clamp',
    });

    return (
      <View
        style={[
          styles.actionContainer,
          styles.rightActionContainer,
          { backgroundColor: rightAction.backgroundColor || colors.grayDark },
        ]}
      >
        <Animated.View style={{ transform: [{ translateX: trans }] }}>
          <Pressable
            onPress={() => {
              swipeableRef.current?.close();
              rightAction.onPress();
            }}
            style={styles.actionPressable}
          >
            {rightAction.icon ? (
              <View style={styles.actionIcon}>{rightAction.icon}</View>
            ) : null}
            <Text
              style={[
                styles.actionText,
                { color: rightAction.textColor || colors.textInverse },
              ]}
            >
              {rightAction.label}
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  };

  return (
    <View style={[styles.root, containerStyle]}>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        leftThreshold={40}
        rightThreshold={40}
        renderLeftActions={renderLeftActions || (leftAction ? defaultRenderLeftActions : undefined)}
        renderRightActions={renderRightActions || (rightAction ? defaultRenderRightActions : undefined)}
        onSwipeableOpen={onSwipeOpen}
        onSwipeableClose={onSwipeClose}
        containerStyle={styles.swipeableContainer}
      >
        <Card style={style} {...cardProps}>
          {children}
        </Card>
      </Swipeable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.lg,
  },
  swipeableContainer: {
    width: '100%',
  },
  actionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  leftActionContainer: {
    borderTopLeftRadius: radii.lg,
    borderBottomLeftRadius: radii.lg,
  },
  rightActionContainer: {
    borderTopRightRadius: radii.lg,
    borderBottomRightRadius: radii.lg,
  },
  actionPressable: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  actionIcon: {
    marginBottom: 4,
  },
  actionText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
});

export default SwipeableCard;
