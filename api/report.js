function getDateRange(period) {
  const now = new Date();

  const pad = (n) => String(n).padStart(2, "0");
  const toDateString = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  if (period === "today") {
    const today = toDateString(now);
    return { from: today, to: today };
  }

  if (period === "week") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);

    return {
      from: toDateString(from),
      to: toDateString(now),
    };
  }

  if (period === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      from: toDateString(from),
      to: toDateString(to),
    };
  }

  return {
    from: null,
    to: null,
  };
}

async function supabaseGet(table, period, order = "") {
  const supabaseUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase environment variables are missing");
  }

  const { from, to } = getDateRange(period);

  let url = `${supabaseUrl}/rest/v1/${table}?select=*`;

  if (from && to) {
    url += `&report_date=gte.${from}&report_date=lte.${to}`;
  }

  if (order) {
    url += `&order=${order}`;
  }

  const response = await fetch(url, {
    headers: {
      apikey: secretKey,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  return response.json();
}

export default async function handler(req, res) {
  try {
    const period = req.query.period || "today";

    const allowedPeriods = ["today", "week", "month", "all"];

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({
        error: "Invalid period",
      });
    }

    const [reports, categories, updates] = await Promise.all([
      supabaseGet("daily_reports", period),
      supabaseGet("report_categories", period),
      supabaseGet(
        "operational_updates",
        period,
        "report_date.desc,created_at.desc"
      ),
    ]);

    const totals = reports.reduce(
      (result, row) => {
        result.targetsHit += row.targets_hit || 0;
        result.targetsDestroyed += row.targets_destroyed || 0;

        result.strikeFlights += row.strike_flights || 0;
        result.reconFlights += row.recon_flights || 0;

        result.personnel += row.personnel || 0;
        result.personnelDestroyed += row.personnel_destroyed || 0;
        result.personnelWounded += row.personnel_wounded || 0;

        return result;
      },
      {
        targetsHit: 0,
        targetsDestroyed: 0,

        strikeFlights: 0,
        reconFlights: 0,

        personnel: 0,
        personnelDestroyed: 0,
        personnelWounded: 0,
      }
    );

    const categoryMap = new Map();

    for (const row of categories) {
      const current = categoryMap.get(row.category) || {
        name: row.category,
        hit: 0,
        destroyed: 0,
      };

      current.hit += row.hit || 0;
      current.destroyed += row.destroyed || 0;

      categoryMap.set(row.category, current);
    }

    const categoryResults = Array.from(categoryMap.values());

    const updateResults = updates.map((item) => ({
      date: item.report_date,
      title: item.title,
      description: item.description || "",
      isNew: item.is_new || false,
    }));

    return res.status(200).json({
      period,

      totals,

      categories: categoryResults,

      updates: updateResults,
    });
  } catch (error) {
    console.error("REPORT API ERROR:", error);

    return res.status(500).json({
      error: "Failed to load report",
      message: error.message,
    });
  }
}