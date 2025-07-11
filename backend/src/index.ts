import express from 'express';
import cors from 'cors';
import { initializeFirebase } from 'shared';
import * as dotenv from 'dotenv';

dotenv.config();

initializeFirebase({
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.FIREBASE_APP_ID || '',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
});

import serverless from 'serverless-http';
import articleRoutes from './router/articleRoutes';
import paymentRoutes from './router/paymentRoutes';
import analyzeRoutes from './router/analyzeRoutes';
import storyRoutes from './router/storyRoutes';
import systemPromptRoutes from './router/systemPromptRoutes';
import r2Routes from './router/r2Routes';
import imageGenerationRoutes from './router/imageGenerationRoutes';

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Your frontend URL - updated for production
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'stripe-signature'],
};

// Apply CORS to all routes EXCEPT the webhook
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    // Skip CORS for webhooks as Stripe needs raw body
    next();
  } else {
    cors(corsOptions)(req, res, next);
  }
});

// Parse JSON bodies for all routes EXCEPT webhook
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') {
    // Use raw body for webhook
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

// Routes 
app.use('/api/articles', articleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/system-prompts', systemPromptRoutes);
app.use('/api/r2', r2Routes);
app.use('/api/images', imageGenerationRoutes);

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});


export const handler = serverless(app);