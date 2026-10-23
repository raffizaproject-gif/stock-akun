// Proxy kecil ke api.mail.tm dengan header CORS. Deploy di Netlify (Functions).
const ALLOW = /^\/(domains|accounts|token|messages|me|sources)(\/|\?|$)/;

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
    "Access-Control-Max-Age": "86400",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: cors, body: "" };

  const p = (event.queryStringParameters || {}).p || "";
  if (!ALLOW.test(p)) return { statusCode: 400, headers: cors, body: "Path tidak diizinkan" };

  const inH = event.headers || {};
  const headers = { Accept: "application/ld+json" };
  if (inH.authorization) headers.Authorization = inH.authorization;
  if (inH["content-type"]) headers["Content-Type"] = inH["content-type"];

  const noBody = event.httpMethod === "GET" || event.httpMethod === "DELETE";
  const body = noBody ? undefined
    : (event.isBase64Encoded ? Buffer.from(event.body || "", "base64") : event.body);

  try {
    const r = await fetch("https://api.mail.tm" + p, { method: event.httpMethod, headers, body });
    const text = await r.text();
    return {
      statusCode: r.status,
      headers: { ...cors, "Content-Type": r.headers.get("content-type") || "application/json" },
      body: text,
    };
  } catch (e) {
    return { statusCode: 502, headers: cors, body: JSON.stringify({ message: "Proxy gagal: " + e.message }) };
  }
};
