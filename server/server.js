require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenAI, Type } = require("@google/genai");
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Gemini
const genAI = new GoogleGenAI(process.env.API_KEY);

// Helpers
const getBioPrompt = (bio) => `Transform this boring TikTok bio into a high-conversion niche authority bio: "${bio}". Use emojis, focus on results/authority, and include a clear hook or call to action. Return only the optimized bio text.`;

const getHookPrompt = (niche) => `Generate a viral TikTok "Mad-Libs" style hook for the niche: "${niche}". 
Format your response as a JSON object with these fields:
- result: a desirable outcome
- topic: a controversial or specific topic
- action: a common mistake or negative action.
Make it punchy and high-retention.`;

// ---------------------------------------------------------
// User Identification / History
// ---------------------------------------------------------
app.post('/api/identify', (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    db.get("SELECT * FROM users WHERE user_id = ?", [deviceId], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            // Return existing data
            let hookData = null;
            try { hookData = JSON.parse(row.hook_data); } catch (e) { }

            return res.json({
                found: true,
                data: {
                    bioInput: row.bio_input,
                    optimizedBio: row.optimized_bio,
                    nicheInput: row.niche_input,
                    hook: hookData
                }
            });
        } else {
            // New user, create entry
            const stmt = db.prepare("INSERT INTO users (user_id) VALUES (?)");
            stmt.run(deviceId, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ found: false });
            });
            stmt.finalize();
        }
    });
});

// ---------------------------------------------------------
// Fix Bio
// ---------------------------------------------------------
app.post('/api/fix-bio', async (req, res) => {
    const { bioInput, deviceId } = req.body;

    if (!deviceId) return res.status(400).json({ error: 'Device ID missing' });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(getBioPrompt(bioInput));
        const response = await result.response;
        const optimizedBio = response.text().trim();

        // Save to DB
        db.run(
            "UPDATE users SET bio_input = ?, optimized_bio = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?",
            [bioInput, optimizedBio, deviceId],
            (err) => {
                if (err) console.error("DB Save Error:", err);
            }
        );

        res.json({ result: optimizedBio });
    } catch (error) {
        console.error("Gemini Error:", error);
        // Fallback Mock for user experience during rate limits
        const mockBio = "🚀 Viral Growth Specialist | Helping 10k+ Creators Scale TikTok 📈 | Click below for my Cold-Start Blueprint! 👇";
        res.json({ result: mockBio });
    }
});

// ---------------------------------------------------------
// Generate Hook
// ---------------------------------------------------------
app.post('/api/generate-hook', async (req, res) => {
    const { nicheInput, deviceId } = req.body;

    if (!deviceId) return res.status(400).json({ error: 'Device ID missing' });

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const result = await model.generateContent(getHookPrompt(nicheInput));
        const response = await result.response;
        const hookData = JSON.parse(response.text());

        // Save to DB
        db.run(
            "UPDATE users SET niche_input = ?, hook_data = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?",
            [nicheInput, JSON.stringify(hookData), deviceId],
            (err) => {
                if (err) console.error("DB Save Error:", err);
            }
        );

        res.json(hookData);
    } catch (error) {
        console.error("Gemini Error:", error);
        // Fallback Mock
        const mock = {
            result: "100k views",
            topic: "consistency",
            action: "posting randomly"
        };
        res.json(mock);
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
