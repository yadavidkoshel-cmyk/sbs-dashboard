import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const COOKIE_NAME = "rarog_admin_session";

/* =========================================
   ПРОВЕРКА АДМИН-СЕССИИ
========================================= */

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

function isAdminAuthenticated(req) {
  const sessionSecret =
    process.env.ADMIN_SESSION_SECRET;

  if (!sessionSecret) {
    return false;
  }

  const token = getCookie(req, COOKIE_NAME);

  if (!token) {
    return false;
  }

  const separatorIndex = token.indexOf(".");

  if (separatorIndex === -1) {
    return false;
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

  const signatureIsValid = safeEqual(
    receivedSignature,
    expectedSignature
  );

  const expirationIsValid =
    Number.isFinite(expiresNumber) &&
    expiresNumber > Date.now();

  return signatureIsValid && expirationIsValid;
}

/* =========================================
   ДАТА
========================================= */

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const ukrainianDate = text.match(
    /^(\d{2})[./-](\d{2})[./-](\d{4})$/
  );

  if (ukrainianDate) {
    const [, day, month, year] = ukrainianDate;

    return `${year}-${month}-${day}`;
  }

  const parsedDate = new Date(text);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const year = parsedDate.getUTCFullYear();

  const month = String(
    parsedDate.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    parsedDate.getUTCDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* =========================================
   SUPABASE
========================================= */

async function supabaseRequest(path, options = {}) {
  const supabaseUrl =
    process.env.SUPABASE_URL;

  const secretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error(
      "Змінні Supabase не налаштовані"
    );
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${path}`,
    {
      ...options,

      headers: {
        apikey: secretKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        ...(options.headers || {}),
      },
    }
  );

  if (!response.ok) {
    const responseText = await response.text();

    throw new Error(
      `Supabase error ${response.status}: ${responseText}`
    );
  }

  return response;
}

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

/* =========================================
   API
========================================= */

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  if (!isAdminAuthenticated(req)) {
    return res.status(401).json({
      ok: false,
      error:
        "Потрібно увійти в адміністративну панель",
    });
  }

  try {
    const reportDate = normalizeDate(
      req.body?.reportDate
    );

    if (!reportDate) {
      return res.status(400).json({
        ok: false,
        error: "Некоректна дата звіту",
      });
    }

    const categories = Array.isArray(
      req.body?.categories
    )
      ? req.body.categories
      : [];

    const updates = Array.isArray(
      req.body?.updates
    )
      ? req.body.updates
      : [];

    const encodedDate =
      encodeURIComponent(reportDate);

    /* Удаляем старые данные за эту дату */

    await supabaseRequest(
      `daily_reports?report_date=eq.${encodedDate}`,
      {
        method: "DELETE",
      }
    );

    await supabaseRequest(
      `report_categories?report_date=eq.${encodedDate}`,
      {
        method: "DELETE",
      }
    );

    await supabaseRequest(
      `operational_updates?report_date=eq.${encodedDate}`,
      {
        method: "DELETE",
      }
    );

    /* Основной отчёт */

    await supabaseRequest("daily_reports", {
      method: "POST",

      body: JSON.stringify([
        {
          report_date: reportDate,

          targets_hit: toNumber(
            req.body?.targetsHit
          ),

          targets_destroyed: toNumber(
            req.body?.targetsDestroyed
          ),

          strike_flights: toNumber(
            req.body?.strikeFlights
          ),

          recon_flights: toNumber(
            req.body?.reconFlights
          ),

          personnel: toNumber(
            req.body?.personnel
          ),

          personnel_destroyed: toNumber(
            req.body?.personnelDestroyed
          ),

          personnel_wounded: toNumber(
            req.body?.personnelWounded
          ),
        },
      ]),
    });

    /* Категории */

    const categoryRows = categories
      .map((item) => ({
        report_date: reportDate,

        category: String(
          item?.name ||
          item?.category ||
          ""
        ).trim(),

        hit: toNumber(item?.hit),

        destroyed: toNumber(
          item?.destroyed
        ),
      }))
      .filter((item) => item.category);

    if (categoryRows.length > 0) {
      await supabaseRequest(
        "report_categories",
        {
          method: "POST",
          body: JSON.stringify(categoryRows),
        }
      );
    }

    /* Оперативные обновления */

    const updateRows = updates
      .map((item) => ({
        report_date:
          normalizeDate(
            item?.date ||
            item?.reportDate
          ) || reportDate,

        title: String(
          item?.title || ""
        ).trim(),

        description: String(
          item?.description || ""
        ).trim(),

        is_new: Boolean(
          item?.isNew ??
          item?.is_new
        ),
      }))
      .filter((item) => item.title);

    if (updateRows.length > 0) {
      await supabaseRequest(
        "operational_updates",
        {
          method: "POST",
          body: JSON.stringify(updateRows),
        }
      );
    }

    return res.status(200).json({
      ok: true,
      reportDate,
      message:
        `Дані за ${reportDate} успішно оновлено`,
    });
  } catch (error) {
    console.error(
      "Import report error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Помилка імпорту звіту",
    });
  }
}