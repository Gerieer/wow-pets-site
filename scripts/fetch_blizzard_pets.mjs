#!/usr/bin/env node
/**
 * Fetches WoW pets list from Blizzard API and writes a compact JSON for the site.
 * Requires GitHub repo secrets: BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET.
 * Optional env: BLIZZARD_REGION (eu/us/kr/tw), BLIZZARD_LOCALE (es_ES).
 */

const REGION = process.env.BLIZZARD_REGION?.toLowerCase() || "eu";
const LOCALE = process.env.BLIZZARD_LOCALE || "es_ES";
const CLIENT_ID = process.env.BLIZZARD_CLIENT_ID;
const CLIENT_SECRET = process.env.BLIZZARD_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET in environment.");
  process.exit(0); // don't fail the build; site can still deploy
}

const OAUTH_URL = `https://${REGION}.battle.net/oauth/token`;
const API_BASE = `https://${REGION}.api.blizzard.com`;
const NAMESPACE = `static-${REGION}`; // static data namespace

async function main() {
  const token = await getToken(CLIENT_ID, CLIENT_SECRET);
  const pets = await fetchPetsIndex(token);
  const details = await fetchPetDetails(token, pets);
  const slim = details.map(({ id, name, type, icon }) => ({ id, name, type, icon }));
  await writeJson("data/pets.json", { region: REGION, locale: LOCALE, count: slim.length, pets: slim });
  console.log(`Saved ${slim.length} pets to data/pets.json`);
}

async function getToken(id, secret) {
  const body = new URLSearchParams();
  body.set("grant_type", "client_credentials");
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  if (!res.ok) throw new Error(`OAuth token failed: ${res.status}`);
  const json = await res.json();
  return json.access_token;
}

async function fetchPetsIndex(token) {
  const url = `${API_BASE}/data/wow/pet/index?namespace=${NAMESPACE}&locale=${LOCALE}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Pet index failed: ${res.status}`);
  const json = await res.json();
  return json.pets || [];
}

async function fetchPetDetails(token, pets) {
  // Limit to a reasonable number if needed (e.g., 1200). 0 means all.
  const limit = 0;
  const out = [];
  for (let i = 0; i < pets.length; i++) {
    if (limit && out.length >= limit) break;
    const p = pets[i];
    const url = `${API_BASE}/data/wow/pet/${p.id}?namespace=${NAMESPACE}&locale=${LOCALE}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      console.warn(`Warn: detail ${p.id} -> ${res.status}`);
      continue;
    }
    const json = await res.json();
    const typeName = json.battle_pet_type?.name?.toLowerCase?.() || "";
    const icon = json.icon || null; // some responses include icon name; may need CDN path composition
    out.push({ id: p.id, name: json.name, type: mapType(typeName), icon: icon ? cdnIcon(icon) : null });
    // Be polite to API
    if (i % 50 === 0) await wait(200);
  }
  return out;
}

function mapType(t) {
  // Normalize Spanish to our internal keys
  const m = {
    "bestia": "bestia",
    "humanoide": "humanoide",
    "dragón": "dragón",
    "dragon": "dragón",
    "no-muerto": "no-muerto",
    "no muerto": "no-muerto",
    "mecánico": "mecánico",
    "mecanico": "mecánico",
    "elemental": "elemental",
    "acuático": "acuático",
    "acuatico": "acuático",
    "volador": "volador",
    "mágico": "mágico",
    "magico": "mágico"
  };
  return m[t] || t || "";
}

function cdnIcon(iconName) {
  // Compose a known WoW icon CDN path. The classic WoWHead/Blizzard pattern uses lowercase and .jpg
  // Using wow.zamimg.com (Wowhead CDN) for icons by name to avoid API signed URLs.
  return `https://wow.zamimg.com/images/wow/icons/large/${iconName.toLowerCase()}.jpg`;
}

async function writeJson(path, data) {
  const fs = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, JSON.stringify(data));
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

// Ensure fetch exists (Node 18+)
if (typeof fetch !== "function") {
  globalThis.fetch = (await import("node-fetch")).default;
}

main().catch(err => {
  console.error(err);
  process.exit(0); // don’t fail the build; site can still deploy
});
