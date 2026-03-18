import 'reflect-metadata';
import express, { Application } from 'express';
import authRouter from './modules/auth/auth.router';

const app: Application = express();

// Middleware
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Auth routes — Requirement: 1.1
app.use('/api/auth', authRouter);

export default app;
