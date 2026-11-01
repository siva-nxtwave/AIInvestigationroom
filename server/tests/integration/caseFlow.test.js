import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../../src/app.js';
import { Case } from '../../src/models/Case.js';

let mongoServer;
let app;

before(async () => {
  process.env.NODE_ENV = 'test';
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

test('GET /api/health returns 200 and status ok', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('Full investigation lifecycle: creation, secrecy, discovery, hints, accusation, results', async () => {
  // 1. POST /api/cases - Create mystery
  const createRes = await request(app)
    .post('/api/cases')
    .send({
      premise: 'A priceless vintage watch was taken from a locked vault during the gala.',
      difficulty: 'easy',
    });

  assert.equal(createRes.status, 201);
  const caseData = createRes.body.case;
  assert.ok(caseData.id);
  assert.equal(caseData.difficulty, 'easy');
  assert.equal(caseData.suspects.length, 3);
  assert.equal(caseData.clues.length, 5);
  assert.equal(caseData.progress.remainingHints, 2);
  assert.equal(caseData.status, 'active');

  // Verify server-side secrecy: NO solution or culpritId in response!
  assert.equal(caseData.solution, undefined);
  assert.equal(caseData.culpritId, undefined);
  assert.equal(createRes.body.solution, undefined);

  // All clues initially undiscovered, text is null
  for (const clue of caseData.clues) {
    assert.equal(clue.discovered, false);
    assert.equal(clue.text, null);
  }

  const caseId = caseData.id;

  // 2. GET /api/cases/:id - Retrieve active case
  const getRes = await request(app).get(`/api/cases/${caseId}`);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.case.id, caseId);
  assert.equal(getRes.body.case.solution, undefined);

  // 3. GET /api/cases/:id/result - Blocked before completion
  const earlyResultRes = await request(app).get(`/api/cases/${caseId}/result`);
  assert.equal(earlyResultRes.status, 409);
  assert.equal(earlyResultRes.body.error.code, 'CASE_NOT_COMPLETED');

  // 4. POST /api/cases/:id/clues/:clueId/discover - Discover clue 1
  const firstClueId = caseData.clues[0].id;
  const discoverRes1 = await request(app)
    .post(`/api/cases/${caseId}/clues/${firstClueId}/discover`);
  assert.equal(discoverRes1.status, 200);
  assert.ok(discoverRes1.body.clue.text);
  assert.equal(discoverRes1.body.progress.discoveredClueCount, 1);
  assert.equal(discoverRes1.body.progress.score, 5);

  // Repeat discovery of clue 1 - Must not double count points
  const repeatDiscover = await request(app)
    .post(`/api/cases/${caseId}/clues/${firstClueId}/discover`);
  assert.equal(repeatDiscover.status, 200);
  assert.equal(repeatDiscover.body.progress.score, 5);

  // Discover clue 2
  const secondClueId = caseData.clues[1].id;
  const discoverRes2 = await request(app)
    .post(`/api/cases/${caseId}/clues/${secondClueId}/discover`);
  assert.equal(discoverRes2.status, 200);
  assert.equal(discoverRes2.body.progress.discoveredClueCount, 2);
  assert.equal(discoverRes2.body.progress.score, 10);

  // 5. POST /api/cases/:id/hints - Request hint 1
  const hintRes1 = await request(app).post(`/api/cases/${caseId}/hints`);
  assert.equal(hintRes1.status, 200);
  assert.equal(hintRes1.body.hint.index, 1);
  assert.ok(hintRes1.body.hint.text);
  assert.equal(hintRes1.body.progress.usedHintCount, 1);
  assert.equal(hintRes1.body.progress.remainingHints, 1);
  // Score: 10 clue points - 10 hint penalty = 0
  assert.equal(hintRes1.body.progress.score, 0);

  // Request hint 2
  const hintRes2 = await request(app).post(`/api/cases/${caseId}/hints`);
  assert.equal(hintRes2.status, 200);
  assert.equal(hintRes2.body.hint.index, 2);
  assert.equal(hintRes2.body.progress.remainingHints, 0);

  // Request hint 3 (exhausted) - Must return 409 NO_HINTS_REMAINING
  const hintRes3 = await request(app).post(`/api/cases/${caseId}/hints`);
  assert.equal(hintRes3.status, 409);
  assert.equal(hintRes3.body.error.code, 'NO_HINTS_REMAINING');

  // 6. Accuse invalid suspect
  const badAccuse = await request(app)
    .post(`/api/cases/${caseId}/accuse`)
    .send({ suspectId: 'fictional_suspect_99' });
  assert.equal(badAccuse.status, 400);
  assert.equal(badAccuse.body.error.code, 'INVALID_SUSPECT');

  // Query database directly to get the secret culprit for testing accusation
  const dbDoc = await Case.findById(caseId);
  const secretCulpritId = dbDoc.solution.culpritId;

  // 7. Accuse valid suspect (the actual culprit)
  const accuseRes = await request(app)
    .post(`/api/cases/${caseId}/accuse`)
    .send({ suspectId: secretCulpritId });
  assert.equal(accuseRes.status, 200);
  const result = accuseRes.body.result;
  assert.equal(result.correct, true);
  assert.equal(result.accusedSuspectId, secretCulpritId);
  assert.equal(result.culprit.id, secretCulpritId);
  assert.ok(result.explanation);

  // Score breakdown:
  // Easy bonus = 100, 2 clues = 10, 2 hints = 20 -> 100 + 10 - 20 = 90
  assert.equal(result.scoreBreakdown.correctAccusationPoints, 100);
  assert.equal(result.scoreBreakdown.discoveredCluePoints, 10);
  assert.equal(result.scoreBreakdown.hintPenalty, 20);
  assert.equal(result.scoreBreakdown.finalScore, 90);
  assert.equal(result.score, 90);

  // 8. Subsequent GET /api/cases/:id/result retrieves persisted result
  const finalResultRes = await request(app).get(`/api/cases/${caseId}/result`);
  assert.equal(finalResultRes.status, 200);
  assert.equal(finalResultRes.body.result.score, 90);
  assert.equal(finalResultRes.body.result.correct, true);

  // 9. Discovering clue after completion returns 409 CASE_COMPLETED
  const lateClue = await request(app)
    .post(`/api/cases/${caseId}/clues/${caseData.clues[2].id}/discover`);
  assert.equal(lateClue.status, 409);
  assert.equal(lateClue.body.error.code, 'CASE_COMPLETED');
});

