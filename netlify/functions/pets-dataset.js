exports.handler = async () => {
  try {
    const { DATASET_URL = "https://gerieer.github.io/wow-pets-site/data/pets.json", ALLOWED_ORIGIN = "*" } = process.env;

    const res = await fetch(DATASET_URL, { headers: { "User-Agent": "wow-pets-site/1.0" } });
    if (!res.ok) {
      return json({ ok: false, error: `Fuente no disponible (${res.status})` }, 502, ALLOWED_ORIGIN);
    }
    const data = await res.json();
    return json(data, 200, ALLOWED_ORIGIN);
  } catch (err) {
    return json({ ok: false, error: err && err.message ? err.message : String(err) }, 500, "*");
  }
};

function json(body, status = 200, allowOrigin = "*") {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "Access-Control-Allow-Origin": allowOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}
