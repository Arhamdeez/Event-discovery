import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    res.status(500).json({ error: 'Gemini chat failed' });
  }
});

app.listen(port, () => {
  console.log(`Gemini chat server listening on http://localhost:${port}`);
});

