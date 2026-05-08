import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Load env vars (prefer local overrides)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const app = express();
const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'replace-this-in-production';
const adminEmail = (process.env.VITE_ADMIN_EMAIL || process.env.ADMIN_EMAIL || 'admin@raunaq.com')
  .toLowerCase()
  .trim();
const fixedAdminEmails = ['l226619@lhr.nu.edu.pk', 'l226994@lhr.nu.edu.pk'];
const adminEmails = new Set([adminEmail, ...fixedAdminEmails].map((email) => String(email || '').toLowerCase().trim()).filter(Boolean));

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

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

const messageSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true },
    senderName: { type: String, default: 'Attendee' },
    senderEmail: { type: String, default: '' },
    text: { type: String, required: true, trim: true, maxlength: 800 },
  },
  { _id: true, timestamps: true },
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    category: { type: String, default: 'General' },
    image: { type: String, default: '' },
    reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    attendeeCount: { type: Number, default: 0 },
    organizerId: { type: String, required: true, index: true },
    organizerEmail: { type: String, default: '' },
    organizerName: { type: String, default: '' },
    organizerInitial: { type: String, default: 'O' },
    reviewedBy: { type: String, default: '' },
    reviewedAt: { type: Date, default: null },
    attendees: { type: [String], default: [] },
    messages: { type: [messageSchema], default: [] },
    lat: { type: Number, default: null },
    lon: { type: Number, default: null },
  },
  { timestamps: true },
);

const followSchema = new mongoose.Schema(
  {
    followerId: { type: String, required: true, index: true },
    organizerId: { type: String, required: true, index: true },
    organizerEmail: { type: String, default: '' },
    organizerName: { type: String, default: '' },
  },
  { timestamps: true },
);

followSchema.index({ followerId: 1, organizerId: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Event = mongoose.model('Event', eventSchema);
const Follow = mongoose.model('Follow', followSchema);

function toPublicEvent(eventDoc) {
  const obj = eventDoc.toObject ? eventDoc.toObject() : eventDoc;
  return {
    ...obj,
    id: String(obj._id),
    _id: undefined,
    attendees: undefined,
    messages: undefined,
  };
}

function buildToken(user) {
  return jwt.sign(
    {
      uid: String(user._id),
      email: user.email,
      isAdmin: adminEmails.has(String(user.email || '').toLowerCase()),
    },
    jwtSecret,
    { expiresIn: '7d' },
  );
}

function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (!token) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const payload = jwt.verify(token, jwtSecret);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

function authOptional(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (token) {
      req.auth = jwt.verify(token, jwtSecret);
    }
  } catch {
    req.auth = null;
  }
  next();
}

function adminRequired(req, res, next) {
  if (!req.auth?.isAdmin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  return next();
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'That email is already registered. Try signing in.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = buildToken(user);
    return res.status(201).json({
      token,
      user: {
        uid: String(user._id),
        email: user.email,
        isAdmin: adminEmails.has(email),
      },
    });
  } catch (err) {
    console.error('Signup failed', err);
    return res.status(500).json({ error: 'Could not create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    const token = buildToken(user);
    return res.json({
      token,
      user: {
        uid: String(user._id),
        email: user.email,
        isAdmin: adminEmails.has(email),
      },
    });
  } catch (err) {
    console.error('Login failed', err);
    return res.status(500).json({ error: 'Sign in failed.' });
  }
});

app.get('/api/auth/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.auth.uid).lean();
    if (!user) return res.status(404).json({ error: 'User not found.' });
    return res.json({
      user: {
        uid: String(user._id),
        email: user.email,
        isAdmin: adminEmails.has(String(user.email || '').toLowerCase()),
      },
    });
  } catch {
    return res.status(500).json({ error: 'Could not load user profile.' });
  }
});

app.get('/api/events', async (req, res) => {
  try {
    const includeAll = String(req.query?.scope || '') === 'all';
    const query = includeAll ? {} : { reviewStatus: 'approved' };
    const events = await Event.find(query).sort({ createdAt: -1 }).lean();
    return res.json({ events: events.map((event) => toPublicEvent(event)) });
  } catch {
    return res.status(500).json({ error: 'Could not load events.' });
  }
});

app.get('/api/events/:id', authOptional, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const uid = req.auth?.uid || '';
    const isAdmin = Boolean(req.auth?.isAdmin);
    const canView =
      event.reviewStatus === 'approved' ||
      event.organizerId === uid ||
      isAdmin;
    if (!canView) return res.status(403).json({ error: 'This event is under review.' });
    return res.json({ event: toPublicEvent(event) });
  } catch {
    return res.status(400).json({ error: 'Invalid event id.' });
  }
});

app.post('/api/events', authRequired, async (req, res) => {
  try {
    const payload = req.body || {};
    const email = req.auth.email || 'host@events.app';
    const namePart = email.split('@')[0] || 'host';
    const organizerName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const event = await Event.create({
      ...payload,
      organizerId: req.auth.uid,
      organizerEmail: email,
      organizerName,
      organizerInitial: organizerName.charAt(0).toUpperCase(),
      reviewStatus: 'pending',
      attendeeCount: Number(payload.attendeeCount || 0),
      attendees: [],
      messages: [],
    });
    return res.status(201).json({ event: toPublicEvent(event) });
  } catch (err) {
    console.error('Create event failed', err);
    return res.status(400).json({ error: 'Could not save event.' });
  }
});

app.put('/api/events/:id', authRequired, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (String(event.organizerId) !== req.auth.uid) {
      return res.status(403).json({ error: 'You can only edit events you created.' });
    }
    const fields = ['title', 'description', 'date', 'time', 'location', 'category', 'image', 'lat', 'lon'];
    for (const field of fields) {
      if (field in req.body) event[field] = req.body[field];
    }
    event.reviewStatus = 'pending';
    await event.save();
    return res.json({ event: toPublicEvent(event) });
  } catch {
    return res.status(400).json({ error: 'Could not update event.' });
  }
});

app.get('/api/users/me/created-events', authRequired, async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.auth.uid }).sort({ createdAt: -1 }).lean();
    return res.json({ events: events.map((event) => toPublicEvent(event)) });
  } catch {
    return res.status(500).json({ error: 'Could not load your created events.' });
  }
});

app.get('/api/users/me/attended', authRequired, async (req, res) => {
  try {
    const events = await Event.find({ attendees: req.auth.uid }).select('_id').lean();
    const attendedEventIds = events.map((event) => String(event._id));
    return res.json({ attendedEventIds });
  } catch {
    return res.status(500).json({ error: 'Could not load attended events.' });
  }
});

app.post('/api/events/:id/attend', authRequired, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    if (!event.attendees.includes(req.auth.uid)) {
      event.attendees.push(req.auth.uid);
      event.attendeeCount = event.attendees.length;
      await event.save();
    }
    return res.json({ attendeeCount: event.attendeeCount });
  } catch {
    return res.status(400).json({ error: 'Could not save RSVP.' });
  }
});

app.delete('/api/events/:id/attend', authRequired, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    event.attendees = event.attendees.filter((uid) => uid !== req.auth.uid);
    event.attendeeCount = event.attendees.length;
    await event.save();
    return res.json({ attendeeCount: event.attendeeCount });
  } catch {
    return res.status(400).json({ error: 'Could not remove attendance.' });
  }
});

app.get('/api/events/:id/messages', authRequired, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).lean();
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const canAccess =
      event.organizerId === req.auth.uid ||
      req.auth.isAdmin ||
      (event.attendees || []).includes(req.auth.uid);
    if (!canAccess) {
      return res.status(403).json({ error: 'Join this event to access chat.' });
    }
    return res.json({
      messages: (event.messages || []).map((message) => ({
        ...message,
        id: String(message._id),
        _id: undefined,
      })),
    });
  } catch {
    return res.status(400).json({ error: 'Could not load chat messages.' });
  }
});

app.post('/api/events/:id/messages', authRequired, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    const canAccess =
      event.organizerId === req.auth.uid ||
      req.auth.isAdmin ||
      (event.attendees || []).includes(req.auth.uid);
    if (!canAccess) {
      return res.status(403).json({ error: 'Join this event to access chat.' });
    }

    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Message text is required.' });
    const senderName = req.auth.email ? req.auth.email.split('@')[0] : 'Attendee';
    event.messages.push({
      uid: req.auth.uid,
      senderName,
      senderEmail: req.auth.email || '',
      text,
    });
    await event.save();
    const last = event.messages[event.messages.length - 1];
    return res.status(201).json({
      message: {
        ...last.toObject(),
        id: String(last._id),
        _id: undefined,
      },
    });
  } catch {
    return res.status(400).json({ error: 'Could not send message.' });
  }
});

app.get('/api/users/me/follows', authRequired, async (req, res) => {
  try {
    const [followerRows, followingRows, organizerRows] = await Promise.all([
      Follow.countDocuments({ organizerId: req.auth.uid }),
      Follow.find({ followerId: req.auth.uid }).lean(),
      Event.find({
        organizerId: { $ne: req.auth.uid },
        reviewStatus: { $in: ['approved', 'pending'] },
      })
        .select('organizerId organizerName organizerEmail')
        .lean(),
    ]);

    const organizerMap = new Map();
    for (const row of organizerRows) {
      const organizerId = String(row.organizerId || '');
      if (!organizerId || organizerMap.has(organizerId)) continue;
      organizerMap.set(organizerId, {
        id: organizerId,
        organizerName: row.organizerName || row.organizerEmail?.split?.('@')?.[0] || 'Organizer',
        organizerEmail: row.organizerEmail || '',
      });
    }

    return res.json({
      followersCount: followerRows,
      followingIds: followingRows.map((row) => row.organizerId),
      followableOrganizers: Array.from(organizerMap.values()).sort((a, b) =>
        String(a.organizerName).localeCompare(String(b.organizerName)),
      ),
    });
  } catch {
    return res.status(500).json({ error: 'Could not load follow data.' });
  }
});

app.post('/api/users/me/following/:organizerId', authRequired, async (req, res) => {
  try {
    const organizerId = String(req.params.organizerId || '');
    if (!organizerId) return res.status(400).json({ error: 'Invalid organizer.' });
    if (organizerId === req.auth.uid) return res.status(400).json({ error: 'You cannot follow yourself.' });

    const organizerUser = await User.findById(organizerId).lean();
    await Follow.updateOne(
      { followerId: req.auth.uid, organizerId },
      {
        $set: {
          organizerEmail: organizerUser?.email || '',
          organizerName: organizerUser?.email?.split?.('@')?.[0] || 'Organizer',
        },
      },
      { upsert: true },
    );
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ error: 'Could not update follow status.' });
  }
});

app.delete('/api/users/me/following/:organizerId', authRequired, async (req, res) => {
  try {
    await Follow.deleteOne({ followerId: req.auth.uid, organizerId: String(req.params.organizerId || '') });
    return res.json({ ok: true });
  } catch {
    return res.status(400).json({ error: 'Could not update follow status.' });
  }
});

app.get('/api/users/:organizerId/followers/count', async (req, res) => {
  try {
    const followersCount = await Follow.countDocuments({ organizerId: String(req.params.organizerId || '') });
    return res.json({ followersCount });
  } catch {
    return res.status(400).json({ error: 'Could not load followers count.' });
  }
});

app.get('/api/admin/events', authRequired, adminRequired, async (_req, res) => {
  try {
    const events = await Event.find({}).sort({ updatedAt: -1 }).lean();
    return res.json({ events: events.map((event) => toPublicEvent(event)) });
  } catch {
    return res.status(500).json({ error: 'Could not load event submissions.' });
  }
});

app.get('/api/admin/users', authRequired, adminRequired, async (_req, res) => {
  try {
    const users = await User.find({}).select('_id email').lean();
    return res.json({
      users: users.map((user) => ({ id: String(user._id), email: user.email })),
    });
  } catch {
    return res.status(500).json({ error: 'Could not load users.' });
  }
});

app.patch('/api/admin/events/:id/review', authRequired, adminRequired, async (req, res) => {
  try {
    const nextStatus = String(req.body?.status || '').toLowerCase();
    if (!['approved', 'rejected', 'pending'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid review status.' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });
    event.reviewStatus = nextStatus;
    event.reviewedBy = req.auth.email || '';
    event.reviewedAt = new Date();
    await event.save();
    return res.json({ event: toPublicEvent(event) });
  } catch {
    return res.status(400).json({ error: 'Could not update review status.' });
  }
});

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

async function start() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('Missing MONGODB_URI in environment.');
    }
    await mongoose.connect(mongoUri);
    app.listen(port, () => {
      console.log(`MERN server listening on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
}

start();

