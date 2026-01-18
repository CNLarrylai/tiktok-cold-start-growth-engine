const API_URL = 'http://localhost:5000/api';

export const identifyUser = async (deviceId: string) => {
  try {
    const res = await fetch(`${API_URL}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId })
    });
    return await res.json();
  } catch (e) {
    console.error("Identity Error", e);
    return { found: false };
  }
};

export const fixBio = async (currentBio: string, deviceId: string) => {
  try {
    const res = await fetch(`${API_URL}/fix-bio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bioInput: currentBio, deviceId })
    });
    const data = await res.json();
    return data.result || "Optimization failed.";
  } catch (e) {
    return "Optimization failed. Server error.";
  }
};

export const generateHook = async (niche: string, deviceId: string) => {
  try {
    const res = await fetch(`${API_URL}/generate-hook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nicheInput: niche, deviceId })
    });
    const data = await res.json();
    // Return data directly if it matches the shape, or default
    if (data.result && data.topic) return data;
    throw new Error("Invalid format");
  } catch (e) {
    return {
      result: "100k views",
      topic: "server connection",
      action: "checking the backend"
    };
  }
};
