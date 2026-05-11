import * as LocalAuthentication from 'expo-local-authentication';
import { useState, useEffect } from 'react';

// This hook handles all biometric logic
// Any screen can use it by importing it

export function useBiometrics() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkSupport();
  }, []);

  // Check if device supports biometrics
  async function checkSupport() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsSupported(compatible && enrolled);
    setIsChecking(false);
  }

  async function authenticate() {
    // If device doesn't support biometrics skip it
    if (!isSupported) {
      setIsAuthenticated(true);
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Verify it\'s you to open Float',
      fallbackLabel: 'Use passcode',
      disableDeviceFallback: false,
    });

    if (result.success) {
      setIsAuthenticated(true);
      return true;
    }

    return false;
  }

  function reset() {
    setIsAuthenticated(false);
  }

  return {
    isAuthenticated,
    isSupported,
    isChecking,
    authenticate,
    reset,
  };
}