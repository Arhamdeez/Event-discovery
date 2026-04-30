import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Resend } from 'resend';
import { getApps, initializeApp as initializeAdminApp, cert } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminDb } from 'firebase-admin/firestore';

// Load env vars (prefer local overrides)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = process.env.PORT || 4000;
const resendApiKey = process.env.RESEND_API_KEY || '';
const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const adminEmailFromEnv = String(process.env.VITE_ADMIN_EMAIL || 'admin@raunaq.com').toLowerCase().trim();
const fixedAdminEmails = ['l226619@lhr.nu.edu.pk', 'l226994@lhr.nu.edu.pk'];
const adminEmails = new Set([adminEmailFromEnv, ...fixedAdminEmails].filter(Boolean));

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

function parsePrivateKey(value) {
  if (!value) return '';
  return String(value).replace(/\\n/g, '\n');
}

function chunkArray(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

let adminApp = null;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const firebaseClientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';
const firebasePrivateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY || '');

if (firebaseProjectId && firebaseClientEmail && firebasePrivateKey) {
  adminApp = getApps()[0]
    || initializeAdminApp({
      credential: cert({
        projectId: firebaseProjectId,
        clientEmail: firebaseClientEmail,
        privateKey: firebasePrivateKey,
      }),
    });
} else {
  console.warn('Firebase Admin credentials missing. Event approval email endpoint will be disabled.');
}

const adminAuth = adminApp ? getAdminAuth(adminApp) : null;
const adminDb = adminApp ? getAdminDb(adminApp) : null;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

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

app.post('/api/notify-approved-event', async (req, res) => {
  try {
    if (!adminAuth || !adminDb) {
      return res.status(500).json({
        error: 'Firebase Admin is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
      });
    }
    if (!resend) {
      return res.status(500).json({
        error: 'Missing RESEND_API_KEY.',
      });
    }

    const authHeader = String(req.headers.authorization || '');
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      return res.status(401).json({ error: 'Missing Bearer token.' });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const requesterEmail = String(decoded?.email || '').toLowerCase().trim();
    if (!adminEmails.has(requesterEmail)) {
      return res.status(403).json({ error: 'Only admins can send approval notifications.' });
    }

    const {
      eventId,
      organizerId,
      organizerName,
      title,
      date,
      time,
      location,
    } = req.body || {};
    if (!eventId || !organizerId || !title) {
      return res.status(400).json({
        error: 'eventId, organizerId, and title are required.',
      });
    }

    const followerSnap = await adminDb
      .collection('users')
      .doc(String(organizerId))
      .collection('followers')
      .get();
    const followerIds = followerSnap.docs.map((d) => d.id);
    const followerEmailsFromDocs = followerSnap.docs
      .map((d) => String(d.data()?.followerEmail || '').trim())
      .filter(Boolean);
    if (!followerIds.length) {
      return res.json({ ok: true, sent: 0, reason: 'No followers found.' });
    }

    const userRefs = followerIds.map((uid) => adminDb.collection('users').doc(uid));
    const userSnaps = [];
    chunkArray(userRefs, 100).forEach((group) => {
      userSnaps.push(...group);
    });
    const userDocs = await adminDb.getAll(...userSnaps);
    const emails = [...new Set([
      ...followerEmailsFromDocs,
      ...userDocs
        .map((snap) => String(snap.data()?.email || '').trim())
        .filter(Boolean),
    ])];

    if (!emails.length) {
      return res.json({ ok: true, sent: 0, reason: 'Followers have no email docs.' });
    }

    const eventUrl = `http://localhost:5173/events/${encodeURIComponent(String(eventId))}`;
    const senderName = organizerName || 'An organizer';
    const emailResults = await Promise.allSettled(
      emails.map((to) =>
        resend.emails.send({
          from: resendFromEmail,
          to,
          subject: `New approved event: ${title}`,
          html: `
            <p>Hello,</p>
            <p><strong>${senderName}</strong> just got a new event approved.</p>
            <p><strong>${title}</strong></p>
            <p>${date || 'Date TBA'} ${time ? `at ${time}` : ''}</p>
            <p>${location || ''}</p>
            <p><a href="${eventUrl}">View event</a></p>
          `,
        }),
      ),
    );

    const sent = emailResults.filter((result) => result.status === 'fulfilled').length;
    const failed = emailResults.length - sent;
    const errorMessages = emailResults
      .filter((result) => result.status === 'rejected')
      .map((result) => String(result.reason?.message || result.reason || 'Unknown email error'));
    return res.json({
      ok: true,
      sent,
      failed,
      reason: failed > 0 ? errorMessages[0] || 'Some emails failed to send.' : '',
    });
  } catch (err) {
    console.error('Event approval notification error', err);
    return res.status(500).json({
      error: err?.message || 'Could not send approval notifications.',
    });
  }
});

app.listen(port, () => {
  console.log(`Gemini chat server listening on http://localhost:${port}`);
});

