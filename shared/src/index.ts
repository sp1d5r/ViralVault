
export interface ApiResponse<T> {
  data: T;
  message: string;
}

export * from './config/firebaseConfig';

export * from './services/database/strategies/FirebaseFirestoreService';
export * from './services/authentication/strategies/FirebaseAuthService';
export * from './services/storage/strategies/FirebaseStorageService';
export * from './services/claude/ClaudeService';

export * from './types/Article';
export * from './types/User';
export * from './types/UserProfile';
export * from './types/Plans';
export * from './types/Post';
export * from './types/Analyse';