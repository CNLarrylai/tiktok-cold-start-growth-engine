const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-App-ServiceGrow-Security': 'sg-safe-v1'
};

export const identifyUser = async (deviceId: string) => {
  try {
    const res = await fetch(`${API_URL}/identify`, {
      method: 'POST',
      headers: SECURITY_HEADERS,
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
      headers: SECURITY_HEADERS,
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
      headers: SECURITY_HEADERS,
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
