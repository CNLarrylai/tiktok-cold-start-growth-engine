require('dotenv').config();
const { GoogleGenAI } = require("@google/genai");

if (!process.env.API_KEY) {
    console.error("CRITICAL: API_KEY is missing in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const testModel = async (modelName, userPrompt, baseConfig) => {
    console.log(`\n--- Testing Model: ${modelName} ---`);
    try {
        // Mimic the production logic for stripping JSON mode
        let currentConfig = { ...baseConfig };
        if (modelName.includes("gemma")) {
            console.log("   -> Detected Gemma, removing responseMimeType");
            delete currentConfig.responseMimeType;
        }

        console.log("   -> Final Config:", JSON.stringify(currentConfig));

        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                { role: 'user', parts: [{ text: userPrompt }] }
            ],
            config: currentConfig
        });

        console.log("   -> SUCCESS! Response text preview:", response.text ? response.text.substring(0, 100) : "Empty");
        return true;
    } catch (e) {
        console.error("   -> FAILED:");
        console.error("      Code:", e.code || e.status);
        console.error("      Message:", e.message);
        if (e.body) console.error("      Body:", e.body);
        return false;
    }
};

(async () => {
    const prompt = 'Generate a JSON object with a "result" key.';
    const jsonConfig = { responseMimeType: "application/json" };

    // 1. Test Gemma 3 (Checking the JSON mode fix)
    await testModel("gemma-3-1b-it", prompt, jsonConfig);

    // 2. Test Gemini 1.5 Flash (Checking the 404 issue)
    await testModel("gemini-1.5-flash", prompt, jsonConfig);

    // 3. Test Gemini 1.5 Flash 001 (Checking if specific version works)
    await testModel("gemini-1.5-flash-001", prompt, jsonConfig);

    // 4. Test Gemini 2.0 Flash (Checking Quota/Existence)
    await testModel("gemini-2.0-flash", prompt, jsonConfig);

})();
