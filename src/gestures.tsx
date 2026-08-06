import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Platform,
  StyleSheet,
  type GestureResponderEvent,
  type PanResponderGestureState,
  type ViewStyle,
} from 'react-native';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

export type SwipeDirection = 'left' | 'up';

interface ToastSwipeHandlerProps {
  children: React.ReactNode;
  onDismiss: () => void;
  onBegin?: () => void;
  onFinalize?: () => void;
  onCancel?: () => void;
  enabled?: boolean;
  direction?: SwipeDirection;
  style?: ViewStyle;
}

/**
 * Minimum primary-axis movement (in px) before the toast starts tracking
 * the gesture. Below this the toast does not move, so taps stay taps.
 */
const DEAD_ZONE = 8;

/**
 * Movement (in px) past which releasing the finger dismisses the toast.
 */
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
      // Claim only on movement, never on touch start. Taps therefore
      // stay with the Pressable (expand toggle), and vertical scrolls
      // on iOS never get claimed.
      onMoveShouldSetPanResponder: (
        _: GestureResponderEvent,
        gs: PanResponderGestureState
      ) => {
        if (!enabledRef.current) return false;

        if (Platform.OS === 'android') {
          // Android's native ScrollView intercepts on ANY vertical drift
          // past the touch slop, regardless of the swipe direction. So
          // claim every movement. Once granted, the default
          // onShouldBlockNativeResponder (true) triggers
          // requestDisallowInterceptTouchEvent, which stops the
          // ScrollView from activating.
          return Math.abs(gs.dx) > DEAD_ZONE || Math.abs(gs.dy) > DEAD_ZONE;
        }

        // iOS UIScrollView has directional lock: claim only when the
        // primary axis clearly dominates, so scrolling still works.
        const value = directionRef.current === 'left' ? gs.dx : gs.dy;
        const cross = directionRef.current === 'left' ? gs.dy : gs.dx;
        return (
          Math.abs(value) > DEAD_ZONE && Math.abs(value) > Math.abs(cross) * 1.2
        );
      },

      // Once we own the gesture, refuse to hand it back to a parent
      // ScrollView. On Android this is what keeps the swipe alive.
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
          // Track the primary axis only. Cross-axis movement is ignored
          // so the toast moves purely horizontally (or vertically).
          translateAnim.setValue(value);
        }
      },

      onPanResponderRelease: (
        _: GestureResponderEvent,
        gs: PanResponderGestureState
      ) => {
        if (!isSwiping.current) {
          // Claimed but never crossed the dead zone: treat as a tap.
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
          // Not past the dismiss point: bounce back to the start,
          // matching sonner-native's elastic snap-back.
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

      // The native side (e.g. an Android ScrollView) took the gesture.
      // We cannot prevent that in JS; snap the toast back.
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

  // Fade the toast out as it moves, reaching opacity 0 at the screen
  // edge. The fly-out animation animates the translate to the edge, so
  // the opacity goes to 0 during the flight.
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
