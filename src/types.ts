import type { ReactNode } from 'react';
import type { TextStyle, ViewStyle } from 'react-native';

export type ToastPosition = 'top' | 'bottom';
export type ToastTheme = 'light' | 'dark' | 'system';

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
}

export type SwipeDirection = 'left' | 'up';

export interface ToastSwipeHandlerProps {
  children: ReactNode;
  onDismiss: () => void;
  onBegin?: () => void;
  onFinalize?: () => void;
  onCancel?: () => void;
  enabled?: boolean;
  direction?: SwipeDirection;
  style?: ViewStyle;
}

export interface ToastStyles {
  toastContainer?: ViewStyle;
  toast?: ViewStyle;
  toastContent?: ViewStyle;
  textContainer?: ViewStyle;
  title?: TextStyle;
  description?: TextStyle;
  buttons?: ViewStyle;
  closeButton?: ViewStyle;
  closeButtonIcon?: TextStyle;
}

export interface ToastOptions {
  id?: number;
  duration?: number;
  description?: ReactNode;
  styles?: ToastStyles;
  icon?: ReactNode;
  jsx?: ReactNode;
  closeButton?: boolean | ReactNode;
  onDismiss?: () => void;
  onAutoClose?: () => void;
  dismissible?: boolean;
}

export type PromiseInput<T = unknown> = Promise<T> | (() => Promise<T>);

export type PromiseToastMessage<T = unknown> =
  ReactNode | ((data: T) => ReactNode | Promise<ReactNode>);

export type PromiseToastDescription<T = unknown> =
  ReactNode | ((data: T) => ReactNode | Promise<ReactNode>);

export type PromiseToastOptions = ToastOptions & {
  message: ReactNode;
};

export type ExtendedPromiseToastMessage<T> =
  | PromiseToastMessage<T>
  | PromiseToastOptions
  | ((data: T) => PromiseToastOptions | Promise<PromiseToastOptions>);

export type PromiseToastResult<T> = {
  id: number;
  unwrap: () => Promise<T>;
};

export type BaseToastState = {
  id: number;
  title: ReactNode;
  removed: boolean;
  description?: ReactNode;
  styles?: ToastStyles;
  icon?: ReactNode;
  jsx?: ReactNode;
  closeButton?: boolean | ReactNode;
  onDismiss?: () => void;
  onAutoClose?: () => void;
  dismissible?: boolean;
};

export type PromiseData = {
  promise: Promise<unknown>;
  success?: ExtendedPromiseToastMessage<any>;
  error?: ExtendedPromiseToastMessage<any>;
  description?: PromiseToastDescription<any>;
  finally?: () => void | Promise<void>;
};

export type ToastState =
  | (BaseToastState & {
      promiseData: undefined;
    })
  | (BaseToastState & {
      promiseData: PromiseData;
    });

export type PromiseToastState = BaseToastState & {
  promiseData: PromiseData;
};

export type PromiseDataInput<T = any> = Omit<ToastOptions, 'description'> & {
  loading?: ReactNode;
  description?: PromiseToastDescription<T>;
  success?: ExtendedPromiseToastMessage<T>;
  error?: ExtendedPromiseToastMessage<any>;
  finally?: () => void | Promise<void>;
};

export type AddToastInput = {
  message: ReactNode;
  id?: number;
  promiseData?: ToastState['promiseData'];
} & ToastOptions;

export type State = {
  toasts: ToastState[];
  toastHeights: Record<number, number>;
  isExpanded: boolean;
  activeGestureToastId: number | null;
};

export type Subscriber = () => void;
