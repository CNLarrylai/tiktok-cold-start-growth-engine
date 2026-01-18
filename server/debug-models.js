require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

if (!process.env.API_KEY) {
    console.error("CRITICAL: API_KEY is missing in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

(async () => {
    try {
        console.log("--- DEBUG: Fetching available models ---");
        // Log the AI client version or config if possible to ensure we loaded safely
        // console.log("AI Client:", ai); 

        const response = await ai.models.list();
        console.log("RAW RESPONSE TYPE:", typeof response);
        // If it's an iterable, we can't JSON.stringify it easily if it's a generator
        // But GoogleGenAI SDK v2 list returns a pagination object usually.

        // Try to capture everything
        try {
            console.log("RAW RESPONSE JSON:", JSON.stringify(response, null, 2));
        } catch (e) {
            console.log("Could not stringify response (circular or generator?)");
        }

        // Try standard iteration just in case
        let count = 0;
        if (response) {
            // Check if it has models property
            if (response.models) {
                console.log("Found .models property. Length:", response.models.length);
                response.models.forEach(m => console.log(` - ${m.name}`));
                count = response.models.length;
            }
            // Check if it's iterable
            else if (typeof response[Symbol.iterator] === 'function') {
                console.log("Response is iterable.");
                for (const model of response) {
                    console.log(` - ${model.name}`);
                    count++;
                }
            }
        }

        if (count === 0) {
            console.log("NO MODELS FOUND via iteration or .models check.");
        }

        console.log("--- DEBUG END ---");
    } catch (e) {
        console.error("FATAL ERROR listing models:", e);
    }
})();
