const ALLOWED_PERIODS = [
  "today",
  "week",
  "month",
  "all",
];

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function parseDate(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDate(date) {
  const year = date.getUTCFullYear();

  const month = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getUTCDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function supabaseGet(path) {
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
      method: "GET",

      headers: {
        apikey: secretKey,
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    const responseText =
      await response.text();

    throw new Error(
      `Supabase error ${response.status}: ${responseText}`
    );
  }

  return response.json();
}

/* =========================================
   ПОСЛЕДНЯЯ ЗАГРУЖЕННАЯ ДАТА
========================================= */

async function getLatestReportDate() {
  const rows = await supabaseGet(
    "daily_reports" +
      "?select=report_date" +
      "&order=report_date.desc" +
      "&limit=1"
  );

  return rows?.[0]?.report_date || null;
}

/* =========================================
   ДИАПАЗОН
========================================= */

function getDateRange(period, latestDate) {
  if (!latestDate) {
    return {
      from: null,
      to: null,
    };
  }

  if (period === "all") {
    return {
      from: null,
      to: null,
    };
  }

  if (period === "today") {
    return {
      from: latestDate,
      to: latestDate,
    };
  }

  const endDate = parseDate(latestDate);

  if (period === "week") {
    const startDate =
      new Date(endDate);

    startDate.setUTCDate(
      startDate.getUTCDate() - 6
    );

    return {
      from: formatDate(startDate),
      to: latestDate,
    };
  }

  if (period === "month") {
    const year =
      endDate.getUTCFullYear();

    const month =
      endDate.getUTCMonth();

    const startDate = new Date(
      Date.UTC(year, month, 1)
    );

    const lastDate = new Date(
      Date.UTC(year, month + 1, 0)
    );

    return {
      from: formatDate(startDate),
      to: formatDate(lastDate),
    };
  }

  return {
    from: latestDate,
    to: latestDate,
  };
}

function createDateFilter(range) {
  if (!range.from || !range.to) {
    return "";
  }

  if (range.from === range.to) {
    return (
      `&report_date=eq.${range.from}`
    );
  }

  return (
    `&report_date=gte.${range.from}` +
    `&report_date=lte.${range.to}`
  );
}

/* =========================================
   ПУСТОЙ ОТВЕТ
========================================= */

function createEmptyResponse(period) {
  return {
    period,
    reportDate: null,

    range: {
      from: null,
      to: null,
    },

    totals: {
      targetsHit: 0,
      targetsDestroyed: 0,
      strikeFlights: 0,
      reconFlights: 0,
      personnel: 0,
      personnelDestroyed: 0,
      personnelWounded: 0,
    },

    categories: [],
    updates: [],
  };
}

/* =========================================
   API
========================================= */

export default async function handler(
  req,
  res
) {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const requestedPeriod =
      String(
        req.query?.period || "today"
      ).toLowerCase();

    const period =
      ALLOWED_PERIODS.includes(
        requestedPeriod
      )
        ? requestedPeriod
        : "today";

    const latestDate =
      await getLatestReportDate();

    if (!latestDate) {
      return res
        .status(200)
        .json(
          createEmptyResponse(period)
        );
    }

    const range = getDateRange(
      period,
      latestDate
    );

    const dateFilter =
      createDateFilter(range);

    const [
      dailyReports,
      categoryRows,
      updateRows,
    ] = await Promise.all([
      supabaseGet(
        "daily_reports" +
          "?select=*" +
          dateFilter +
          "&order=report_date.asc"
      ),

      supabaseGet(
        "report_categories" +
          "?select=*" +
          dateFilter +
          "&order=report_date.asc,id.asc"
      ),

      supabaseGet(
        "operational_updates" +
          "?select=*" +
          dateFilter +
          "&order=report_date.desc,id.asc"
      ),
    ]);

    /* =====================================
       ОБЩИЕ ПОКАЗАТЕЛИ
    ===================================== */

    const totals = dailyReports.reduce(
      (result, row) => {
        result.targetsHit += toNumber(
          row.targets_hit
        );

        result.targetsDestroyed +=
          toNumber(
            row.targets_destroyed
          );

        result.strikeFlights += toNumber(
          row.strike_flights
        );

        result.reconFlights += toNumber(
          row.recon_flights
        );

        result.personnel += toNumber(
          row.personnel
        );

        result.personnelDestroyed +=
          toNumber(
            row.personnel_destroyed
          );

        result.personnelWounded +=
          toNumber(
            row.personnel_wounded
          );

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

    /* =====================================
       КАТЕГОРИИ
    ===================================== */

    const categoryMap = new Map();

    for (const row of categoryRows) {
      const name = String(
        row.category || ""
      ).trim();

      if (!name) {
        continue;
      }

      const previous =
        categoryMap.get(name) || {
          name,
          hit: 0,
          destroyed: 0,
        };

      previous.hit += toNumber(
        row.hit
      );

      previous.destroyed += toNumber(
        row.destroyed
      );

      categoryMap.set(
        name,
        previous
      );
    }

    const categories = Array.from(
      categoryMap.values()
    );

    /* =====================================
       ОПЕРАТИВНЫЕ ОБНОВЛЕНИЯ
    ===================================== */

    const updates = updateRows
      .map((row) => ({
        date: row.report_date,

        title: String(
          row.title || ""
        ).trim(),

        description: String(
          row.description || ""
        ).trim(),

        isNew: Boolean(row.is_new),
      }))
      .filter((item) => item.title);

    return res.status(200).json({
      period,

      reportDate: latestDate,

      range,

      totals,

      categories,

      updates,
    });
  } catch (error) {
    console.error(
      "Report API error:",
      error
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Помилка отримання звіту",
    });
  }
}