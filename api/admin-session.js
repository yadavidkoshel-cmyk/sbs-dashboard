import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const COOKIE_NAME = "rarog_admin_session";

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

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";

  const cookies = cookieHeader.split(";");

  for (const cookie of cookies) {
    const [cookieName, ...cookieValue] =
      cookie.trim().split("=");

    if (cookieName === name) {
      return decodeURIComponent(
        cookieValue.join("=")
      );
    }
  }

  return null;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      authenticated: false,
      error: "Method not allowed",
    });
  }

  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    return res.status(500).json({
      authenticated: false,
      error: "Захист адміністратора не налаштований",
    });
  }

  const token = getCookie(req, COOKIE_NAME);

  if (!token) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  const separatorIndex = token.indexOf(".");

  if (separatorIndex === -1) {
    return res.status(401).json({
      authenticated: false,
    });
  }

  const expiresAt = token.slice(
    0,
    separatorIndex
  );

  const receivedSignature = token.slice(
    separatorIndex + 1
  );

  const expectedSignature = createSignature(
    expiresAt,
    sessionSecret
  );

  const expiresNumber = Number(expiresAt);

  const validSignature = safeEqual(
    receivedSignature,
    expectedSignature
  );

  const validExpiration =
    Number.isFinite(expiresNumber) &&
    expiresNumber > Date.now();

  if (!validSignature || !validExpiration) {
    res.setHeader(
      "Set-Cookie",
      `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
    );

    return res.status(401).json({
      authenticated: false,
    });
  }

  return res.status(200).json({
    authenticated: true,
  });
}