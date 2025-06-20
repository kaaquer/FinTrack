import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
} from 'react-native';
import { getCustomAlertState, registerAlertStateCallback, unregisterAlertStateCallback } from '../utils/alertUtils';

const CustomAlert: React.FC = () => {
  const [alertState, setAlertState] = useState(getCustomAlertState());

  useEffect(() => {
    const updateState = () => {
      setAlertState(getCustomAlertState());
    };
    
    registerAlertStateCallback(updateState);
    
    return () => {
      unregisterAlertStateCallback();
    };
  }, []);

  useEffect(() => {
    if (
      alertState.visible &&
      alertState.options &&
      alertState.options.title === 'Success'
    ) {
      const timer = setTimeout(() => {
        console.log('Auto-dismissing success alert');
        alertState.onClose();
      }, 2000); // 2 seconds

      return () => clearTimeout(timer);
    }
  }, [alertState]);

  // Render the Modal only when alertState.visible is true
  if (!alertState.visible || !alertState.options) {
    return null;
  }
  
  const { title, message, buttons = [{ text: 'OK' }] } = alertState.options;

  const handleButtonPress = (button: any) => {
    console.log('Button pressed:', button.text);
    if (button.onPress) {
      button.onPress();
    }
    console.log('Calling alertState.onClose()');
    alertState.onClose();
  };

  return (
    <Modal
      visible={true} // Modal is always visible when rendered
      transparent={true}
      animationType="fade"
      onRequestClose={alertState.onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={[
            styles.buttonContainer,
            buttons.length > 2 && styles.buttonContainerVertical
          ]}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'destructive' && styles.destructiveButton,
                  button.style === 'cancel' && styles.cancelButton,
                  buttons.length > 2 && styles.buttonFullWidth,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveButtonText,
                    button.style === 'cancel' && styles.cancelButtonText,
                  ]}
                >
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonContainerVertical: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  buttonFullWidth: {
    flex: 1,
  },
  destructiveButton: {
    backgroundColor: '#DC2626',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#374151',
  },
});

export default CustomAlert; 