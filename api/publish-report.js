import crypto from "node:crypto";

function safeCompare(firstValue, secondValue) {
  const first = Buffer.from(String(firstValue || ""));
  const second = Buffer.from(String(secondValue || ""));

  if (first.length !== second.length) {
    return false;
  }

  return crypto.timingSafeEqual(first, second);
}

function normalizeDate(value) {
  const text = String(value || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Math.max(0, Math.round(number));
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed",
    });
  }

  const publishSecret = process.env.PUBLISH_SECRET;
  const receivedSecret = req.headers["x-rarog-secret"];

  if (!publishSecret) {
    return res.status(500).json({
      ok: false,
      error: "PUBLISH_SECRET is not configured",
    });
  }

  if (!safeCompare(receivedSecret, publishSecret)) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized",
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return res.status(500).json({
      ok: false,
      error: "Supabase environment variables are missing",
    });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body || {};

  const reportDate = normalizeDate(body.reportDate);

  if (!reportDate) {
    return res.status(400).json({
      ok: false,
      error: "Invalid report date",
    });
  }

  const totals = body.totals || {};

  const dailyReport = {
    report_date: reportDate,

    targets_hit: toNumber(
      totals.targetsHit
    ),

    targets_destroyed: toNumber(
      totals.targetsDestroyed
    ),

    strike_flights: toNumber(
      totals.strikeFlights
    ),

    recon_flights: toNumber(
      totals.reconFlights
    ),

    personnel: toNumber(
      totals.personnel
    ),

    personnel_destroyed: toNumber(
      totals.personnelDestroyed
    ),

    personnel_wounded: toNumber(
      totals.personnelWounded
    ),
  };

  const categories = Array.isArray(body.categories)
    ? body.categories
        .filter((item) =>
          String(item?.category || "").trim()
        )
        .map((item) => ({
          report_date: reportDate,
          category: String(
            item.category
          ).trim(),
          hit: toNumber(item.hit),
          destroyed: toNumber(
            item.destroyed
          ),
        }))
    : [];

  const updates = Array.isArray(body.updates)
    ? body.updates
        .filter((item) => {
          const title = String(
            item?.title || ""
          ).trim();

          return title && item?.show !== false;
        })
        .map((item, index) => ({
          report_date:
            normalizeDate(item.date) ||
            reportDate,

          title: String(
            item.title
          ).trim(),

          description: String(
            item.description || ""
          ).trim(),

          is_new:
            item.isNew === true,

          sort_order: toNumber(
            item.order ?? index + 1
          ),
        }))
    : [];

  async function supabaseRequest(
    path,
    options = {}
  ) {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/${path}`,
      {
        ...options,

        headers: {
          apikey: supabaseSecretKey,
          "Content-Type":
            "application/json",
          Prefer: "return=minimal",
          ...(options.headers || {}),
        },
      }
    );

    const responseText =
      await response.text();

    if (!response.ok) {
      throw new Error(
        `Supabase ${response.status}: ${responseText}`
      );
    }

    return responseText;
  }

  try {
    const dateFilter =
      `report_date=eq.${reportDate}`;

    // Повністю замінюємо дані за цю дату.
    await supabaseRequest(
      `operational_updates?${dateFilter}`,
      {
        method: "DELETE",
      }
    );

    await supabaseRequest(
      `report_categories?${dateFilter}`,
      {
        method: "DELETE",
      }
    );

    await supabaseRequest(
      `daily_reports?${dateFilter}`,
      {
        method: "DELETE",
      }
    );

    await supabaseRequest(
      "daily_reports",
      {
        method: "POST",
        body: JSON.stringify([
          dailyReport,
        ]),
      }
    );

    if (categories.length > 0) {
      await supabaseRequest(
        "report_categories",
        {
          method: "POST",
          body: JSON.stringify(
            categories
          ),
        }
      );
    }

    if (updates.length > 0) {
      await supabaseRequest(
        "operational_updates",
        {
          method: "POST",
          body: JSON.stringify(
            updates
          ),
        }
      );
    }

    return res.status(200).json({
      ok: true,
      reportDate,
      categoriesPublished:
        categories.length,
      updatesPublished:
        updates.length,
      publishedAt:
        new Date().toISOString(),
    });
  } catch (error) {
    console.error(
      "Publish report error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Publication failed",
    });
  }
}