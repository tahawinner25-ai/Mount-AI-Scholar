/**
 * Copyright 2026 The MediaPipe Authors & Mount AI Scholar.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  GestureRecognizer,
  GestureRecognizerResult,
  DrawingUtils,
  HandLandmarker,
  FilesetResolver,
} from '@mediapipe/tasks-vision';

export interface ClassificationItem {
  label: string;
  score: number;
  categoryName?: string;
  handedness?: string;
  frenchMeaning?: string;
}

export interface GestureRecognizerOptions {
  numHands?: number;
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
  runningMode?: 'IMAGE' | 'VIDEO';
  onResults?: (result: GestureRecognizerResult, items: ClassificationItem[]) => void;
  onError?: (error: any) => void;
}

// Sign Language Dictionaries and Semantic Mappings (LSF / ASL / Gestures)
export const SIGN_LANGUAGE_DICTIONARY: Record<string, { fr: string; en: string; icon: string; description: string }> = {
  'Thumb_Up': { fr: 'Oui / D\'accord / Bravo', en: 'Yes / Good / Well done', icon: '👍', description: 'Pouce levé - Approbation et confirmation' },
  'Thumb_Down': { fr: 'Non / Pas d\'accord', en: 'No / Disagree', icon: '👎', description: 'Pouce baissé - Désaccord ou négation' },
  'Open_Palm': { fr: 'Bonjour / Stop / Calme', en: 'Hello / Stop / Calm', icon: '✋', description: 'Paume ouverte - Salutation ou demande d\'arrêt' },
  'Closed_Fist': { fr: 'Courage / Solidarité / Prêt', en: 'Strength / Ready', icon: '✊', description: 'Poing fermé - Détermination ou lettre S' },
  'Pointing_Up': { fr: 'Attention / Regarde / Un', en: 'Look / One / Attention', icon: '☝️', description: 'Index levé - Pointage ou lettre D' },
  'Victory': { fr: 'Paix / Deux / Victoire', en: 'Peace / Two / Victory', icon: '✌️', description: 'Signe V - Victoire, chiffre 2 ou lettre V' },
  'ILoveYou': { fr: 'Je t\'aime / Fraternité', en: 'I Love You', icon: '🤟', description: 'Signe I Love You universel (Pouce + Index + Auriculaire)' },
  'None': { fr: 'Geste neutre', en: 'Neutral gesture', icon: '🖐️', description: 'Aucun geste répertorié ou transition' }
};

export class GestureRecognizerTask {
  private recognizer: GestureRecognizer | null = null;
  private drawingUtils: DrawingUtils | null = null;
  private numHands = 2;
  private minHandDetectionConfidence = 0.5;
  private minHandPresenceConfidence = 0.5;
  private minTrackingConfidence = 0.5;
  private runningMode: 'IMAGE' | 'VIDEO' = 'VIDEO';
  private onResultsCallback?: (result: GestureRecognizerResult, items: ClassificationItem[]) => void;
  private onErrorCallback?: (error: any) => void;
  private isInitialized = false;

  constructor(options?: GestureRecognizerOptions) {
    if (options) {
      if (options.numHands !== undefined) this.numHands = options.numHands;
      if (options.minHandDetectionConfidence !== undefined) this.minHandDetectionConfidence = options.minHandDetectionConfidence;
      if (options.minHandPresenceConfidence !== undefined) this.minHandPresenceConfidence = options.minHandPresenceConfidence;
      if (options.minTrackingConfidence !== undefined) this.minTrackingConfidence = options.minTrackingConfidence;
      if (options.runningMode !== undefined) this.runningMode = options.runningMode;
      if (options.onResults) this.onResultsCallback = options.onResults;
      if (options.onError) this.onErrorCallback = options.onError;
    }
  }

  public async initialize(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.recognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU',
        },
        numHands: this.numHands,
        minHandDetectionConfidence: this.minHandDetectionConfidence,
        minHandPresenceConfidence: this.minHandPresenceConfidence,
        minTrackingConfidence: this.minTrackingConfidence,
        runningMode: this.runningMode,
      });

      this.isInitialized = true;
      console.log('✅ [MediaPipe SL2T] GestureRecognizerTask initialisé avec succès.');
    } catch (err) {
      console.warn('⚠️ [MediaPipe SL2T] Initialisation GPU échouée, basculement en mode CPU...', err);
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
        this.recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
            delegate: 'CPU',
          },
          numHands: this.numHands,
          minHandDetectionConfidence: this.minHandDetectionConfidence,
          minHandPresenceConfidence: this.minHandPresenceConfidence,
          minTrackingConfidence: this.minTrackingConfidence,
          runningMode: this.runningMode,
        });
        this.isInitialized = true;
        console.log('✅ [MediaPipe SL2T] GestureRecognizerTask (Mode CPU) prêt.');
      } catch (finalErr) {
        console.error('❌ [MediaPipe SL2T] Échec critique du chargement du modèle :', finalErr);
        if (this.onErrorCallback) this.onErrorCallback(finalErr);
        throw finalErr;
      }
    }
  }

  public setOptions(options: Partial<GestureRecognizerOptions>): void {
    if (options.numHands !== undefined) this.numHands = options.numHands;
    if (options.minHandDetectionConfidence !== undefined) this.minHandDetectionConfidence = options.minHandDetectionConfidence;
    if (options.minHandPresenceConfidence !== undefined) this.minHandPresenceConfidence = options.minHandPresenceConfidence;
    if (options.minTrackingConfidence !== undefined) this.minTrackingConfidence = options.minTrackingConfidence;
    
    if (this.recognizer) {
      this.recognizer.setOptions({
        numHands: this.numHands,
        minHandDetectionConfidence: this.minHandDetectionConfidence,
        minHandPresenceConfidence: this.minHandPresenceConfidence,
        minTrackingConfidence: this.minTrackingConfidence,
      });
    }
  }

  public async setRunningMode(mode: 'IMAGE' | 'VIDEO'): Promise<void> {
    if (this.runningMode !== mode) {
      this.runningMode = mode;
      if (this.recognizer) {
        await this.recognizer.setOptions({ runningMode: mode });
      }
    }
  }

  public detectForVideo(
    videoElement: HTMLVideoElement,
    timestamp: number,
    canvasElement?: HTMLCanvasElement | null
  ): { result: GestureRecognizerResult; items: ClassificationItem[] } | null {
    if (!this.recognizer || !this.isInitialized || videoElement.readyState < 2) {
      return null;
    }

    try {
      const result = this.recognizer.recognizeForVideo(videoElement, timestamp);
      const items = this.extractClassificationItems(result);

      if (canvasElement) {
        this.drawLandmarksOnCanvas(result, canvasElement, videoElement.videoWidth, videoElement.videoHeight);
      }

      if (this.onResultsCallback) {
        this.onResultsCallback(result, items);
      }

      return { result, items };
    } catch (err) {
      console.warn('Erreur recogniseForVideo:', err);
      return null;
    }
  }

  public detectImage(
    imageElement: HTMLImageElement,
    canvasElement?: HTMLCanvasElement | null
  ): { result: GestureRecognizerResult; items: ClassificationItem[] } | null {
    if (!this.recognizer || !this.isInitialized) {
      return null;
    }

    try {
      const result = this.recognizer.recognize(imageElement);
      const items = this.extractClassificationItems(result);

      if (canvasElement) {
        this.drawLandmarksOnCanvas(result, canvasElement, imageElement.naturalWidth, imageElement.naturalHeight);
      }

      if (this.onResultsCallback) {
        this.onResultsCallback(result, items);
      }

      return { result, items };
    } catch (err) {
      console.error('Erreur recognise image:', err);
      return null;
    }
  }

  public drawLandmarksOnCanvas(
    result: GestureRecognizerResult,
    canvasElement: HTMLCanvasElement,
    width: number,
    height: number
  ): void {
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    canvasElement.width = width;
    canvasElement.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    if (result.landmarks && result.landmarks.length > 0) {
      if (!this.drawingUtils) {
        this.drawingUtils = new DrawingUtils(ctx);
      }

      for (const landmark of result.landmarks) {
        // Connectors en vert haute visibilité (#00FF00) conformément aux specs MediaPipe
        this.drawingUtils.drawConnectors(landmark, HandLandmarker.HAND_CONNECTIONS, {
          color: '#00FF00',
          lineWidth: 4,
        });
        // Landmarks points en rouge / cyan (#FF0000)
        this.drawingUtils.drawLandmarks(landmark, {
          color: '#FF0000',
          lineWidth: 2,
          radius: 4,
        });
      }
    }

    ctx.restore();
  }

  public extractClassificationItems(result: GestureRecognizerResult): ClassificationItem[] {
    const items: ClassificationItem[] = [];

    if (result.gestures && result.gestures.length > 0) {
      result.gestures.forEach((gestures, index) => {
        const handedness =
          result.handedness && result.handedness[index]
            ? result.handedness[index][0].displayName
            : `Main ${index + 1}`;
        const topGesture = gestures[0];

        if (topGesture && topGesture.categoryName && topGesture.categoryName !== 'None') {
          const dictEntry = SIGN_LANGUAGE_DICTIONARY[topGesture.categoryName];
          items.push({
            label: `${handedness}: ${topGesture.categoryName}`,
            categoryName: topGesture.categoryName,
            handedness,
            score: topGesture.score,
            frenchMeaning: dictEntry ? dictEntry.fr : topGesture.categoryName,
          });
        }
      });
    }

    return items;
  }

  public cleanup(): void {
    if (this.recognizer) {
      this.recognizer.close();
      this.recognizer = null;
    }
    this.drawingUtils = null;
    this.isInitialized = false;
  }

  public get ready(): boolean {
    return this.isInitialized;
  }
}

// Singleton helper for quick mount / unmount
let globalGestureTask: GestureRecognizerTask | null = null;

export async function getOrInitGestureRecognizer(options?: GestureRecognizerOptions): Promise<GestureRecognizerTask> {
  if (!globalGestureTask) {
    globalGestureTask = new GestureRecognizerTask(options);
    await globalGestureTask.initialize();
  } else if (options) {
    globalGestureTask.setOptions(options);
  }
  return globalGestureTask;
}

export function cleanupGlobalGestureRecognizer(): void {
  if (globalGestureTask) {
    globalGestureTask.cleanup();
    globalGestureTask = null;
  }
}
