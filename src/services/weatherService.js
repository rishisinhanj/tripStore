const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

const UNITS = 'imperial';

async function fetchJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    let message = `Weather API error: ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.message) {
        message += ` - ${data.message}`;
      }
    } catch {}
    throw new Error(message);
  }

  return res.json();
}

function normalizeCityName(rawName) {
  if (!rawName) return rawName;

  const trimmed = rawName.trim();
  const upper = trimmed.toUpperCase();

  const map = {
    NYC: 'New York, US',
    JFK: 'New York, US',
    LGA: 'New York, US',
    EWR: 'Newark, US',

    CHI: 'Chicago, US',
    LAX: 'Los Angeles, US',
    SFO: 'San Francisco, US',
    LON: 'London, GB',
    PAR: 'Paris, FR',
    TYO: 'Tokyo, JP',
  };

  if (map[upper]) {
    return map[upper];
  }

  return trimmed;
}

async function getCityForecast(cityName) {
  if (!cityName) {
    throw new Error('Missing city name for weather lookup');
  }

  if (!API_KEY) {
    throw new Error(
      'Missing OpenWeatherMap API key. ' +
        'Set REACT_APP_OPENWEATHER_API_KEY in your .env file.'
    );
  }

  const normalizedName = normalizeCityName(cityName);
  console.log('Weather lookup city =', normalizedName);

  const url = `${BASE_URL}/forecast?q=${encodeURIComponent(
    normalizedName
  )}&units=${UNITS}&appid=${API_KEY}`;

  const data = await fetchJson(url);

  const daysMap = {};

  data.list.forEach((entry) => {
    const [dateStr] = entry.dt_txt.split(' ');
    if (!daysMap[dateStr]) {
      daysMap[dateStr] = [];
    }
    daysMap[dateStr].push(entry);
  });

  const days = Object.keys(daysMap)
    .sort()
    .slice(0, 5)
    .map((dateStr) => {
      const entries = daysMap[dateStr];
      let minTemp = Infinity;
      let maxTemp = -Infinity;
      const descriptionCounts = {};

      entries.forEach((e) => {
        const t = e.main?.temp;
        if (typeof t === 'number') {
          if (t < minTemp) minTemp = t;
          if (t > maxTemp) maxTemp = t;
        }

        const desc = e.weather?.[0]?.description;
        if (desc) {
          descriptionCounts[desc] = (descriptionCounts[desc] || 0) + 1;
        }
      });

      const [topDesc] = Object.entries(descriptionCounts).sort(
        (a, b) => b[1] - a[1]
      )[0] || [''];

      const formattedDate = new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      return {
        date: dateStr,
        formattedDate,
        minTemp,
        maxTemp,
        description: topDesc,
      };
    });

  return {
    cityName: `${data.city.name}, ${data.city.country}`,
    units: UNITS,
    days,
  };
}

export const weatherService = {
  getCityForecast,
};
