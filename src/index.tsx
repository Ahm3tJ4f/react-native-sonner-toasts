import {
  useEffect,
  useRef,
  useSyncExternalStore,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import {
  toastStore,
  type ToastState,
  type PromiseInput,
  type PromiseToastMessage,
  type PromiseToastDescription,
  type PromiseToastOptions,
  type ExtendedPromiseToastMessage,
  type PromiseToastResult,
  toast as toastApi,
} from './store';
import { ToastSwipeHandler, type SwipeDirection } from './gestures';

const STACK_SCALE_STEP = 0.05;
const ESTIMATED_TOAST_HEIGHT = 50;

export type ToastPosition = 'top-center' | 'bottom-center';
export type ToastTheme = 'light' | 'dark' | 'system';

const themeColors = {
  light: {
    toast: '#FFFFFF',
    border: '#EDEDED',
    title: '#171717',
    description: '#171717',
    closeButton: '#A3A3A3',
  },
  dark: {
    toast: '#000000',
    border: '#333333',
    title: '#FFFFFF',
    description: '#EBEBF5',
    closeButton: '#8E8E93',
  },
} as const;

export interface ToasterProps {
  closeButton?: boolean;
  position?: ToastPosition;
  visibleToasts?: number;
  gap?: number;
  offset?: number;
  theme?: ToastTheme;
  duration?: number;
  expand?: boolean;
  swipeToDismissDirection?: SwipeDirection;
  safeAreaInsets?: { top: number; bottom: number };
}

const computeTarget = ({
  index,
  isExpanded,
  toasts,
  heights,
  gap,
}: {
  index: number;
  toasts: ToastState[];
  heights: Record<number, number>;
  isExpanded: boolean;
  gap: number;
}) => {
  const toast = toasts[index];
  const liveIndex = toasts.slice(0, index).filter((t) => !t.removed).length;
  const effIndex = toast?.removed ? index : liveIndex;

  const ownHeight = heights[toast?.id ?? -1] ?? ESTIMATED_TOAST_HEIGHT;

  if (effIndex === 0) {
    return {
      scale: 1,
      height: ownHeight,
      offset: 0,
      opacity: 1,
      liveIndex: effIndex,
    };
  }

  if (!isExpanded) {
    const firstLive = toasts.find((t) => !t.removed);
    const secondLive = toasts.filter((t) => !t.removed)[1];
    const frontHeight =
      heights[firstLive?.id || -1] ||
      heights[secondLive?.id || -1] ||
      ESTIMATED_TOAST_HEIGHT;

    return {
      height: frontHeight,
      offset: gap * effIndex,
      opacity: 0,
      scale: 1 - STACK_SCALE_STEP * effIndex,
      liveIndex: effIndex,
    };
  }

  const sum = toasts.slice(0, index).reduce((prev, curr) => {
    if (curr.removed) return prev;
    return prev + (heights[curr.id] ?? ESTIMATED_TOAST_HEIGHT);
  }, 0);

  return {
    offset: sum + gap * effIndex,
    height: ownHeight,
    opacity: 1,
    scale: 1,
    liveIndex: effIndex,
  };
};

function useAnimatedValue(initial: number): MutableRefObject<Animated.Value> {
  const ref = useRef<Animated.Value | null>(null);
  if (ref.current === null) {
    ref.current = new Animated.Value(initial);
  }
  return ref as MutableRefObject<Animated.Value>;
}

function ToastItem({
  toast,
  target,
  toasterCloseButton,
  visibleToasts,
  position,
  colors,
  swipeDirection,
}: {
  toast: ToastState;
  target: ReturnType<typeof computeTarget>;
  toasterCloseButton: boolean;
  visibleToasts: number;
  position: ToastPosition;
  colors: (typeof themeColors)['light'] | (typeof themeColors)['dark'];
  swipeDirection: SwipeDirection;
}) {
  const isVisible = target.liveIndex < visibleToasts;

  const isPromiseLoading = toast.promiseData !== undefined;

  const closeButtonSetting =
    toast.closeButton !== undefined ? toast.closeButton : toasterCloseButton;
  const showDefaultCloseButton =
    !isPromiseLoading && closeButtonSetting === true;
  const customCloseButton =
    !isPromiseLoading && typeof closeButtonSetting === 'object'
      ? closeButtonSetting
      : null;

  const direction = position === 'top-center' ? 1 : -1;

  const translateY = useAnimatedValue(direction * target.offset);
  const height = useAnimatedValue(target.height);
  const opacity = useAnimatedValue(target.opacity);
  const scale = useAnimatedValue(target.scale);
  const enteringOpacity = useAnimatedValue(0);
  const enteringOffset = useAnimatedValue(-direction * target.height);
  const cullOpacity = useAnimatedValue(isVisible ? 1 : 0);
  const hasEntered = useRef(false);

  const onToastLayout = (event: LayoutChangeEvent) => {
    const measuredHeight = event.nativeEvent.layout.height;

    if (target.liveIndex === 0) {
      toastStore.setToastHeight(toast.id, measuredHeight);
    }

    if (hasEntered.current) return;
    hasEntered.current = true;

    enteringOffset.current.setValue(-direction * measuredHeight);

    Animated.parallel([
      Animated.timing(enteringOffset.current, {
        toValue: 0,
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
      Animated.timing(enteringOpacity.current, {
        toValue: 1,
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    Animated.timing(cullOpacity.current, {
      toValue: isVisible ? 1 : 0,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [cullOpacity, isVisible]);

  useEffect(() => {
    if (toast.removed) {
      Animated.timing(enteringOpacity.current, {
        toValue: 0,
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [enteringOpacity, toast.removed]);

  useEffect(() => {
    if (toast.removed) {
      Animated.timing(enteringOffset.current, {
        toValue: -direction * target.height,
        duration: 400,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: true,
      }).start();
    }
  }, [direction, enteringOffset, toast.removed, target.height]);

  useEffect(() => {
    Animated.timing(translateY.current, {
      toValue: direction * target.offset,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [direction, target.offset, translateY]);

  useEffect(() => {
    Animated.timing(opacity.current, {
      toValue: target.opacity,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [opacity, target.opacity]);

  useEffect(() => {
    Animated.timing(scale.current, {
      toValue: target.scale,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: true,
    }).start();
  }, [scale, target.scale]);

  useEffect(() => {
    Animated.timing(height.current, {
      toValue: target.height,
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [height, target.height]);

  const isFront = target.liveIndex === 0;
  const dismissible = toast.dismissible !== false;

  const wrapperStyle = isFront
    ? undefined
    : ({ height: height.current } as const);

  const animatedToastOpacityStyle = {
    opacity: enteringOpacity.current,
  } as const;

  const animatedToastTransformStyle = {
    transform: [
      { scale: scale.current },
      { translateY: enteringOffset.current },
    ],
  } as const;

  const animatedContentStyle = {
    opacity: opacity.current,
  };

  const animatedPositionerStyle = {
    opacity: cullOpacity.current,
    transform: [{ translateY: translateY.current }],
  } as const;

  const positionerStyle = {
    left: 0,
    right: 0,
    position: 'absolute' as const,
    ...(position === 'top-center' ? { top: 0 } : { bottom: 0 }),
  };

  return (
    <Animated.View
      style={[
        positionerStyle,
        toast.styles?.toastContainer,
        animatedPositionerStyle,
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      <ToastSwipeHandler
        enabled={dismissible && !isPromiseLoading}
        direction={swipeDirection}
        onDismiss={() => {
          toastStore.dismissToast(toast.id);
          toastStore.setActiveGestureToastId(null);
        }}
        onBegin={() => {
          toastStore.pauseTimer(toast.id);
          toastStore.setActiveGestureToastId(toast.id);
        }}
        onFinalize={() => {
          toastStore.resumeTimer(toast.id);
        }}
        onCancel={() => {
          toastStore.setActiveGestureToastId(null);
        }}
      >
        <Pressable
          onPress={() => {
            toastStore.toggleExpand();
          }}
        >
          <Animated.View style={wrapperStyle}>
            <Animated.View
              style={[
                isFront ? null : StyleSheet.absoluteFillObject,
                animatedToastOpacityStyle,
              ]}
            >
              <Animated.View
                onLayout={onToastLayout}
                style={[
                  styles.toast,
                  {
                    backgroundColor: colors.toast,
                    ...(!toast.jsx && {
                      borderWidth: 1,
                      borderColor: colors.border,
                    }),
                  },
                  toast.styles?.toast,
                  isFront ? null : StyleSheet.absoluteFillObject,
                  animatedToastTransformStyle,
                ]}
              >
                <Animated.View
                  style={[
                    !toast.jsx && styles.toastContent,
                    toast.styles?.toastContent,
                    !toast.jsx && !toast.description && styles.centeredContent,
                    animatedContentStyle,
                  ]}
                >
                  {toast.jsx ? (
                    toast.jsx
                  ) : (
                    <>
                      {isPromiseLoading
                        ? (toast.icon ?? <ActivityIndicator />)
                        : toast.icon}
                      <View
                        style={[
                          styles.textContainer,
                          toast.styles?.textContainer,
                        ]}
                      >
                        <Text
                          style={[
                            styles.title,
                            { color: colors.title },
                            toast.styles?.title,
                          ]}
                        >
                          {toast.title}
                        </Text>
                        {toast.description && (
                          <Text
                            style={[
                              styles.description,
                              { color: colors.description },
                              toast.styles?.description,
                            ]}
                          >
                            {toast.description}
                          </Text>
                        )}
                      </View>
                      <CloseButton
                        toast={toast}
                        showDefault={showDefaultCloseButton}
                        custom={customCloseButton}
                        colors={colors}
                      />
                    </>
                  )}
                </Animated.View>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Pressable>
      </ToastSwipeHandler>
    </Animated.View>
  );
}

function Toaster({
  closeButton = false,
  position = 'bottom-center',
  visibleToasts = 3,
  gap = 12,
  offset,
  theme = 'light',
  duration,
  expand = false,
  swipeToDismissDirection = 'left',
  safeAreaInsets,
}: ToasterProps) {
  const systemScheme = useColorScheme();
  const resolvedTheme =
    theme === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : theme;
  const colors = themeColors[resolvedTheme];

  useEffect(() => {
    if (duration !== undefined) {
      toastStore.setDefaultDuration(duration);
    }
  }, [duration]);

  useEffect(() => {
    toastStore.setExpanded(expand);
  }, [expand]);

  const resolvedOffset = (() => {
    if (offset !== undefined) return offset;
    const inset =
      position === 'top-center'
        ? (safeAreaInsets?.top ?? 0)
        : (safeAreaInsets?.bottom ?? 0);
    return inset > 0 ? inset + 8 : 40;
  })();

  const containerStyle = {
    position: 'absolute' as const,
    left: 16,
    right: 16,
    ...(position === 'top-center'
      ? { top: resolvedOffset }
      : { bottom: resolvedOffset }),
  };

  const { toasts, toastHeights, isExpanded, activeGestureToastId } =
    useSyncExternalStore(
      toastStore.subscribe,
      toastStore.getSnapshot,
      toastStore.getSnapshot
    );

  // Android: while a swipe gesture is active, flip the overlay from
  // box-none to auto via setNativeProps. The overlay then consumes the
  // native touch stream, so the sibling ScrollView never receives the
  // events and cannot intercept the gesture at the native level.

  const overlayRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const block = activeGestureToastId != null;
    overlayRef.current?.setNativeProps({
      pointerEvents: block ? 'auto' : 'box-none',
    });
  }, [activeGestureToastId]);

  const items: Array<{
    toast: ToastState;
    index: number;
    target: ReturnType<typeof computeTarget>;
  }> = [];

  for (let i = 0; i < toasts.length; i++) {
    const toast = toasts[i]!;
    const target = computeTarget({
      index: i,
      toasts,
      heights: toastHeights,
      isExpanded,
      gap,
    });

    if (target.liveIndex > visibleToasts) continue;

    items.push({ toast, index: i, target });
  }

  return (
    <View ref={overlayRef} style={styles.overlay} pointerEvents="box-none">
      <View style={containerStyle} pointerEvents="box-none">
        {[...items].reverse().map(({ toast, target }) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            target={target}
            toasterCloseButton={closeButton}
            visibleToasts={visibleToasts}
            position={position}
            colors={colors}
            swipeDirection={swipeToDismissDirection}
          />
        ))}
      </View>
    </View>
  );
}

const CloseButton = ({
  toast,
  showDefault,
  custom,
  colors,
}: {
  toast: ToastState;
  showDefault: boolean;
  custom: ReactNode | null;
  colors: (typeof themeColors)['light'] | (typeof themeColors)['dark'];
}) => {
  if (custom) return <>{custom}</>;
  if (!showDefault) return null;

  return (
    <Pressable
      onPress={() => toastStore.dismissToast(toast.id)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Close toast"
      style={[styles.closeButton, toast.styles?.closeButton]}
    >
      <Text
        style={[
          styles.closeIcon,
          { color: colors.closeButton },
          toast.styles?.closeButtonIcon,
        ]}
      >
        ×
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  toast: {
    borderRadius: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    shadowColor: Platform.select({
      ios: 'rgba(0,0,0,0.1)',
      android: 'rgba(0,0,0,0.25)',
    }),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  toastContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 6,
  },
  centeredContent: {
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
  },
  description: {
    fontSize: 12,
    opacity: 0.7,
  },
  closeButton: {
    minWidth: 20,
    minHeight: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  closeIcon: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '400',
  },
});

export {
  Toaster,
  toastApi as toast,
  toastStore,
  type ToastState,
  type SwipeDirection,
  type PromiseInput,
  type PromiseToastMessage,
  type PromiseToastDescription,
  type PromiseToastOptions,
  type ExtendedPromiseToastMessage,
  type PromiseToastResult,
};
