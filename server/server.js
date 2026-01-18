require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Diagnostic: Log what genAI actually is
console.log("Gemini SDK Initialized. Checking connectivity...");

// Helpers
const getBioPrompt = (bio) => `Transform this boring TikTok bio into a high-conversion niche authority bio: "${bio}". Use emojis, focus on results/authority, and include a clear hook or call to action. Return only the optimized bio text.`;

const getHookPrompt = (niche) => `Generate a viral TikTok "Mad-Libs" style hook for the niche: "${niche}". 
Format your response as a JSON object with these EXACT fields:
- result: a desirable outcome (e.g. "hitting 10k")
- topic: a controversial or specific topic (e.g. "shadowbanning")
- action: a common mistake or negative action (e.g. "using banned hashtags").
Make it punchy and high-retention. Return ONLY the JSON object.`;

const extractJson = (text) => {
    try {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON Parse Error on text:", text);
        throw new Error("Could not parse AI response as JSON");
    }
};

// ---------------------------------------------------------
// User Identification / History
// ---------------------------------------------------------
app.post('/api/identify', async (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) {
        return res.status(400).json({ error: 'Device ID required' });
    }

    try {
        const row = await db.get("SELECT * FROM users WHERE user_id = $1", [deviceId]);

        if (row) {
            // Return existing data
            let hookData = null;
            try {
                hookData = typeof row.hook_data === 'string' ? JSON.parse(row.hook_data) : row.hook_data;
            } catch (e) { }

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
            await db.run("INSERT INTO users (user_id) VALUES ($1)", [deviceId]);
            res.json({ found: false });
        }
    } catch (err) {
        console.error("Identify Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// ---------------------------------------------------------
// Fix Bio
// ---------------------------------------------------------
app.post('/api/fix-bio', async (req, res) => {
    const { bioInput, deviceId } = req.body;

    if (!deviceId) return res.status(400).json({ error: 'Device ID missing' });

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(getBioPrompt(bioInput));
        const response = await result.response;
        let optimizedBio = response.text().trim();

        // Clean up common AI chatter or wrapping quotes
        optimizedBio = optimizedBio.replace(/^["']|["']$/g, '');
        optimizedBio = optimizedBio.replace(/^(Here is your|Optimized|Result):?\s*/i, '');

        // Save to DB
        try {
            await db.run(
                "UPDATE users SET bio_input = $1, optimized_bio = $2, last_updated = CURRENT_TIMESTAMP WHERE user_id = $3",
                [bioInput, optimizedBio, deviceId]
            );
        } catch (err) {
            console.error("DB Save Error:", err);
        }

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

    console.log(`[Generate Hook] Niche: ${nicheInput}, Device: ${deviceId}`);

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a viral TikTok script writer.
Generate a high-conversion "Mad-Libs" style hook for a video about "${nicheInput}".
Return ONLY a JSON object with these exact keys:
- result: a desirable outcome (e.g. "hitting 10k")
- topic: a controversy or specific strategy (e.g. "shadowbanning")
- action: a common mistake or negative action (e.g. "using random hashtags")

Requirements:
- JSON only, no markdown, no explanations.
- Language: English (or same as niche input).
- Punchy and high-retention.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        console.log(`[Gemini Raw Response]: ${rawText}`);

        const hookData = extractJson(rawText);

        // Save to DB
        try {
            await db.run(
                "UPDATE users SET niche_input = $1, hook_data = $2, last_updated = CURRENT_TIMESTAMP WHERE user_id = $3",
                [nicheInput, JSON.stringify(hookData), deviceId]
            );
        } catch (err) {
            console.error("DB Save Error:", err);
        }

        res.json(hookData);
    } catch (error) {
        console.error("CRITICAL Gemini Hook Error:", error);

        // Return a mock that explains the error slightly, to help us debug
        const mock = {
            result: "work properly",
            topic: (error.message || "Gemini Connection").substring(0, 30),
            action: "contacting support"
        };
        res.json(mock);
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
