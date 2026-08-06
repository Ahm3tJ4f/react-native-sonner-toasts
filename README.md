# react-native-sonner-toasts

A lightweight, Sonner-inspired, zero-dependency toast library for React Native applications.

## Installation

```sh
npm install react-native-sonner-toasts
```

```sh
yarn add react-native-sonner-toasts
```

## Usage

Add the `<Toaster />` component once at the root of your app, then call `toast()` from anywhere.

```tsx
import { Toaster, toast } from 'react-native-sonner-toasts';

export default function App() {
  return (
    <>
      <YourApp />
      <Toaster />
    </>
  );
}

function YourApp() {
  return (
    <Button
      title="Show toast"
      onPress={() => toast('Hello from react-native-sonner-toasts!')}
    />
  );
}
```

## API

### `<Toaster />`

Render this once near the root of your app.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `'top-center' \| 'bottom-center'` | `'bottom-center'` | Where toasts appear. |
| `visibleToasts` | `number` | `3` | How many toasts are visible at once. |
| `gap` | `number` | `12` | Gap between stacked toasts. |
| `offset` | `number` | `40` or `safeAreaInsets + 8` | Distance from the top or bottom edge. |
| `theme` | `'light' \| 'dark' \| 'system'` | `'light'` | Color theme. |
| `duration` | `number` | `3000` | Default duration for auto-closing toasts. Use `Infinity` to keep a toast on screen forever. |
| `expand` | `boolean` | `false` | Toasts start expanded. While expanded, auto-close timers pause. Tapping a toast toggles the expanded state. |
| `closeButton` | `boolean` | `false` | Show a close button on every toast. |
| `safeAreaInsets` | `{ top: number; bottom: number }` | | Override safe area values when used with `position`. |

### `toast(message, options?)`

Show a simple toast.

```tsx
import { toast } from 'react-native-sonner-toasts';

toast('Event created', {
  description: 'It will be visible in your calendar.',
  duration: 4000,
});
```

### `toast.custom(jsx, options?)`

Show a fully custom toast.

```tsx
toast.custom(
  <View style={{ padding: 16 }}>
    <Text>Custom toast content</Text>
  </View>,
  { duration: 5000 }
);
```

### `toast.promise(promise, options?)`

Show a loading toast while a promise resolves.

```tsx
toast.promise(
  fetch('/api/save').then((res) => res.json()),
  {
    loading: 'Saving...',
    success: 'Saved!',
    error: 'Could not save.',
  }
);
```

You can also use functions for dynamic messages.

```tsx
toast.promise(
  fetch('/api/user'),
  {
    loading: 'Loading user...',
    success: (data) => `Hello, ${data.name}!`,
    error: 'Failed to load user.',
  }
);
```

A function `description` is resolved for each state with the same data as the message.

```tsx
toast.promise(fetch('/api/user'), {
  loading: 'Loading user...',
  description: (data) => `id: ${data.id}`,
  success: 'Loaded!',
});
```

`finally` runs when the promise settles, whether it resolved or rejected.

```tsx
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Could not save.',
  finally: () => console.log('done'),
});
```

If `success` is missing and the promise resolves, the toast dismisses. If `error` is missing and the promise rejects, the toast dismisses. A non-ok HTTP response (for example a `fetch` result with status 500) is treated as an error.

The returned object contains the toast id and an `unwrap` function to access the original promise.

```tsx
const { id, unwrap } = toast.promise(saveData(), { success: 'Saved!' });
const data = await unwrap();
```

### `toast.dismiss(id?)`

Dismiss a toast by id. If no id is given, all visible toasts are dismissed.

```tsx
const id = toast('Hello');
toast.dismiss(id);

// Dismiss everything
toast.dismiss();
```

## Styling

Pass `styles` in the toast options to override parts of the toast.

```tsx
toast('Hello', {
  styles: {
    toast: { backgroundColor: '#000' },
    title: { color: '#fff' },
  },
});
```

Available style keys: `toastContainer`, `toast`, `toastContent`, `textContainer`, `title`, `description`, `closeButton`, `closeButtonIcon`.

Toasts render their shadow with the cross-platform `boxShadow` style (React Native 0.76+). It looks the same on iOS and Android, and you position it explicitly.

```tsx
toast('Hello', {
  styles: {
    toast: { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
  },
});
```

On older React Native versions, `boxShadow` is ignored and `elevation` plus the iOS `shadow*` props are used instead.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT
