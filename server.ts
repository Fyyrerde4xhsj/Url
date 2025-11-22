/**
 * server.ts
 * 
 * Backend service for SwiftLink.
 * Handles /r/:code redirects and /api/shorten requests.
 * 
 * RUN INSTRUCTIONS:
 * 1. npm init -y
 * 2. npm install express firebase-admin cors body-parser nanoid
 * 3. Add your serviceAccountKey.json to root
 * 4. npx ts-node server.ts
 */

import express from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { nanoid } from 'nanoid';

// Initialize Firebase Admin
// In production, use environment variables for credentials
// const serviceAccount = require("./serviceAccountKey.json");
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// Mock init for code generation validity (Remove this in production and use above)
if (admin.apps.length === 0) {
  // This is a placeholder. You MUST provide valid credentials.
  // admin.initializeApp(); 
  console.log("⚠️ Warning: Firebase Admin not actually initialized. Provide credentials.");
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Routes ---

// 1. Shorten URL
app.post('/api/shorten', async (req, res) => {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl || !/^https?:\/\//.test(originalUrl)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Generate 6-char ID
    // Note: For high scale, check collision in loop
    const shortCode = nanoid(6);

    const docRef = db.collection('links').doc(shortCode);
    
    await docRef.set({
      originalUrl,
      shortCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      clicks: 0,
      owner: null // Add user ID if auth implemented
    });

    res.json({ shortCode, originalUrl });

  } catch (error) {
    console.error("Shorten error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Redirect (Backend Mode)
app.get('/r/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const docRef = db.collection('links').doc(code);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).send(`
        <html>
          <body style="background:#111; color:#fff; font-family:sans-serif; display:flex; justify-content:center; align-items:center; height:100vh;">
            <div style="text-align:center">
              <h1>Link Not Found</h1>
              <p>The requested short link does not exist.</p>
            </div>
          </body>
        </html>
      `);
    }

    const data = docSnap.data();
    
    // Async increment click count (don't await to speed up redirect)
    docRef.update({ clicks: admin.firestore.FieldValue.increment(1) }).catch(console.error);

    // 301 Permanent Redirect
    res.redirect(301, data?.originalUrl);

  } catch (error) {
    console.error("Redirect error:", error);
    res.status(500).send('Server Error');
  }
});

// 3. List (Optional - Frontend usually queries directly or via this)
app.get('/api/list', async (req, res) => {
  try {
    const snapshot = await db.collection('links').orderBy('createdAt', 'desc').limit(50).get();
    const links = snapshot.docs.map(doc => doc.data());
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
