import app from './app';

const port = process.env.PORT || 3001;
const host = process.env.HOST || '0.0.0.0';

app.listen(Number(port), host, () => {
  console.log(`API running on http://localhost:${port}`);
});