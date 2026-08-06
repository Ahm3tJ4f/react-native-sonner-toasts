import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ToastSwipeHandler } from '../gestures';

// NOTE: RNTL cannot simulate PanResponder responder events. Its event gate
// calls onMoveShouldSetResponder() with no arguments, while the PanResponder
// handlers here require a gestureState (they read gs.dx / gs.dy), so
// responderEvent simulation throws. These tests therefore cover rendering
// only; the gesture decision logic is exercised manually on device.
describe('ToastSwipeHandler', () => {
  it('renders its children', async () => {
    await render(
      <ToastSwipeHandler onDismiss={jest.fn()}>
        <Text>Swipe me</Text>
      </ToastSwipeHandler>
    );

    expect(screen.getByText('Swipe me')).toBeOnTheScreen();
  });

  it('renders children when disabled', async () => {
    await render(
      <ToastSwipeHandler onDismiss={jest.fn()} enabled={false}>
        <Text>Still visible</Text>
      </ToastSwipeHandler>
    );

    expect(screen.getByText('Still visible')).toBeOnTheScreen();
  });

  it('renders children for the up direction', async () => {
    await render(
      <ToastSwipeHandler onDismiss={jest.fn()} direction="up">
        <Text>Vertical</Text>
      </ToastSwipeHandler>
    );

    expect(screen.getByText('Vertical')).toBeOnTheScreen();
  });
});
