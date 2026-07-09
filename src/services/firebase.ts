import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence, writeBatch, doc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);

// Activation de la persistance hors ligne (Offline Mode pur)
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Multi-tab conflict for offline persistence.");
  } else if (err.code === 'unimplemented') {
    console.warn("Browser context lacks offline persistence support.");
  }
});
export const auth = getAuth();

/**
 * ARCHITECTURE DE SCALE (50% PILOTE - COMPRESSION DES ÉCRITURES)
 * ScalableWriteBuffer (Write-Coalescing Buffer) :
 * À 1 000 000 d'utilisateurs concurrents, écrire dans Firestore à chaque phonème détecté
 * ou score de vocabulaire mis à jour détruit le budget cloud et surcharge la base de données.
 * Cette classe tamponne et fusionne les requêtes d'écriture en arrière-plan, puis commite 
 * sur Firestore via un WriteBatch atomique toutes les 5 secondes ou lorsque le buffer est plein (max 50 documents).
 * Résultat : De 50 requêtes d'écriture individuelles, on passe à 1 seule opération groupée ultra-rapide.
 */
class ScalableWriteBuffer {
  private queue: Map<string, any> = new Map(); // docPath -> merged payload
  private timeoutId: NodeJS.Timeout | null = null;
  private maxBatchSize = 50; // Limite théorique et pratique de Firestore WriteBatch
  private flushIntervalMs = 5000; // 5 secondes de debounce

  public async queueWrite(collectionName: string, docId: string, data: any) {
    const docPath = `${collectionName}/${docId}`;
    
    // Fusion intelligente : si le même document est modifié plusieurs fois de suite,
    // on fusionne les champs mis à jour localement avant de l'envoyer au réseau.
    const existing = this.queue.get(docPath) || {};
    this.queue.set(docPath, {
      collectionName,
      docId,
      payload: { ...existing.payload, ...data, syncedAt: new Date().toISOString() }
    });

    console.log(`[SCALING_BUFFER] Document ${docPath} mis en cache tampon. Taille file : ${this.queue.size}`);

    // Si on dépasse la taille max tolérée, on flush immédiatement sans attendre le timer
    if (this.queue.size >= this.maxBatchSize) {
      await this.flush();
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.timeoutId) return;
    this.timeoutId = setTimeout(async () => {
      await this.flush();
    }, this.flushIntervalMs);
  }

  public async flush(): Promise<void> {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    if (this.queue.size === 0) return;

    console.log(`[SCALING_BUFFER] Début de la fusion et du flush de ${this.queue.size} écritures vers Firestore...`);
    const batch = writeBatch(db);
    const transientQueue = Array.from(this.queue.values());
    this.queue.clear();

    try {
      for (const item of transientQueue) {
        const docRef = doc(db, item.collectionName, item.docId);
        // Utilisation de merge: true pour préserver les autres états
        batch.set(docRef, item.payload, { merge: true });
      }

      await batch.commit();
      console.log(`[SCALING_BUFFER] [SUCCESS] Consolidé et persisté ${transientQueue.length} documents en 1 seul batch atomique.`);
    } catch (error) {
      console.error("[SCALING_BUFFER] [ERROR] Échec lors du flush du batch :", error);
      // Remettre dans la file locale en cas d'erreur réseau pour garantir la tolérance aux pannes
      for (const item of transientQueue) {
        const docPath = `${item.collectionName}/${item.docId}`;
        this.queue.set(docPath, item);
      }
    }
  }
}

export const dbBatcher = new ScalableWriteBuffer();
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Connexion annulée par l\'utilisateur.');
      return null;
    }
    console.error("Erreur de connexion:", error);
    throw error;
  }
};

let cachedAccessToken: string | null = null;

export const connectGmail = async (): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    // Add required Gmail scopes
    provider.addScope('https://www.googleapis.com/auth/gmail.compose');
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }
    cachedAccessToken = credential.accessToken;
    return cachedAccessToken;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Connexion Gmail annulée.');
      return null;
    }
    console.error("Erreur d'autorisation Gmail:", error);
    throw error;
  }
};

export const getCachedAccessToken = () => cachedAccessToken;

// Clear cached token on state changes
let cachedClassroomToken: string | null = null;

export const connectClassroom = async (): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    // Add requested Classroom scopes
    provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.coursework.students');
    provider.addScope('https://www.googleapis.com/auth/classroom.courseworkmaterials');
    provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
    provider.addScope('https://www.googleapis.com/auth/classroom.rosters.readonly');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }
    cachedClassroomToken = credential.accessToken;
    return cachedClassroomToken;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Connexion Classroom annulée.');
      return null;
    }
    console.error("Erreur d'autorisation Classroom:", error);
    throw error;
  }
};

export const getCachedClassroomToken = () => cachedClassroomToken;

auth.onAuthStateChanged((user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedClassroomToken = null;
  }
});

export const logout = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    cachedClassroomToken = null;
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    throw error;
  }
};

