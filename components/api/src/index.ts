import app from './app';

const port = process.env.PORT || 4000;
const host = process.env.HOST || '0.0.0.0';

app.listen(Number(port), host, () => {
  console.log(`API running on http://localhost:${port}`);

  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/32e45304-f290-4da1-a9b1-66cfaf4392ac', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'debug-session',
      runId: 'pre-fix',
      hypothesisId: 'H2',
      location: 'api/src/index.ts:listen',
      message: 'API server listening',
      data: { port: Number(port), host },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion
});