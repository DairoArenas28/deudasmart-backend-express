import 'reflect-metadata';
import express, { Application } from 'express';

const app: Application = express();

// Middleware
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth routes will be mounted here in a later task
// app.use('/api/auth', authRouter);

export default app;
