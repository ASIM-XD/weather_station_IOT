
const CHANNEL_ID = "3560262";

const API_URL = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json`;

export async function getWeatherData(results = 60) {
  const response = await fetch(`${API_URL}?results=${results}`);

  if (!response.ok) {
    throw new Error("Failed to fetch ThingSpeak data");
  }

  const data = await response.json();

  return data.feeds;
}
