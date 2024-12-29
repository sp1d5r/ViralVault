import {
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  Auth,
} from 'firebase/auth';
import AuthService from '../AuthenticationInterface';
import { getFirebaseApp } from '../../../config/firebaseConfig';
import { User } from '../../../types/User';

// Replace the module-level auth with a getter
let authInstance: Auth | null = null;

const getAuthInstance = (): Auth => {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
};

const mapFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  const token = await firebaseUser.getIdToken();
  return {
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || '',
    email: firebaseUser.email || '',
    token,
  };
};

const FirebaseAuthService: AuthService = {
  async login(email: string, password: string) {
    const auth = getAuthInstance();
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return mapFirebaseUserToUser(userCredential.user);
  },

  async register(email: string, name: string, password: string) {
    const auth = getAuthInstance();
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (userCredential.user) {
      await updateProfile(userCredential.user, {
        displayName: name,
      });
    }
    return mapFirebaseUserToUser(userCredential.user);
  },

  async logout() {
    const auth = getAuthInstance();
    await signOut(auth);
  },

  onAuthStateChanged(callback: (user: User | null) => void) {
    const auth = getAuthInstance();
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const user = await mapFirebaseUserToUser(firebaseUser);
        callback(user);
      } else {
        callback(null);
      }
    });
  },

  async loginWithGoogle() {
    const auth = getAuthInstance();
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    return mapFirebaseUserToUser(userCredential.user);
  },

  async resetPassword(email: string) {
    const auth = getAuthInstance();
    await sendPasswordResetEmail(auth, email);
  },

  async getToken(): Promise<string | null> {
    const auth = getAuthInstance();
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return currentUser.getIdToken();
  },

  async refreshToken(): Promise<string | null> {
    const auth = getAuthInstance();
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    return currentUser.getIdToken(true); // Force refresh the token
  },
};

export { FirebaseAuthService };