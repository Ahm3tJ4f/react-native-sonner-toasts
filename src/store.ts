import { isValidElement, type ReactNode } from 'react';
import type {
  AddToastInput,
  ExtendedPromiseToastMessage,
  PromiseDataInput,
  PromiseInput,
  PromiseToastOptions,
  PromiseToastResult,
  PromiseToastState,
  State,
  Subscriber,
  ToastOptions,
  ToastState,
} from './types';

export type {
  PromiseDataInput,
  PromiseInput,
  PromiseToastDescription,
  PromiseToastMessage,
  PromiseToastOptions,
  PromiseToastResult,
  ToastState,
  ToastStyles,
  BaseToastState,
  ExtendedPromiseToastMessage,
} from './types';

const TIME_BEFORE_UNMOUNT = 200;
const DEFAULT_TOAST_DURATION = 3000;

const isHttpResponse = (data: unknown): data is Response => {
  return (
    !!data &&
    typeof data === 'object' &&
    'ok' in data &&
    typeof (data as { ok?: unknown }).ok === 'boolean' &&
    'status' in data &&
    typeof (data as { status?: unknown }).status === 'number'
  );
};

class Store {
  private state: State = {
    toasts: [],
    toastHeights: {},
    isExpanded: false,
    activeGestureToastId: null,
  };
  private toastCounter = 1;
  private timers: Record<number, ReturnType<typeof setTimeout>> = {};
  private timerRemaining: Record<number, number> = {};
  private timerStartedAt: Record<number, number> = {};
  private timerCallbacks: Record<number, () => void> = {};
  private removalTimeouts: Record<number, ReturnType<typeof setTimeout>> = {};
  private subscribers = new Set<Subscriber>();
  private defaultDuration = DEFAULT_TOAST_DURATION;

  setDefaultDuration = (duration: number) => {
    this.defaultDuration = duration;
  };

  setExpanded = (expanded: boolean) => {
    if (this.state.isExpanded === expanded) return;
    this.state = {
      ...this.state,
      isExpanded: expanded,
    };
    this.syncTimersWithExpanded();
    this.publish();
  };

  toggleExpand = () => {
    this.setExpanded(!this.state.isExpanded);
  };

  setActiveGestureToastId = (id: number | null) => {
    if (this.state.activeGestureToastId === id) return;
    this.state = {
      ...this.state,
      activeGestureToastId: id,
    };
    this.publish();
  };

  private syncTimersWithExpanded = () => {
    for (const toast of this.state.toasts) {
      if (toast.removed) continue;
      if (this.state.isExpanded) {
        this.pauseTimer(toast.id);
      } else {
        this.resumeTimer(toast.id);
      }
    }
  };

  subscribe = (sb: Subscriber) => {
    this.subscribers.add(sb);

    const unsubscribe = () => {
      this.subscribers.delete(sb);
    };

    return unsubscribe;
  };

  private publish = () => {
    this.subscribers.forEach((cb) => cb());
  };

  getSnapshot = () => this.state;

  setToastHeight = (id: number, height: number) => {
    this.state = {
      ...this.state,
      toastHeights: { ...this.state.toastHeights, [id]: height },
    };
    this.publish();
  };

  addToast = ({ message, duration, id, ...rest }: AddToastInput) => {
    const existing =
      id !== undefined ? this.state.toasts.find((t) => t.id === id) : undefined;

    let toast: ToastState;

    if (existing) {
      const existingId = id!;
      const pendingRemoval = this.removalTimeouts[existingId];
      if (pendingRemoval) {
        clearTimeout(pendingRemoval);
        delete this.removalTimeouts[existingId];
      }

      toast = {
        ...existing,
        title: message,
        removed: false,
        id: existing.id,
        ...rest,
      };

      this.state = {
        ...this.state,
        toasts: this.state.toasts.map((t) => (t.id === existingId ? toast : t)),
      };
    } else {
      const newId = id ?? this.toastCounter++;
      toast = {
        title: message,
        removed: false,
        id: newId,
        ...rest,
      };

      this.state = {
        ...this.state,
        toasts: [toast, ...this.state.toasts],
      };
    }

    if (toast.promiseData) {
      this.handlePromise(toast);
    } else {
      this.addTimer({
        id: toast.id,
        onTimeout: () => {
          toast.onAutoClose?.();
          this.dismissToast(toast.id);
        },
        duration: duration ?? this.defaultDuration,
      });
      if (this.state.isExpanded) this.pauseTimer(toast.id);
    }

    this.publish();
    return toast.id;
  };

  private toastExists = (id: number) =>
    this.state.toasts.some((t) => t.id === id);

  dismissToast = (id: number) => {
    const existing = this.state.toasts.find((t) => t.id === id);
    if (!existing || existing.removed) return;

    this.clearTimer(id);

    const pendingRemoval = this.removalTimeouts[id];
    if (pendingRemoval) {
      clearTimeout(pendingRemoval);
      delete this.removalTimeouts[id];
    }

    const newToasts = this.state.toasts.map((t) =>
      t.id === id ? { ...t, removed: true } : t
    );

    this.state = {
      ...this.state,
      toasts: newToasts,
    };

    existing.onDismiss?.();

    this.removalTimeouts[id] = setTimeout(() => {
      this.commitRemoval(id);
    }, TIME_BEFORE_UNMOUNT);

    this.publish();
  };

  pauseTimer = (id: number) => {
    const timer = this.timers[id];
    if (!timer) return;

    const elapsed = Date.now() - (this.timerStartedAt[id] || Date.now());
    const remaining = Math.max(
      0,
      (this.timerRemaining[id] ?? this.defaultDuration) - elapsed
    );
    this.timerRemaining[id] = remaining;

    clearTimeout(timer);
    delete this.timers[id];
  };

  resumeTimer = (id: number) => {
    if (this.timers[id]) return;

    const toast = this.state.toasts.find((t) => t.id === id);
    if (!toast || toast.removed) return;

    const remaining = this.timerRemaining[id];
    if (remaining === undefined || remaining <= 0) return;
    if (remaining === Infinity) return;

    const callback = this.timerCallbacks[id];
    if (!callback) return;

    this.timerStartedAt[id] = Date.now();

    const timeout = setTimeout(() => {
      callback();
      this.clearTimer(id);
    }, remaining);

    this.timers[id] = timeout;
  };

  commitRemoval = (id: number) => {
    delete this.removalTimeouts[id];
    const restHeights = { ...this.state.toastHeights };
    delete restHeights[id];
    this.state = {
      ...this.state,
      toasts: this.state.toasts.filter((t) => t.id !== id),
      toastHeights: restHeights,
    };

    this.publish();
  };

  private normalizePromiseMessage = async <T>(
    input: ExtendedPromiseToastMessage<T>,
    data: T
  ): Promise<PromiseToastOptions> => {
    const raw =
      typeof input === 'function'
        ? await (input as (data: T) => unknown)(data)
        : input;

    if (typeof raw === 'object' && raw !== null && !isValidElement(raw)) {
      return { ...(raw as PromiseToastOptions) };
    }

    return { message: raw as ReactNode };
  };

  private handlePromise = async (toast: PromiseToastState) => {
    const { id, promiseData } = toast;
    const { promise, error, finally: onFinally } = promiseData;

    try {
      const response = await promise;

      if (!this.toastExists(id)) return;

      const settings = await this.resolveResult(toast, response);

      if (settings === null) {
        this.dismissToast(id);
      } else {
        this.addToast({
          id,
          promiseData: undefined,
          ...settings,
        });
      }
    } catch (reason) {
      if (!this.toastExists(id)) return;

      if (error === undefined) {
        this.dismissToast(id);
      } else {
        const settings = await this.normalizePromiseMessage(error, reason);

        this.addToast({
          id,
          promiseData: undefined,
          ...settings,
        });
      }
    } finally {
      onFinally?.();
    }
  };

  private resolveResult = async (
    toast: PromiseToastState,
    response: unknown
  ): Promise<PromiseToastOptions | null> => {
    const { promiseData } = toast;
    const { success, error, description } = promiseData;

    const resolveDescription = async (
      data: unknown
    ): Promise<ReactNode | undefined> =>
      typeof description === 'function'
        ? ((await description(data)) as ReactNode)
        : description;

    if (isValidElement(response)) {
      const desc = await resolveDescription(response);
      return desc === undefined
        ? { message: response }
        : { message: response, description: desc };
    }

    if (isHttpResponse(response) && !response.ok) {
      const httpMessage = `HTTP error! status: ${response.status}`;

      if (error !== undefined) {
        const settings = await this.normalizePromiseMessage(error, httpMessage);
        const desc = await resolveDescription(httpMessage);
        return desc === undefined
          ? settings
          : { ...settings, description: desc };
      }

      const desc = await resolveDescription(httpMessage);
      return desc === undefined
        ? { message: 'An error occurred' }
        : { message: 'An error occurred', description: desc };
    }

    if (response instanceof Error) {
      if (error !== undefined) {
        const settings = await this.normalizePromiseMessage(error, response);
        const desc = await resolveDescription(response);
        return desc === undefined
          ? settings
          : { ...settings, description: desc };
      }

      const desc = await resolveDescription(response);
      return desc === undefined
        ? { message: 'An error occurred' }
        : { message: 'An error occurred', description: desc };
    }

    if (success !== undefined) {
      const settings = await this.normalizePromiseMessage(success, response);
      const desc = await resolveDescription(response);
      return desc === undefined ? settings : { ...settings, description: desc };
    }

    return null;
  };

  private addTimer = ({
    id,
    onTimeout,
    duration,
  }: {
    id: number;
    onTimeout: () => void;
    duration: number;
  }) => {
    this.clearTimer(id);

    this.timerStartedAt[id] = Date.now();
    this.timerRemaining[id] = duration;
    this.timerCallbacks[id] = onTimeout;

    if (duration === Infinity) return;

    const timeout = setTimeout(() => {
      this.timerCallbacks[id]?.();
      this.clearTimer(id);
    }, duration);

    this.timers[id] = timeout;
  };

  private clearTimer = (id: number) => {
    const timer = this.timers[id];
    if (timer) clearTimeout(timer);
    delete this.timers[id];
    delete this.timerRemaining[id];
    delete this.timerStartedAt[id];
    delete this.timerCallbacks[id];
  };

  resetForTests = () => {
    for (const id in this.removalTimeouts) {
      const timeout = this.removalTimeouts[id];
      if (timeout) clearTimeout(timeout);
    }
    for (const id in this.timers) {
      const timeout = this.timers[id];
      if (timeout) clearTimeout(timeout);
    }
    this.state = {
      toasts: [],
      toastHeights: {},
      isExpanded: false,
      activeGestureToastId: null,
    };
    this.toastCounter = 1;
    this.timers = {};
    this.timerRemaining = {};
    this.timerStartedAt = {};
    this.timerCallbacks = {};
    this.removalTimeouts = {};
    this.defaultDuration = DEFAULT_TOAST_DURATION;
  };
}

export const toastStore = new Store();

const basicToast = (message: string, options?: ToastOptions) =>
  toastStore.addToast({ message, ...options });

export const toast = Object.assign(basicToast, {
  custom: (jsx: ReactNode, options?: ToastOptions) =>
    toastStore.addToast({ message: '', jsx, ...options }),
  promise: <T>(
    promiseInput: PromiseInput<T>,
    data?: PromiseDataInput<T>
  ): PromiseToastResult<T> => {
    const promise =
      typeof promiseInput === 'function' ? promiseInput() : promiseInput;

    const { loading, description, ...rest } = data ?? {};

    const id = toastStore.addToast({
      message: loading,
      description: typeof description !== 'function' ? description : undefined,
      promiseData: {
        promise: promise,
        success: data?.success,
        error: data?.error,
        description,
        finally: data?.finally,
      },
      ...rest,
    });

    return { id, unwrap: () => promise };
  },
  dismiss: (id?: number) => {
    if (id !== undefined) {
      toastStore.dismissToast(id);
    } else {
      toastStore.getSnapshot().toasts.forEach((t) => {
        if (!t.removed) toastStore.dismissToast(t.id);
      });
    }
  },
});
