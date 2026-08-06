import { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from 'react-native';
import type { ToastSwipeHandlerProps } from './types';

export type { SwipeDirection } from './types';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

const DEAD_ZONE = 8;
const HORIZONTAL_DISMISS_THRESHOLD = 40;
const VERTICAL_DISMISS_THRESHOLD = 16;

export function ToastSwipeHandler({
  children,
  onDismiss,
  onBegin,
  onFinalize,
  onCancel,
  enabled = true,
  direction = 'left',
  style,
}: ToastSwipeHandlerProps) {
  const translateAnim = useRef(new Animated.Value(0)).current;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  const onBeginRef = useRef(onBegin);
  onBeginRef.current = onBegin;

  const onFinalizeRef = useRef(onFinalize);
  onFinalizeRef.current = onFinalize;

  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const directionRef = useRef(direction);
  directionRef.current = direction;

  const isSwiping = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gs: PanResponderGestureState
      ) => {
        if (!enabledRef.current) return false;

        if (Platform.OS === 'android') {
          return Math.abs(gs.dx) > DEAD_ZONE || Math.abs(gs.dy) > DEAD_ZONE;
        }

        const value = directionRef.current === 'left' ? gs.dx : gs.dy;
        const cross = directionRef.current === 'left' ? gs.dy : gs.dx;
        return (
          Math.abs(value) > DEAD_ZONE && Math.abs(value) > Math.abs(cross) * 1.2
        );
      },

      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: () => {
        isSwiping.current = false;
        onBeginRef.current?.();
      },

      onPanResponderMove: (
        _: GestureResponderEvent,
        gs: PanResponderGestureState
      ) => {
        const value = directionRef.current === 'left' ? gs.dx : gs.dy;

        if (!isSwiping.current && Math.abs(value) > DEAD_ZONE) {
          isSwiping.current = true;
        }

        if (isSwiping.current) {
          translateAnim.setValue(value);
        }
      },

      onPanResponderRelease: (
        _: GestureResponderEvent,
        gs: PanResponderGestureState
      ) => {
        if (!isSwiping.current) {
          onFinalizeRef.current?.();
          return;
        }

        isSwiping.current = false;
        onFinalizeRef.current?.();

        const value = directionRef.current === 'left' ? gs.dx : gs.dy;
        const threshold =
          directionRef.current === 'left'
            ? HORIZONTAL_DISMISS_THRESHOLD
            : VERTICAL_DISMISS_THRESHOLD;

        if (Math.abs(value) < threshold) {
          onCancelRef.current?.();
          Animated.timing(translateAnim, {
            toValue: 0,
            duration: 300,
            easing: Easing.elastic(0.8),
            useNativeDriver: true,
          }).start();
          return;
        }

        const flyTo =
          directionRef.current === 'left'
            ? value > 0
              ? WINDOW_WIDTH
              : -WINDOW_WIDTH
            : value > 0
              ? WINDOW_HEIGHT
              : -WINDOW_HEIGHT;

        Animated.timing(translateAnim, {
          toValue: flyTo,
          duration: 250,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) onDismissRef.current?.();
        });
      },

      onPanResponderTerminate: () => {
        isSwiping.current = false;
        onFinalizeRef.current?.();
        onCancelRef.current?.();
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.elastic(0.8),
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const animatedStyle = {
    transform: [
      direction === 'left'
        ? { translateX: translateAnim }
        : { translateY: translateAnim },
    ],
    opacity: translateAnim.interpolate({
      inputRange:
        direction === 'left'
          ? [-WINDOW_WIDTH, 0, WINDOW_WIDTH]
          : [-WINDOW_HEIGHT, 0, WINDOW_HEIGHT],
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    }),
  };

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[animatedStyle, styles.fullWidth, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
});
