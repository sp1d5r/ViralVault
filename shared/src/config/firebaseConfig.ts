import { FirebaseApp, initializeApp } from 'firebase/app';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

let app: FirebaseApp | null = null;

export const initializeFirebase = (config: FirebaseConfig) => {
  if (!app) {
    app = initializeApp(config);
  }
  return app;
};

export const getFirebaseApp = () => {
  if (!app) {
    throw new Error('Firebase not initialized. Call initializeFirebase first.');
  }
  return app;
};
