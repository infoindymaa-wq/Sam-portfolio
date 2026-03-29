const express = require('express');
const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) 
    : null;

if (serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} else {
    console.log("⚠️ Firebase not initialized. Run locally with file mode or set FIREBASE_SERVICE_ACCOUNT on Vercel.");
}

const db = serviceAccount ? admin.firestore() : null;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));
app.use('/public', express.static(path.join(__dirname, 'public')));

// API: Get Portfolio Data
app.get('/api/data', async (req, res) => {
    try {
        if (db) {
            const doc = await db.collection('portfolio').doc('main').get();
            if (doc.exists) return res.json(doc.data());
        }
        // Local Fallback if Firebase not set
        const content = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        const match = content.match(/\/\* <WEBSITE_DATA> \*\/([\s\S]*?)\/\* <\/WEBSITE_DATA> \*\//);
        const dataStr = match[1].trim().replace(/^const WEBSITE_DATA\s*=\s*/, '').replace(/;$/, '').trim();
        res.json(new Function(`return ${dataStr}`)());
    } catch (err) { res.status(500).send(err.message); }
});

// API: Save Portfolio Data
app.post('/api/save', async (req, res) => {
    try {
        const newData = req.body;
        if (db) {
            await db.collection('portfolio').doc('main').set(newData);
            return res.send('Success');
        }
        res.status(400).send('Firebase not configured');
    } catch (err) { res.status(500).send(err.message); }
});

// API: Analytics
app.get('/api/analytics', async (req, res) => {
    if (db) {
        const doc = await db.collection('stats').doc('main').get();
        return res.json(doc.exists ? doc.data() : {});
    }
    res.json({});
});

app.post('/api/track', async (req, res) => {
    const { type, duration } = req.body;
    if (db) {
        const ref = db.collection('stats').doc('main');
        const update = {};
        if (type === 'view') {
            update.totalViews = admin.firestore.FieldValue.increment(1);
            update.sessionCount = admin.firestore.FieldValue.increment(1);
        }
        if (type === 'click') update.projectClicks = admin.firestore.FieldValue.increment(1);
        if (type === 'session_end' && duration) update.totalSessionTime = admin.firestore.FieldValue.increment(duration);
        
        await ref.set(update, { merge: true });
    }
    res.send('ok');
});

app.listen(PORT, () => {
    console.log(`\n🚀 Backend Live at Port ${PORT}`);
});
