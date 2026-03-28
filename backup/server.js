const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

const INDEX_PATH = path.join(__dirname, 'index.html');

// API to get current data from index.html
app.get('/api/data', (req, res) => {
    try {
        if (!fs.existsSync(INDEX_PATH)) return res.status(404).send('index.html not found');
        
        const content = fs.readFileSync(INDEX_PATH, 'utf8');
        const match = content.match(/\/\* <WEBSITE_DATA> \*\/([\s\S]*?)\/\* <\/WEBSITE_DATA> \*\//);
        
        if (match) {
            let dataStr = match[1].trim();
            // Clean up the string to get just the object
            dataStr = dataStr.replace(/^const WEBSITE_DATA\s*=\s*/, '').replace(/;$/, '').trim();
            
            // Convert JS Object string to JSON safely-ish for a local tool
            // We use a Function constructor instead of eval for slightly better safety
            const data = new Function(`return ${dataStr}`)();
            res.json(data);
        } else {
            res.status(404).send('Data block markers not found in index.html');
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).send(err.message);
    }
});

// API to save updated data to index.html
app.post('/api/save', (req, res) => {
    try {
        const newData = req.body;
        if (!fs.existsSync(INDEX_PATH)) return res.status(404).send('index.html not found');

        let content = fs.readFileSync(INDEX_PATH, 'utf8');
        
        // Format the new data block
        const newDataStr = `const WEBSITE_DATA = ${JSON.stringify(newData, null, 4)};`;
        const replacement = `/* <WEBSITE_DATA> */\n        ${newDataStr}\n        /* </WEBSITE_DATA> */`;
        
        const updatedContent = content.replace(
            /\/\* <WEBSITE_DATA> \*\/([\s\S]*?)\/\* <\/WEBSITE_DATA> \*\//,
            replacement
        );

        fs.writeFileSync(INDEX_PATH, updatedContent, 'utf8');
        console.log("✅ Portfolio Updated Successfully!");
        res.send('Success');
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Pro Builder Server running at http://localhost:${PORT}`);
    console.log(`👉 Builder UI: http://localhost:${PORT}/builder.html`);
    console.log(`👉 Main Site:  http://localhost:${PORT}/index.html\n`);
});
