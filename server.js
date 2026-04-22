import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load env vars (prefer local overrides)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const apiKey = process.env.GEMINI_API_KEY;
console.log('Gemini API key loaded:', apiKey ? 'YES' : 'NO');
let genAI;
let model;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!apiKey || !model) {
      return res.status(500).json({
        error: 'Missing GEMINI_API_KEY environment variable.',
      });
    }

    const { messages } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const history = messages.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content ?? '' }],
    }));

    const result = await model.generateContent({
      contents: history,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
      },
    });

    const reply =
      result?.response?.text?.() ||
      "I'm here to help with events, but I couldn't generate a response.";

    res.json({ reply });
  } catch (err) {
    console.error('Gemini chat error', err);
    const status = Number(err?.status) || 500;
    const retryAfterSeconds = Number(err?.errorDetails?.find?.((d) => d?.retryDelay)?.retryDelay?.replace?.('s', '')) || null;
    const message =
      err?.status === 429
        ? 'Gemini quota exceeded for this API key/project. Enable billing / quota in Google AI Studio / Google Cloud, then retry.'
        : 'Gemini chat failed';

    if (retryAfterSeconds) {
      res.setHeader('Retry-After', String(Math.ceil(retryAfterSeconds)));
    }

    res.status(status).json({
      error: message,
      status,
      retryAfterSeconds,
    });
  }
});

app.listen(port, () => {
  console.log(`Gemini chat server listening on http://localhost:${port}`);
});

