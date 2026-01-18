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

// ---------------------------------------------------------
// Security Middleware & SDK Initialization
// ---------------------------------------------------------
const securityCheck = (req, res, next) => {
    const isLocal = req.hostname === 'localhost';
    const securityHeader = req.headers['x-app-servicegrow-security'];

    // Allow local dev and requests with our special header
    if (isLocal || securityHeader === 'sg-safe-v1') {
        next();
    } else {
        console.warn(`[Security Block] Blocked request from ${req.hostname} - Header: ${securityHeader}`);
        res.status(403).json({ error: "Access denied. Valid browser request required." });
    }
};

// Initialize Gemini
if (!process.env.API_KEY) {
    console.error("CRITICAL: API_KEY is missing!");
} else {
    console.log(`API Key detected (starts with: ${process.env.API_KEY.substring(0, 4)}...)`);
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY || "dummy_key");

// Robust AI Helper
const generateWithFallback = async (prompt, generationConfig = {}) => {
    // Comprehensive priority list as requested by user
    const modelsToTry = [
        "gemini-3-flash",
        "gemma-3-27b",
        "gemma-3-12b",
        "gemma-3-4b",
        "gemma-3-2b",
        "gemma-3-1b",
        "gemini-1.5-flash", // Safety Net 1 (Confirmed Quota)
        "gemini-2.0-flash"  // Safety Net 2
    ];
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI Request] Attempting with ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: generationConfig
            });

            const response = await result.response;
            const text = response.text();

            if (!text) throw new Error("Empty response from AI");

            console.log(`[AI Success] Used ${modelName}`);
            return text;
        } catch (e) {
            lastError = e;
            console.warn(`[AI Warning] ${modelName} failed: ${e.message}`);
            // If it's a quota (429) or not found (404), try next model
            if (e.status === 429 || e.status === 404 || e.message?.includes('quota')) continue;
        }
    }
    throw lastError || new Error("All AI models failed or exhausted.");
};

// Helpers
const getBioPrompt = (bio) => `Transform this boring TikTok bio into a high-conversion niche authority bio: "${bio}". Use emojis, focus on results/authority, and include a clear hook or call to action. Return only the optimized bio text.`;

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
app.post('/api/identify', securityCheck, async (req, res) => {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'Device ID required' });

    try {
        const row = await db.get("SELECT * FROM users WHERE user_id = $1", [deviceId]);
        if (row) {
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
app.post('/api/fix-bio', securityCheck, async (req, res) => {
    const { bioInput, deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'Device ID missing' });

    try {
        const rawResponse = await generateWithFallback(getBioPrompt(bioInput));
        let optimizedBio = rawResponse.trim();
        optimizedBio = optimizedBio.replace(/^["']|["']$/g, '').replace(/^(Here is your|Optimized|Result):?\s*/i, '');

        try {
            await db.run(
                "UPDATE users SET bio_input = $1, optimized_bio = $2, last_updated = CURRENT_TIMESTAMP WHERE user_id = $3",
                [bioInput, optimizedBio, deviceId]
            );
        } catch (err) { }

        res.json({ result: optimizedBio });
    } catch (error) {
        console.error("Final Bio Error:", error);
        res.json({ result: "🚀 Build your niche authority today! (AI busy, try again in 1 min)" });
    }
});

// ---------------------------------------------------------
// Generate Hook
// ---------------------------------------------------------
app.post('/api/generate-hook', securityCheck, async (req, res) => {
    const { nicheInput, deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'Device ID missing' });

    try {
        const prompt = `You are a viral TikTok script writer. Generate a high-conversion JSON hook for "${nicheInput}" with keys: result, topic, action. JSON ONLY.`;
        const rawResponse = await generateWithFallback(prompt, { responseMimeType: "application/json" });
        const hookData = extractJson(rawResponse);

        try {
            await db.run(
                "UPDATE users SET niche_input = $1, hook_data = $2, last_updated = CURRENT_TIMESTAMP WHERE user_id = $3",
                [nicheInput, JSON.stringify(hookData), deviceId]
            );
        } catch (err) { }

        res.json(hookData);
    } catch (error) {
        console.error("Final Hook Error:", error);
        res.json({
            result: "Viral Growth",
            topic: (error.message || "Stability").substring(0, 40),
            action: "wait 60s"
        });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
