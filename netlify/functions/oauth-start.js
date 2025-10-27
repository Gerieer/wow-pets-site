exports.handler = async (event) => {
  try {
    const {
      BLIZZARD_CLIENT_ID,
      REDIRECT_URI,
      BLIZZARD_REGION = "eu",
      ALLOWED_ORIGIN = "https://gerieer.github.io"
    } = process.env;

    if (!BLIZZARD_CLIENT_ID || !REDIRECT_URI) {
      return { statusCode: 500, body: "Missing required env vars (BLIZZARD_CLIENT_ID, REDIRECT_URI)" };
    }

    const url = new URL(event.rawUrl || https://);
    const realmSlug = url.searchParams.get("realmSlug") || "";
    const characterName = url.searchParams.get("characterName") || "";
    const region = (url.searchParams.get("region") || BLIZZARD_REGION).toLowerCase();
    const origin = url.searchParams.get("origin") || ALLOWED_ORIGIN;

    const oauthHost = ${region}.battle.net;

    const nonce = cryptoRandomString(24);
    const state = { n: nonce, origin, realmSlug, characterName, region };
    const stateEncoded = Buffer.from(JSON.stringify(state)).toString("base64url");

    const cookie = [
      wow_state_nonce=,
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Path=/",
      Max-Age=600
    ].join("; ");

    const authorizeUrl = new URL(https:///oauth/authorize);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", BLIZZARD_CLIENT_ID);
    authorizeUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authorizeUrl.searchParams.set("scope", "wow.profile");
    authorizeUrl.searchParams.set("state", stateEncoded);

    return {
      statusCode: 302,
      headers: {
        Location: authorizeUrl.toString(),
        "Set-Cookie": cookie,
        "Cache-Control": "no-store"
      },
      body: ""
    };
  } catch (err) {
    return { statusCode: 500, body: oauth-start error:  };
  }
};

function cryptoRandomString(length) {
  const buf = require("crypto").randomBytes(length);
  return buf.toString("base64url").slice(0, length);
}