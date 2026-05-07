import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'test-project',
    firestore: {
      rules: readFileSync(resolve(__dirname, 'firestore.rules'), 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore Rules Tests', () => {
  it('cannot create user profile for another uid', async () => {
    const context = testEnv.authenticatedContext('alice');
    const maliciousPayload = {
      userId: 'bob',
      role: 'student',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await assertFails(context.firestore().doc('users/bob').set(maliciousPayload));
  });

  it('can create user profile for own uid', async () => {
    const context = testEnv.authenticatedContext('alice');
    const validPayload = {
      userId: 'alice',
      role: 'student',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await assertSucceeds(context.firestore().doc('users/alice').set(validPayload));
  });

  it('cannot query learning_items without the right userId filter', async () => {
    const context = testEnv.authenticatedContext('alice');
    await assertFails(context.firestore().collection('learning_items').get());
  });
});
