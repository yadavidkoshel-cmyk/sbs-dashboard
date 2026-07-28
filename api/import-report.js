function normalizeDate(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const direct = value.match(/^\d{4}-\d{2}-\d{2}$/);

    if (direct) {
      return value;
    }
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function supabaseRequest(path, options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase environment variables are missing");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/${path}`,
    {
      ...options,

      headers: {
        apikey: secretKey,
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
        ...(options.headers || {}),
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();

    throw new Error(
      `Supabase error ${response.status}: ${text}`
    );
  }

  return response;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const {
      reportDate,
      totals,
      categories,
      updates,
    } = req.body || {};

    const normalizedDate = normalizeDate(reportDate);

    if (!normalizedDate) {
      return res.status(400).json({
        error: "Invalid report date",
        message: "Не вдалося визначити дату звіту",
      });
    }

    if (!totals) {
      return res.status(400).json({
        error: "Missing totals",
        message: "Відсутні підсумкові дані",
      });
    }

    const safeCategories = Array.isArray(categories)
      ? categories
      : [];

    const safeUpdates = Array.isArray(updates)
      ? updates
      : [];

    /* =========================================
       ВИДАЛЯЄМО СТАРІ ДАНІ ЗА ЦЮ ДАТУ
    ========================================= */

    await Promise.all([
      supabaseRequest(
        `daily_reports?report_date=eq.${normalizedDate}`,
        {
          method: "DELETE",
        }
      ),

      supabaseRequest(
        `report_categories?report_date=eq.${normalizedDate}`,
        {
          method: "DELETE",
        }
      ),

      supabaseRequest(
        `operational_updates?report_date=eq.${normalizedDate}`,
        {
          method: "DELETE",
        }
      ),
    ]);

    /* =========================================
       DAILY REPORT
    ========================================= */

    const dailyReport = {
      report_date: normalizedDate,

      targets_hit:
        Number(totals.targetsHit) || 0,

      targets_destroyed:
        Number(totals.targetsDestroyed) || 0,

      strike_flights:
        Number(totals.strikeFlights) || 0,

      recon_flights:
        Number(totals.reconFlights) || 0,

      personnel:
        Number(totals.personnel) || 0,

      personnel_destroyed:
        Number(totals.personnelDestroyed) || 0,

      personnel_wounded:
        Number(totals.personnelWounded) || 0,
    };

    await supabaseRequest(
      "daily_reports",
      {
        method: "POST",
        body: JSON.stringify(dailyReport),
      }
    );

    /* =========================================
       CATEGORIES
    ========================================= */

    if (safeCategories.length > 0) {
      const categoryRows = safeCategories
        .filter((item) => item?.name)
        .map((item) => ({
          report_date: normalizedDate,

          category: String(item.name),

          hit:
            Number(item.hit) || 0,

          destroyed:
            Number(item.destroyed) || 0,
        }));

      if (categoryRows.length > 0) {
        await supabaseRequest(
          "report_categories",
          {
            method: "POST",
            body: JSON.stringify(categoryRows),
          }
        );
      }
    }

    /* =========================================
       OPERATIONAL UPDATES
    ========================================= */

    if (safeUpdates.length > 0) {
      const updateRows = safeUpdates
        .filter((item) => item?.title)
        .map((item) => ({
          report_date:
            normalizeDate(item.date) ||
            normalizedDate,

          title:
            String(item.title),

          description:
            item.description
              ? String(item.description)
              : "",

          is_new:
            Boolean(item.isNew),
        }));

      if (updateRows.length > 0) {
        await supabaseRequest(
          "operational_updates",
          {
            method: "POST",
            body: JSON.stringify(updateRows),
          }
        );
      }
    }

    return res.status(200).json({
      success: true,
      reportDate: normalizedDate,
      categoriesSaved: safeCategories.length,
      updatesSaved: safeUpdates.length,
    });
  } catch (error) {
    console.error(
      "IMPORT REPORT ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to import report",
      message: error.message,
    });
  }
}