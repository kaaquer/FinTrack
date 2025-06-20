import { Alert, Platform } from 'react-native';

interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertOptions {
  title: string;
  message: string;
  buttons?: AlertButton[];
  cancelable?: boolean;
}

// Global state for custom alert
let customAlertState: {
  visible: boolean;
  options: AlertOptions | null;
  onClose: () => void;
  resolvePromise: ((value?: any) => void) | null;
} = {
  visible: false,
  options: null,
  onClose: () => {},
  resolvePromise: null,
};

// Callback to trigger re-render
let stateUpdateCallback: (() => void) | null = null;

// Function to set custom alert state (used by CustomAlert component)
export const setCustomAlertState = (state: typeof customAlertState) => {
  customAlertState = { ...state }; // Always create a new object
};

// Function to get custom alert state (used by CustomAlert component)
export const getCustomAlertState = () => customAlertState;

// Function to register state update callback
export const registerAlertStateCallback = (callback: () => void) => {
  stateUpdateCallback = callback;
};

// Function to unregister state update callback
export const unregisterAlertStateCallback = () => {
  stateUpdateCallback = null;
};

// Unified alert function - now returns a Promise
export const showAlert = (options: AlertOptions): Promise<void> => {
  return new Promise((resolve) => {
    if (Platform.OS === 'web') {
      // Use custom alert for web
      console.log('showAlert: Showing custom alert (web)');
      customAlertState = {
        visible: true,
        options,
        onClose: () => {
          console.log('showAlert: onClose triggered, hiding alert (web)');
          customAlertState = {
            ...customAlertState,
            visible: false,
            options: null,
          };
          if (stateUpdateCallback) {
            stateUpdateCallback(); // Trigger re-render to hide modal
          }
          // Resolve the promise immediately after hiding the alert
          if (customAlertState.resolvePromise) {
            customAlertState.resolvePromise();
            customAlertState.resolvePromise = null; // Clear resolver
          }
        },
        resolvePromise: resolve, // Store the promise resolver
      };
      // Trigger re-render immediately for visibility
      if (stateUpdateCallback) {
        stateUpdateCallback();
      }
    } else {
      // Use native Alert for mobile
      console.log('showAlert: Showing native alert (mobile)');
      Alert.alert(options.title, options.message, [
        ...(options.buttons || []).map(button => ({
          ...button,
          onPress: () => {
            if (button.onPress) {
              button.onPress(); // Execute original onPress if provided
            }
            resolve(); // Resolve promise after native alert action
          }
        }))
      ], {
        cancelable: options.cancelable !== false,
        onDismiss: () => { // For cancellable alerts dismissed by backdrop tap
          resolve();
        }
      });
    }
  });
};

// Convenience functions (now use await for showAlert)

export const showConfirmAlert = async (
  title: string,
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
): Promise<void> => {
  await showAlert({
    title,
    message,
    buttons: [
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: onCancel,
      },
      {
        text: 'Confirm',
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
  });
};

export const showSuccessAlert = async (
  title: string,
  message: string,
  onOk?: () => void
): Promise<void> => {
  await showAlert({
    title,
    message,
    buttons: [
      {
        text: 'OK',
        onPress: onOk, // Pass the original onOk directly
      },
    ],
  });
};

export const showErrorAlert = async (
  title: string,
  message: string,
  onOk?: () => void
): Promise<void> => {
  await showAlert({
    title,
    message,
    buttons: [
      {
        text: 'OK',
        onPress: onOk, // Pass the original onOk directly
      },
    ],
  });
};