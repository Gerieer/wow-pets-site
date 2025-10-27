exports.handler = async (event) => {
  try {
    const {
      BLIZZARD_CLIENT_ID,
      BLIZZARD_CLIENT_SECRET,
      BLIZZARD_LOCALE = "es_ES",
      ALLOWED_ORIGIN = "https://gerieer.github.io",
      REDIRECT_URI
    } = process.env;

    if (!BLIZZARD_CLIENT_ID || !BLIZZARD_CLIENT_SECRET || !REDIRECT_URI) {
      return htmlError("Faltan variables de entorno (BLIZZARD_CLIENT_ID/SECRET, REDIRECT_URI).");
    }

    const reqUrl = new URL(event.rawUrl || https://);
    const code = reqUrl.searchParams.get("code");
    const stateEncoded = reqUrl.searchParams.get("state");
    if (!code || !stateEncoded) {
      return htmlError("Solicitud inválida (falta code/state).");
    }

    const cookies = parseCookies(event.headers.cookie || "");
    const cookieNonce = cookies["wow_state_nonce"];
    const state = JSON.parse(Buffer.from(stateEncoded, "base64url").toString("utf8"));
    if (!cookieNonce || cookieNonce !== state.n) {
      return htmlError("CSRF detectado: state inválido.");
    }

    const { origin, realmSlug, characterName } = state;
    const ALLOWED = ALLOWED_ORIGIN;
    if (origin !== ALLOWED && !String(origin).startsWith(ALLOWED)) {
      return htmlError("Origen no permitido.");
    }

    const region = (state.region || "eu").toLowerCase();
    const oauthHost = ${region}.battle.net;
    const apiHost = ${region}.api.blizzard.com;

    const tokenRes = await fetch(https:///oauth/token, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(${BLIZZARD_CLIENT_ID}:).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      return htmlPostMessage(origin, { ok: false, error: Intercambio de token falló:  });
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    let payload = { ok: true, pets: [], characterName, realmSlug, region };
    if (characterName && realmSlug) {
      const ns = profile-;
      const petsUrl = new URL(https:///profile/wow/character///collections/pets);
      petsUrl.searchParams.set("namespace", ns);
      petsUrl.searchParams.set("locale", BLIZZARD_LOCALE);

      const petsRes = await fetch(petsUrl.toString(), { headers: { "Authorization": Bearer  } });
      if (!petsRes.ok) {
        const txt = await petsRes.text();
        return htmlPostMessage(origin, { ok: false, error: No se pudo obtener mascotas:   });
      }

      const data = await petsRes.json();
      const pets = Array.isArray(data.pets) ? data.pets : [];
      payload.pets = pets.map(p => ({
        // speciesId de la mascota
        speciesId: p.species && p.species.id ? p.species.id : undefined,
        name: p.species && p.species.name ? p.species.name : (p.name || ""),
        level: p.level || 1,
        quality: p.quality && p.quality.type ? p.quality.type : undefined,
        isFavorite: !!p.is_favorite,
        creatureId: p.creature ? p.creature.id : undefined
      }));
    } else {
      payload.message = "Inicio de sesión completado. Indica reino y personaje para consultar mascotas.";
    }

    return htmlPostMessage(origin, payload);
  } catch (err) {
    return htmlError(oauth-callback error: );
  }
};

function htmlPostMessage(targetOrigin, payload) {
  const safeJson = JSON.stringify(payload).replace(/</g, "\\u003c");
  const body = 
<!doctype html>
<meta charset="utf-8">
<title>WoW Pets OAuth</title>
<script>
  (function(){
    try {
      var data = ;
      if (window.opener) {
        window.opener.postMessage({ type: "wowPetsAuth", data: data }, "");
      }
    } catch (e) {}
    window.close();
    setTimeout(function(){ document.body.innerText = "Puedes cerrar esta ventana."; }, 1000);
  })();
</script>;
  return { statusCode: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }, body };
}

function htmlError(message) {
  const body = <!doctype html><meta charset="utf-8"><p></p>;
  return { statusCode: 400, headers: { "Content-Type": "text/html; charset=utf-8" }, body };
}

function parseCookies(str) {
  return (str || "").split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join("="));
    return acc;
  }, {});
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;" }[c]));
}