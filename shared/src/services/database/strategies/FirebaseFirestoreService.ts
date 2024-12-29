import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  DocumentReference,
  FirestoreError,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  getFirestore,
  onSnapshot,
  Unsubscribe,
  setDoc,
  WithFieldValue,
  WhereFilterOp,
  OrderByDirection,
} from 'firebase/firestore';
import { getFirebaseApp } from '../../../config/firebaseConfig';
import {
  DatabaseService, FailureCallback, Identifiable, SuccessCallback, UpdateCallback,
} from '../DatabaseInterface';

let dbInstance: ReturnType<typeof getFirestore> | null = null;

const getDb = () => {
  if (!dbInstance) {
    dbInstance = getFirestore(getFirebaseApp());
  }
  return dbInstance;
};

type FilterCondition = {
    field: string;
    operator: WhereFilterOp;
    value: unknown;
};

type QueryResult<T> = T & { id: string };

const FirebaseDatabaseService: DatabaseService = {
  async addDocument<T extends WithFieldValue<DocumentData>>(
    collectionPath: string,
    data: T,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback,
  )
    : Promise<void> {
    try {
      const db = getDb();
      const safeData: WithFieldValue<DocumentData> = data;
      const docRef = await addDoc(collection(db, collectionPath), safeData);
      if (onSuccess) onSuccess(docRef.id);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  },

  async getDocument<T>(
    collectionPath: string,
    docId: string,
    onSuccess?: SuccessCallback<T | null>,
    onFailure?: FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, collectionPath, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        if (onSuccess) onSuccess(docSnap.data() as T);
      } else if (onSuccess) onSuccess(null);
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  },

  async updateDocument<T>(
    collectionPath: string,
    docId: string,
    data: Partial<T>,
    onSuccess?: SuccessCallback<void>,
    onFailure?: FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, data, { merge: true });
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  },

  async deleteDocument(
    collectionPath: string,
    docId: string,
    onSuccess?: SuccessCallback<void>,
    onFailure?: FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onFailure) onFailure(error as Error);
    }
  },

  listenToDocument<T>(
    collectionPath: string,
    docId: string,
    onUpdate: UpdateCallback<T>,
    onError: (error: FirestoreError) => void,
  ): Unsubscribe {
    const db = getDb();
    const documentRef: DocumentReference = doc(db, collectionPath, docId);
    return onSnapshot(
      documentRef,
      (newDoc) => {
        if (newDoc.exists()) {
          onUpdate(newDoc.data() as T);
        }
      },
      onError,
    );
  },

  getNewDocumentID(
    collectionName: string,
    onSuccess?: SuccessCallback<string>,
    onFailure?: FailureCallback,
  ): Promise<string> {
    try {
      const db = getDb();
      const newDocRef = doc(collection(db, collectionName));
      if (onSuccess) onSuccess(newDocRef.id);
      return Promise.resolve(newDocRef.id);
    } catch (error) {
      if (onFailure) onFailure(error as FirestoreError);
      return Promise.reject(error);
    }
  },

  async queryDocumentById<T>(
    collectionPath: string,
    docId: string,
    onSuccess?: SuccessCallback<T>,
    onFailure?: FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const docRef = doc(db, collectionPath, docId);
      const docSnapshot = await getDoc(docRef);
      if (docSnapshot.exists()) {
        const document: QueryResult<T> = { ...docSnapshot.data() as T, id: docSnapshot.id };
        if (onSuccess) onSuccess(document);
      } else {
        throw new Error('Document not found');
      }
    } catch (error) {
      if (onFailure) onFailure(error as FirestoreError);
    }
  },

  async queryDocuments<T>(
    collectionPath: string,
    queryField: string,
    orderByField: string,
    queryValue: unknown,
    onSuccess?:SuccessCallback<T[]>,
    onFailure?:FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const q = query(collection(db, collectionPath), where(queryField, '==', queryValue), orderBy(orderByField));
      const querySnapshot = await getDocs(q);
      const documents: QueryResult<T>[] = [];
      querySnapshot.forEach((queryDoc) => {
        const data = queryDoc.data() as T;
        const result: QueryResult<T> = { ...data, id: queryDoc.id };
        documents.push(result);
      });
      if (onSuccess) onSuccess(documents);
    } catch (error) {
      if (onFailure) onFailure(error as FirestoreError);
    }
  },

  async getRandomDocument<T>(
    collectionPath: string,
    onSuccess?: SuccessCallback<T | null>,
    onFailure?: FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const q = query(collection(db, collectionPath));
      const querySnapshot = await getDocs(q);
      const documents: QueryResult<T>[] = [];
      querySnapshot.forEach((queryDoc) => {
        const data = queryDoc.data() as T;
        const result: QueryResult<T> = { ...data, id: queryDoc.id };
        documents.push(result);
      });

      if (documents.length > 0) {
        const randomIndex = Math.floor(Math.random() * documents.length);
        const randomDocument = documents[randomIndex];
        if (onSuccess) onSuccess(randomDocument as T);
      } else if (onSuccess) {
        onSuccess(null); // No documents found
      }
    } catch (error) {
      if (onFailure) onFailure(error as FirestoreError);
    }
  },

  async getAllDocuments<T>(
    collectionPath: string,
    onSuccess?: SuccessCallback<T[]>,
    onFailure?: FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const collectionRef = collection(db, collectionPath);
      const querySnapshot = await getDocs(collectionRef);
      const documents: QueryResult<T>[] = [];
      querySnapshot.forEach((queryDoc) => {
        const data = queryDoc.data() as T;
        const result: QueryResult<T> = { ...data, id: queryDoc.id };
        documents.push(result);
      });
      if (onSuccess) onSuccess(documents);
    } catch (error) {
      if (onFailure) onFailure(error as FirestoreError);
    }
  },

  listenToQuery<T extends Identifiable>(
    collectionPath: string,
    queryField: string,
    queryValue: unknown,
    orderByField: string,
    onUpdate: UpdateCallback<T[]>,
    onError: (error: FirestoreError) => void = (err) => { console.error(err.message); },
  ): Unsubscribe {
    const db = getDb();
    const q = query(
      collection(db, collectionPath),
      where(queryField, '==', queryValue),
      orderBy(orderByField),
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const documents: QueryResult<T>[] = [];
        querySnapshot.forEach((queryDoc) => {
          const data = queryDoc.data() as T;
          const result: QueryResult<T> = { ...data, id: queryDoc.id };
          documents.push(result);
        });
        onUpdate(documents);
      },
      onError,
    );
  },

  async complexQuery<T extends Identifiable>(
    collectionPath: string,
    filters: FilterCondition[],
    orderByFields?: { field: string; direction?: OrderByDirection }[],
    onSuccess?: SuccessCallback<T[]>,
    onFailure?: FailureCallback,
  ): Promise<void> {
    try {
      const db = getDb();
      const collectionRef = collection(db, collectionPath);

      // Start building the query
      let q = query(collectionRef);

      // Apply all filter conditions
      filters.forEach((filter) => {
        q = query(q, where(filter.field, filter.operator, filter.value));
      });

      // Apply all orderBy clauses
      if (orderByFields) {
        orderByFields.forEach((orderByField) => {
          q = query(q, orderBy(orderByField.field, orderByField.direction));
        });
      }

      const querySnapshot = await getDocs(q);
      const documents: QueryResult<T>[] = [];
      querySnapshot.forEach((queryDoc) => {
        const data = queryDoc.data() as T;
        const result: QueryResult<T> = { ...data, id: queryDoc.id };
        documents.push(result);
      });

      if (onSuccess) onSuccess(documents);
    } catch (error) {
      if (onFailure) onFailure(error as FirestoreError);
    }
  },

};

export { FirebaseDatabaseService };
