export interface RiverPoint {
  lid: string;
  point_name: string;
  river_name: string;
  parent_river?: string;
  address?: string;
  lat: number;
  lon: number;
}

export type RiverPointMap = Record<string, RiverPoint>;

const SOURCE_URL = "https://weathernews.jp/river/FRICS_LWTRLV.csv";
let cachedRiverPoints: Promise<RiverPointMap> | null = null;

function parseRiverPoints(text: string): RiverPointMap {
  const map: RiverPointMap = {};
  const lines = text.split(/[\r\n]+/);
  for (const line of lines) {
    if (!line.trim()) continue;
    const cols = line.split(/[\t,]/);
    if (cols.length < 4) continue;
    const [lid, lat, lon, point_name, river_name, parent_river, address] = cols;
    map[lid] = {
      lid,
      point_name,
      river_name,
      parent_river,
      address,
      lat: Number(lat),
      lon: Number(lon)
    };
  }
  return map;
}

export async function getRiverPoints(): Promise<RiverPointMap> {
  if (!cachedRiverPoints) {
    cachedRiverPoints = fetch(`${SOURCE_URL}?${Math.floor(Date.now() / 600000)}`)
      .then(res => res.text())
      .then(parseRiverPoints)
      .catch(err => {
        console.error("Failed to load river points", err);
        return {} as RiverPointMap;
      });
  }
  return cachedRiverPoints;
}
