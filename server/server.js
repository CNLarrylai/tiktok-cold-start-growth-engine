require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
// NEW SDK IMPORT
const { GoogleGenAI } = require("@google/genai");
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

// Initialize Gemini (New SDK)
if (!process.env.API_KEY) {
    console.error("CRITICAL: API_KEY is missing!");
} else {
    console.log(`API Key detected (starts with: ${process.env.API_KEY.substring(0, 4)}...)`);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "dummy_key" });

// Debug: List available models on startup
(async () => {
    try {
        console.log("--- DEBUG: Fetching available models ---");
        const response = await ai.models.list();
        if (response && response.models) {
            console.log(`Found ${response.models.length} accessible models.`);
        }
        console.log("--- DEBUG END ---");
    } catch (e) {
        console.warn("Failed to list models on startup (Non-fatal):", e.message);
    }
})();

// Robust AI Helper (Refactored for @google/genai SDK)
const generateWithFallback = async (prompt, modelConfig = {}) => {
    // Corrected Priority List based on API Dump
    // Findings:
    // - Gemma 3 models require '-it' suffix (Instruction Tuned)
    // - Gemini 3 is NOT in the list
    // - Gemini 2.0 Flash is available
    const modelsToTry = [
        "gemma-3-27b-it",
        "gemma-3-12b-it",
        "gemma-3-4b-it",
        "gemma-3-1b-it",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-flash-001", // Often the actual system name
        "gemini-1.5-flash-latest"
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`[AI Request V2] Attempting with ${modelName}...`);

            const response = await ai.models.generateContent({
                model: modelName,
                contents: [
                    { role: 'user', parts: [{ text: prompt }] }
                ],
                config: modelConfig
            });

            const text = response.text;
            if (!text) throw new Error("Empty response from AI");

            console.log(`[AI Success] Used ${modelName}`);
            return text;
        } catch (e) {
            lastError = e;
            console.warn(`[AI Warning] ${modelName} failed: ${e.message}`);
            // Retry loop continues...
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
        let optimizedBio = rawResponse ? rawResponse.trim() : "";
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
