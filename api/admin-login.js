import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const COOKIE_NAME = "rarog_admin_session";
const SESSION_SECONDS = 60 * 60 * 8;

function safeEqual(firstValue, secondValue) {
  const first = Buffer.from(String(firstValue));
  const second = Buffer.from(String(secondValue));

  if (first.length !== second.length) {
    return false;
  }

  return timingSafeEqual(first, second);
}

function createSignature(value, secret) {
  return createHmac("sha256", secret)
    .update(value)
    .digest("base64url");
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  const adminPassword =
    process.env.ADMIN_PASSWORD;

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return res.status(500).json({
      ok: false,
      error: "Захист адміністратора не налаштований",
    });
  }

  const password =
    typeof req.body?.password === "string"
      ? req.body.password
      : "";

  if (
    !password ||
    !safeEqual(password, adminPassword)
  ) {
    return res.status(401).json({
      ok: false,
      error: "Невірний пароль",
    });
  }

  const expiresAt =
    Date.now() + SESSION_SECONDS * 1000;

  const payload = String(expiresAt);

  const signature = createSignature(
    payload,
    sessionSecret
  );

  const token = `${payload}.${signature}`;

  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_SECONDS}`
  );

  return res.status(200).json({
    ok: true,
    message: "Вхід виконано",
  });
}