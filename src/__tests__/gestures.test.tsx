import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ToastSwipeHandler } from '../gestures';

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
