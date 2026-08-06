import { Text } from 'react-native';
import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react-native';
import { Toaster, toast } from '../index';
import { toastStore } from '../store';

const findToast = (text: string) =>
  screen.findByText(text, { includeHiddenElements: true });
const queryToast = (text: string) =>
  screen.queryByText(text, { includeHiddenElements: true });

describe('Toaster', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    toastStore.resetForTests();
  });

  afterEach(() => {
    jest.useRealTimers();
    toastStore.resetForTests();
  });

  it('renders a toast with its message', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Hello, world!');
    });

    expect(await findToast('Hello, world!')).toBeOnTheScreen();
  });

  it('renders the description below the title', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Changes saved', { description: 'Your changes were persisted.' });
    });

    expect(await findToast('Changes saved')).toBeOnTheScreen();
    expect(await findToast('Your changes were persisted.')).toBeOnTheScreen();
  });

  it('renders multiple toasts', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Toast one');
      toast('Toast two');
      toast('Toast three');
    });

    expect(await findToast('Toast one')).toBeOnTheScreen();
    expect(await findToast('Toast two')).toBeOnTheScreen();
    expect(await findToast('Toast three')).toBeOnTheScreen();
  });

  it('auto-dismisses after the duration', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Short lived', { duration: 1000 });
    });

    await waitFor(
      () => {
        expect(queryToast('Short lived')).not.toBeOnTheScreen();
      },
      { timeout: 3000 }
    );
  });

  it('does not auto-dismiss Infinity toasts', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Forever', { duration: Infinity });
    });

    jest.advanceTimersByTime(5000);
    expect(queryToast('Forever')).toBeOnTheScreen();
  });

  it('dismisses all toasts with toast.dismiss()', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Toast A');
      toast('Toast B');
    });
    await act(() => {
      toast.dismiss();
    });

    await waitForElementToBeRemoved(() => queryToast('Toast A'));
    expect(queryToast('Toast B')).not.toBeOnTheScreen();
  });

  it('dismisses a single toast by id', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Keep me');
      toast('Remove me', { id: 500 });
    });

    await act(() => {
      toast.dismiss(500);
    });

    await waitForElementToBeRemoved(() => queryToast('Remove me'));
    expect(queryToast('Keep me')).toBeOnTheScreen();
  });

  it('updates a toast in place when the same id is used', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('Before update', { id: 42 });
    });
    await act(() => {
      toast('After update', { id: 42 });
    });

    expect(await findToast('After update')).toBeOnTheScreen();
    expect(queryToast('Before update')).not.toBeOnTheScreen();
  });

  it('swaps promise loading to the success message', async () => {
    await render(<Toaster />);
    let resolve!: (value: string) => void;
    const promise = new Promise<string>((r) => {
      resolve = r;
    });

    await act(() => {
      toast.promise(promise, {
        loading: 'Loading…',
        success: (data) => `Done: ${data}`,
        error: 'Failed.',
      });
    });

    expect(await findToast('Loading…')).toBeOnTheScreen();

    await act(async () => {
      resolve('data');
    });

    expect(await findToast('Done: data')).toBeOnTheScreen();
    expect(queryToast('Loading…')).not.toBeOnTheScreen();
  });

  it('swaps promise loading to the error message', async () => {
    await render(<Toaster />);
    let reject!: (error: Error) => void;
    const promise = new Promise<string>((_, rj) => {
      reject = rj;
    });

    await act(() => {
      toast.promise(promise, {
        loading: 'Loading…',
        success: 'Won the lottery',
        error: { message: 'Failed.', icon: <Text>⚠️</Text> },
      });
    });

    await act(async () => {
      reject(new Error('boom'));
    });

    expect(await findToast('Failed.')).toBeOnTheScreen();
    expect(queryToast('Won the lottery')).not.toBeOnTheScreen();
  });

  it('renders custom JSX toasts', async () => {
    await render(<Toaster />);
    await act(() => {
      toast.custom(<Text testID="custom-node">Custom content</Text>);
    });

    expect(await findToast('Custom content')).toBeOnTheScreen();
  });

  it('dismisses a toast via the close button', async () => {
    const user = userEvent.setup();
    await render(<Toaster closeButton />);
    await act(() => {
      toast('Close me');
    });

    const closeButton = await screen.findByRole('button', {
      name: 'Close toast',
    });
    await user.press(closeButton);

    await waitForElementToBeRemoved(() => queryToast('Close me'));
  });

  it('does not render a close button when closeButton is off', async () => {
    await render(<Toaster />);
    await act(() => {
      toast('No close');
    });
    await findToast('No close');

    expect(screen.queryByRole('button', { name: 'Close toast' })).toBeNull();
  });
});
