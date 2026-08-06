import { createElement } from 'react';
import { toastStore } from '../store';

describe('Store', () => {
  beforeEach(() => {
    toastStore.resetForTests();
  });

  describe('addToast', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('adds a toast with an auto-generated id', () => {
      const id = toastStore.addToast({ message: 'Hello' });

      const toast = toastStore.getSnapshot().toasts.find((t) => t.id === id);

      expect(toast?.title).toBe('Hello');
      expect(toast?.removed).toBe(false);
      expect(toast?.promiseData).toBeUndefined();
    });

    it('increments the counter for every toast', () => {
      const first = toastStore.addToast({ message: 'One' });
      const second = toastStore.addToast({ message: 'Two' });

      expect(second).toBeGreaterThan(first);
    });

    it('respects a custom id', () => {
      const id = toastStore.addToast({ message: 'Custom', id: 9001 });
      expect(id).toBe(9001);
    });

    it('updates an existing toast in place when the id matches', () => {
      const id = toastStore.addToast({ message: 'First', id: 7 });
      toastStore.addToast({ message: 'Second', id: 7 });

      const toasts = toastStore.getSnapshot().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.id).toBe(id);
      expect(toasts[0]?.title).toBe('Second');
    });

    it('keeps fields that are not part of the update', () => {
      toastStore.addToast({ message: 'Loading', id: 3, jsx: 'custom-jsx' });
      toastStore.addToast({ message: 'Done', id: 3 });

      const toast = toastStore.getSnapshot().toasts[0];
      expect(toast?.title).toBe('Done');
      expect(toast?.jsx).toBe('custom-jsx');
    });

    it('revives a toast that was dismissed but not yet removed', () => {
      const id = toastStore.addToast({ message: 'First', id: 9 });
      toastStore.dismissToast(id);
      toastStore.addToast({ message: 'Back again', id: 9 });

      const toasts = toastStore.getSnapshot().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0]?.removed).toBe(false);
      expect(toasts[0]?.title).toBe('Back again');
    });

    it('starts the auto-close timer with the default duration', () => {
      toastStore.addToast({ message: 'Default' });

      jest.advanceTimersByTime(2999);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(false);

      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(true);
    });

    it('respects a custom duration', () => {
      toastStore.addToast({ message: 'Custom', duration: 1000 });

      jest.advanceTimersByTime(999);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(false);

      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(true);
    });

    it('never auto-closes when duration is Infinity', () => {
      toastStore.addToast({ message: 'Forever', duration: Infinity });

      jest.advanceTimersByTime(100000);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(false);
    });

    it('calls onAutoClose when the timer expires', () => {
      const onAutoClose = jest.fn();
      toastStore.addToast({ message: 'Timed', onAutoClose, duration: 500 });

      jest.advanceTimersByTime(500);
      expect(onAutoClose).toHaveBeenCalledTimes(1);
    });

    it('notifies subscribers', () => {
      const subscriber = jest.fn();
      toastStore.subscribe(subscriber);

      toastStore.addToast({ message: 'Notify' });
      expect(subscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('dismissToast', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('marks the toast as removed immediately', () => {
      const id = toastStore.addToast({ message: 'Bye' });
      toastStore.dismissToast(id);

      const toast = toastStore.getSnapshot().toasts[0];
      expect(toast?.removed).toBe(true);
    });

    it('removes the toast from the state after the unmount delay', () => {
      const id = toastStore.addToast({ message: 'Bye' });
      toastStore.dismissToast(id);

      jest.advanceTimersByTime(199);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);

      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('is a no-op for unknown ids', () => {
      toastStore.dismissToast(9999);
      expect(toastStore.getSnapshot().toasts).toHaveLength(0);
    });

    it('is a no-op for already removed toasts', () => {
      const id = toastStore.addToast({ message: 'Once' });
      toastStore.dismissToast(id);
      toastStore.dismissToast(id);
      expect(toastStore.getSnapshot().toasts).toHaveLength(1);
    });

    it('calls onDismiss', () => {
      const onDismiss = jest.fn();
      const id = toastStore.addToast({ message: 'Bye', onDismiss });
      toastStore.dismissToast(id);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('cleans up the auto-close timer', () => {
      const onAutoClose = jest.fn();
      const id = toastStore.addToast({
        message: 'Timed',
        onAutoClose,
        duration: 1000,
      });
      toastStore.dismissToast(id);

      jest.advanceTimersByTime(5000);
      expect(onAutoClose).not.toHaveBeenCalled();
    });
  });

  describe('timers', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    it('pauses the countdown and resumes with the remaining time', () => {
      const id = toastStore.addToast({ message: 'Paused', duration: 2000 });

      jest.advanceTimersByTime(500);
      toastStore.pauseTimer(id);
      jest.advanceTimersByTime(10000);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(false);

      toastStore.resumeTimer(id);
      jest.advanceTimersByTime(1499);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(false);

      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(true);
    });

    it('does not resume a toast with no remaining time', () => {
      const id = toastStore.addToast({ message: 'Expired', duration: 100 });
      jest.advanceTimersByTime(100);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(true);

      toastStore.resumeTimer(id);
      jest.advanceTimersByTime(5000);
      // Still gone, and no crash.
      expect(
        toastStore.getSnapshot().toasts.find((t) => t.id === id)
      ).toBeUndefined();
    });

    it('pauses all timers when expanded and resumes when collapsed', () => {
      toastStore.addToast({ message: 'Expandable', duration: 2000 });

      toastStore.setExpanded(true);
      jest.advanceTimersByTime(5000);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(false);

      toastStore.setExpanded(false);
      jest.advanceTimersByTime(1999);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(false);

      jest.advanceTimersByTime(1);
      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(true);
    });

    it('toggles the expanded state', () => {
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
      toastStore.toggleExpand();
      expect(toastStore.getSnapshot().isExpanded).toBe(true);
      toastStore.toggleExpand();
      expect(toastStore.getSnapshot().isExpanded).toBe(false);
    });
  });

  describe('toast heights', () => {
    it('stores and returns heights per toast id', () => {
      toastStore.addToast({ message: 'Tall', id: 1 });
      toastStore.setToastHeight(1, 80);

      expect(toastStore.getSnapshot().toastHeights[1]).toBe(80);
    });
  });

  describe('promises', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    // handlePromise chains several awaited helpers internally, so a single
    // microtask flush is not enough. A macrotask runs after all of them.
    const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

    it('swaps to the success message when the promise resolves', async () => {
      const promise = Promise.resolve('data');
      toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise, success: 'Saved!' },
      });

      await promise;
      await flush();

      const toast = toastStore.getSnapshot().toasts[0];
      expect(toast?.title).toBe('Saved!');
      expect(toast?.promiseData).toBeUndefined();
    });

    it('calls the success function with the resolved data', async () => {
      const promise = Promise.resolve('42');
      toastStore.addToast({
        message: 'Loading…',
        promiseData: {
          promise,
          success: (data) => `Got ${data}`,
        },
      });

      await promise;
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.title).toBe('Got 42');
    });

    it('applies message, icon and description from a success object', async () => {
      const promise = Promise.resolve('ok');
      toastStore.addToast({
        message: 'Loading…',
        promiseData: {
          promise,
          success: {
            message: 'Saved!',
            icon: 'check',
            description: 'Changes persisted',
          },
        },
      });

      await promise;
      await flush();

      const toast = toastStore.getSnapshot().toasts[0];
      expect(toast?.title).toBe('Saved!');
      expect(toast?.icon).toBe('check');
      expect(toast?.description).toBe('Changes persisted');
    });

    it('calls the description function with the resolved data', async () => {
      const promise = Promise.resolve('alex');
      toastStore.addToast({
        message: 'Loading…',
        promiseData: {
          promise,
          success: 'Done',
          description: (data) => `Welcome, ${data}`,
        },
      });

      await promise;
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.description).toBe(
        'Welcome, alex'
      );
    });

    it('swaps to the error message when the promise rejects', async () => {
      const promise = Promise.reject(new Error('boom'));
      toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise, error: 'Failed.' },
      });

      await promise.catch(() => undefined);
      await flush();

      const toast = toastStore.getSnapshot().toasts[0];
      expect(toast?.title).toBe('Failed.');
      expect(toast?.promiseData).toBeUndefined();
    });

    it('passes the rejection reason to the error function', async () => {
      const promise = Promise.reject(new Error('boom'));
      toastStore.addToast({
        message: 'Loading…',
        promiseData: {
          promise,
          error: (error) => `Error: ${(error as Error).message}`,
        },
      });

      await promise.catch(() => undefined);
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.title).toBe('Error: boom');
    });

    it('dismisses the toast when there is no success message', async () => {
      const promise = Promise.resolve('ok');
      toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise },
      });

      await promise;
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(true);
    });

    it('dismisses the toast when it rejects without an error handler', async () => {
      const promise = Promise.reject(new Error('boom'));
      toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise },
      });

      await promise.catch(() => undefined);
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.removed).toBe(true);
    });

    it('uses the HTTP status message for failed responses', async () => {
      const promise = Promise.resolve({ ok: false, status: 500 });
      toastStore.addToast({
        message: 'Loading…',
        promiseData: {
          promise,
          success: 'Should not happen',
          error: (msg) => `Custom: ${msg}`,
        },
      });

      await promise;
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.title).toBe(
        'Custom: HTTP error! status: 500'
      );
    });

    it('uses the success message for ok responses', async () => {
      const promise = Promise.resolve({ ok: true, status: 200 });
      toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise, success: 'All good' },
      });

      await promise;
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.title).toBe('All good');
    });

    it('renders a React element as the resolved message', async () => {
      const element = createElement('span', null, 'element-message');
      const promise = Promise.resolve(element);
      toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise },
      });

      await promise;
      await flush();

      expect(toastStore.getSnapshot().toasts[0]?.title).toBe(element);
    });

    it('calls the finally callback', async () => {
      const onFinally = jest.fn();
      const promise = Promise.resolve('ok');
      toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise, success: 'Done', finally: onFinally },
      });

      await promise;
      await flush();

      expect(onFinally).toHaveBeenCalledTimes(1);
    });

    it('revives a dismissed toast when the promise resolves in time', async () => {
      // dismissToast keeps the toast around for the unmount delay. If the
      // promise settles inside that window, the update path revives it.
      const promise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 50);
      });
      const id = toastStore.addToast({
        message: 'Loading…',
        promiseData: { promise, success: 'Done' },
      });
      toastStore.dismissToast(id);

      jest.useFakeTimers();
      jest.advanceTimersByTime(100);
      jest.useRealTimers();
      await promise;
      await flush();

      const toast = toastStore.getSnapshot().toasts.find((t) => t.id === id);
      expect(toast?.removed).toBe(false);
      expect(toast?.title).toBe('Done');
    });
  });

  describe('resetForTests', () => {
    it('clears all state', () => {
      toastStore.addToast({ message: 'One' });
      toastStore.addToast({ message: 'Two' });
      toastStore.setToastHeight(1, 50);
      toastStore.setExpanded(true);

      toastStore.resetForTests();

      const state = toastStore.getSnapshot();
      expect(state.toasts).toHaveLength(0);
      expect(state.toastHeights).toEqual({});
      expect(state.isExpanded).toBe(false);
    });
  });
});
