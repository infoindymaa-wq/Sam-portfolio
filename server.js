const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

const INDEX_PATH = path.join(__dirname, 'index.html');
const ANALYTICS_PATH = path.join(__dirname, 'analytics.json');

// Initialize Analytics with real structure
if (!fs.existsSync(ANALYTICS_PATH)) {
    const initialAnalytics = {
        totalViews: 0,
        projectClicks: 0,
        totalSessionTime: 0, // In seconds
        sessionCount: 0,
        dailyViews: [0, 0, 0, 0, 0, 0, 0] // Last 7 days
    };
    fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(initialAnalytics, null, 4));
}

// Helper to update daily views
function updateDailyStats(data) {
    const today = new Date().getDay(); // 0-6 (Sun-Sat)
    // We rotate the array or just update today's index
    // For simplicity in this local tool, we use current day index
    data.dailyViews[today]++;
}

app.get('/api/data', (req, res) => {
    try {
        const content = fs.readFileSync(INDEX_PATH, 'utf8');
        const match = content.match(/\/\* <WEBSITE_DATA> \*\/([\s\S]*?)\/\* <\/WEBSITE_DATA> \*\//);
        if (match) {
            const dataStr = match[1].trim().replace(/^const WEBSITE_DATA\s*=\s*/, '').replace(/;$/, '').trim();
            const data = new Function(`return ${dataStr}`)();
            res.json(data);
        } else res.status(404).send('Data not found');
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/api/save', (req, res) => {
    try {
        const newData = req.body;
        let content = fs.readFileSync(INDEX_PATH, 'utf8');
        const newDataStr = `const WEBSITE_DATA = ${JSON.stringify(newData, null, 4)};`;
        const updatedContent = content.replace(/\/\* <WEBSITE_DATA> \*\/([\s\S]*?)\/\* <\/WEBSITE_DATA> \*\//, `/* <WEBSITE_DATA> */\n        ${newDataStr}\n        /* </WEBSITE_DATA> */`);
        fs.writeFileSync(INDEX_PATH, updatedContent, 'utf8');
        res.send('Success');
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/api/analytics', (req, res) => {
    const data = JSON.parse(fs.readFileSync(ANALYTICS_PATH, 'utf8'));
    res.json(data);
});

app.post('/api/track', (req, res) => {
    const { type, duration } = req.body;
    const data = JSON.parse(fs.readFileSync(ANALYTICS_PATH, 'utf8'));
    
    if (type === 'view') {
        data.totalViews++;
        data.sessionCount++;
        updateDailyStats(data);
    }
    if (type === 'click') data.projectClicks++;
    if (type === 'session_end' && duration) {
        data.totalSessionTime += duration;
    }
    
    fs.writeFileSync(ANALYTICS_PATH, JSON.stringify(data, null, 4));
    res.send('Tracked');
});

app.listen(PORT, () => {
    console.log(`\n🚀 Pro Builder Server running at http://localhost:${PORT}`);
});
