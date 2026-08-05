import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence, writeBatch, doc } from 'firebase/firestore';
import fallbackFirebaseConfig from '../../firebase-applet-config.json';

// Configuration Firebase dynamique prioritaire via variables d'environnement (Vite / process.env)
const activeFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackFirebaseConfig.authDomain,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackFirebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackFirebaseConfig.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackFirebaseConfig.measurementId || "",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || (fallbackFirebaseConfig as any).firestoreDatabaseId || ""
};

const app = initializeApp(activeFirebaseConfig);
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId || undefined);

// Activation de la persistance hors ligne (Offline Mode pur)
enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Multi-tab conflict for offline persistence.");
  } else if (err.code === 'unimplemented') {
    console.warn("Browser context lacks offline persistence support.");
  }
});
export const auth = getAuth();

// Gérer le retour de redirection Google Auth (essentiel pour mobiles & iframes)
getRedirectResult(auth)
  .then((result) => {
    if (result) {
      console.log('⚡ [AUTH] Retour de redirection résolu pour :', result.user?.email);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        console.log('🔑 [AUTH] Access Token récupéré via redirection Google Auth');
        cachedAccessToken = credential.accessToken;
        cachedWorkspaceToken = credential.accessToken;
        cachedClassroomToken = credential.accessToken;
        localStorage.setItem('google_access_token', credential.accessToken);
        localStorage.setItem('google_workspace_token', credential.accessToken);
        localStorage.setItem('google_classroom_token', credential.accessToken);
      }
    }
  })
  .catch((err) => {
    console.warn("⚠️ [AUTH] Erreur lors de la vérification de Redirect Result:", err);
  });

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
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.addScope('https://www.googleapis.com/auth/documents');
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/presentations');
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.addScope('https://www.googleapis.com/auth/tasks');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
googleProvider.addScope('https://www.googleapis.com/auth/classroom.announcements');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.compose');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.send');
googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');

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

export function isOfflineError(error: unknown): boolean {
  if (!error) return false;
  
  // Si c'est une string
  if (typeof error === 'string') {
    return error.toLowerCase().includes('offline');
  }
  
  // Si c'est un objet (comme une instance de FirebaseError)
  if (typeof error === 'object') {
    const errObj = error as any;
    
    // Vérification de la propriété message
    if ('message' in errObj && String(errObj.message).toLowerCase().includes('offline')) {
      return true;
    }
    
    // Vérification de la propriété error (notre format d'erreur encapsulée)
    if ('error' in errObj && String(errObj.error).toLowerCase().includes('offline')) {
      return true;
    }
    
    // Vérification de la propriété code (Firestore utilise 'unavailable' ou 'failed-precondition' lors de coupures réseau)
    if ('code' in errObj && (
      String(errObj.code).toLowerCase().includes('unavailable') || 
      String(errObj.code).toLowerCase().includes('offline')
    )) {
      return true;
    }

    // fallback sur l'inspection de toutes les clés de niveau 1 de l'objet pour chercher 'offline'
    try {
      for (const key of Object.keys(errObj)) {
        if (typeof errObj[key] === 'string' && errObj[key].toLowerCase().includes('offline')) {
          return true;
        }
      }
    } catch (_) {
      // Ignorer si l'inspection de clés échoue
    }
  }

  // Vérification de la représentation chaîne standard
  try {
    if (String(error).toLowerCase().includes('offline')) {
      return true;
    }
  } catch (_) {}
  
  return false;
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  let errMsg = "";
  if (error && typeof error === 'object') {
    if ('message' in error) {
      errMsg = String((error as any).message);
    } else if ('error' in error) {
      errMsg = String((error as any).error);
    } else {
      errMsg = String(error);
    }
  } else {
    errMsg = String(error);
  }

  const isOffline = isOfflineError(error);

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
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

  if (isOffline) {
    console.warn('[FIREBASE_OFFLINE] Firestore est en attente de connexion réseau (Offline Mode actif) :', JSON.stringify(errInfo));
    return;
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Détection d'appareils mobiles
export const isMobileOrIframe = (): boolean => {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
  return isMobile;
};

export const loginWithGoogle = async () => {
  try {
    console.log("💻 [AUTH] Utilisation de signInWithPopup...");
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      cachedWorkspaceToken = credential.accessToken;
      cachedClassroomToken = credential.accessToken;
      localStorage.setItem('google_access_token', credential.accessToken);
      localStorage.setItem('google_workspace_token', credential.accessToken);
      localStorage.setItem('google_classroom_token', credential.accessToken);
    }
    return result.user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Connexion annulée par l\'utilisateur.');
      return null;
    }
    if (error.code === 'auth/popup-blocked' || error.message?.includes('popup') || error.code === 'auth/cancelled-popup-request') {
      // Si nous ne sommes pas dans une iframe, tenter le redirect. Sinon, informer l'utilisateur.
      if (window.self === window.top) {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } else {
        throw new Error("Les popups sont bloqués par votre navigateur. Veuillez autoriser les popups ou ouvrir l'application dans un nouvel onglet.");
      }
    }
    console.error("Erreur de connexion:", error);
    throw error;
  }
};

let cachedAccessToken: string | null = null;

export const connectGmail = async (): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.compose');
    provider.addScope('https://www.googleapis.com/auth/gmail.send');
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }
    cachedAccessToken = credential.accessToken;
    localStorage.setItem('google_access_token', credential.accessToken);
    return cachedAccessToken;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Connexion Gmail annulée.');
      return null;
    }
    if (error.code === 'auth/popup-blocked' || error.message?.includes('popup')) {
      if (window.self === window.top) {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/gmail.compose');
        provider.addScope('https://www.googleapis.com/auth/gmail.send');
        provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
        await signInWithRedirect(auth, provider);
        return null;
      } else {
        throw new Error("Les fenêtres surgissantes (popups) sont bloquées par le navigateur. Veuillez autoriser les popups pour vous connecter à Gmail.");
      }
    }
    console.error("Erreur d'autorisation Gmail:", error);
    throw error;
  }
};

export const getCachedAccessToken = () => cachedAccessToken || localStorage.getItem('google_access_token');

// Clear cached token on state changes
let cachedClassroomToken: string | null = null;

export const connectClassroom = async (): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
    provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
    
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth Provider');
    }
    cachedClassroomToken = credential.accessToken;
    localStorage.setItem('google_classroom_token', credential.accessToken);
    return cachedClassroomToken;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Connexion Classroom annulée.');
      return null;
    }
    if (error.code === 'auth/popup-blocked' || error.message?.includes('popup')) {
      if (window.self === window.top) {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/classroom.courses.readonly');
        provider.addScope('https://www.googleapis.com/auth/classroom.announcements');
        await signInWithRedirect(auth, provider);
        return null;
      } else {
        throw new Error("Les fenêtres surgissantes (popups) sont bloquées par le navigateur. Veuillez autoriser les popups pour vous connecter à Classroom.");
      }
    }
    console.error("Erreur d'autorisation Classroom:", error);
    throw error;
  }
};

export const getCachedClassroomToken = () => cachedClassroomToken || localStorage.getItem('google_classroom_token') || localStorage.getItem('google_access_token');

let cachedWorkspaceToken: string | null = null;

export const connectGoogleWorkspace = async (forceReauth = false): Promise<string | null> => {
  try {
    const provider = new GoogleAuthProvider();
    // Scope non-restreint optimal (Création et édition de fichiers uniquement créés par l'app)
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    provider.addScope('https://www.googleapis.com/auth/documents');
    provider.addScope('https://www.googleapis.com/auth/calendar.events');
    provider.addScope('https://www.googleapis.com/auth/tasks');

    if (forceReauth) {
      provider.setCustomParameters({ prompt: 'consent select_account' });
    }

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossible d\'obtenir le jeton d\'accès Google OAuth');
    }
    cachedWorkspaceToken = credential.accessToken;
    cachedAccessToken = credential.accessToken;
    localStorage.setItem('google_workspace_token', credential.accessToken);
    localStorage.setItem('google_access_token', credential.accessToken);
    return cachedWorkspaceToken;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Connexion Workspace annulée.');
      return null;
    }
    if (error.code === 'auth/popup-blocked' || error.message?.includes('popup')) {
      if (window.self === window.top) {
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        provider.addScope('https://www.googleapis.com/auth/documents');
        provider.addScope('https://www.googleapis.com/auth/calendar.events');
        provider.addScope('https://www.googleapis.com/auth/tasks');
        if (forceReauth) {
          provider.setCustomParameters({ prompt: 'consent select_account' });
        }
        await signInWithRedirect(auth, provider);
        return null;
      } else {
        throw new Error("Les fenêtres surgissantes (popups) sont bloquées par votre navigateur. Veuillez autoriser les popups pour autoriser Google Workspace.");
      }
    }
    console.error("Erreur d'autorisation Google Workspace:", error);
    throw error;
  }
};

export const getCachedWorkspaceToken = () => 
  cachedWorkspaceToken || 
  localStorage.getItem('google_workspace_token') || 
  cachedAccessToken || 
  localStorage.getItem('google_access_token');

auth.onAuthStateChanged((user) => {
  if (!user) {
    cachedAccessToken = null;
    cachedClassroomToken = null;
    cachedWorkspaceToken = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_classroom_token');
    localStorage.removeItem('google_workspace_token');
  }
});

export const logout = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    cachedClassroomToken = null;
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_classroom_token');
  } catch (error) {
    console.error("Erreur de déconnexion:", error);
    throw error;
  }
};

