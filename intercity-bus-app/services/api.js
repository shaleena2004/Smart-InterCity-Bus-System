import Constants from 'expo-constants';
import { Platform } from 'react-native';

const getDevHost = () => {
  const manifest = Constants.manifest;
  const hostUri = manifest?.debuggerHost ?? Constants.expoConfig?.hostUri ?? Constants.manifest2?.hostUri;

  if (typeof hostUri === 'string') {
    const host = hostUri.split(':')[0];
    if (host === '127.0.0.1' && Platform.OS === 'android') {
      return '10.0.2.2';
    }
    return host;
  }

  return 'localhost';
};

const LOCAL_IP = '192.168.0.31';
const PORT = '5001';

export const API_BASE = `http://${LOCAL_IP}:${PORT}`;

console.log('API_BASE initialized as:', API_BASE);
