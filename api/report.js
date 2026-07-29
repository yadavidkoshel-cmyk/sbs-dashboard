const ALLOWED_PERIODS = [
  "today",
  "week",
  "month",
];

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}

function validMonth(value) {
  return /^\d{4}-\d{2}$/.test(
    String(value || "")
  );
}

function parseDate(value) {
  return new Date(
    `${value}T00:00:00.000Z`
  );
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

function getMonthRange(monthValue) {
  const [yearValue, monthNumber] =
    monthValue.split("-").map(Number);

  const firstDay = new Date(
    Date.UTC(
      yearValue,
      monthNumber - 1,
      1
    )
  );

  const lastDay = new Date(
    Date.UTC(
      yearValue,
      monthNumber,
      0
    )
  );

  return {
    from: formatDate(firstDay),
    to: formatDate(lastDay),
  };
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

async function getLatestReportDate() {
  const rows = await supabaseGet(
    "daily_reports" +
      "?select=report_date" +
      "&order=report_date.desc" +
      "&limit=1"
  );

  return rows?.[0]?.report_date || null;
}

function getDateRange(
  period,
  latestDate,
  selectedMonth
) {
  if (period === "month") {
    const monthValue = validMonth(
      selectedMonth
    )
      ? selectedMonth
      : latestDate.slice(0, 7);

    return {
      ...getMonthRange(monthValue),
      month: monthValue,
    };
  }

  if (period === "week") {
    const endDate =
      parseDate(latestDate);

    const startDate =
      new Date(endDate);

    startDate.setUTCDate(
      startDate.getUTCDate() - 6
    );

    return {
      from: formatDate(startDate),
      to: latestDate,
      month: null,
    };
  }

  return {
    from: latestDate,
    to: latestDate,
    month: null,
  };
}

function createDateFilter(range) {
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

function emptyTotals() {
  return {
    targetsHit: 0,
    targetsDestroyed: 0,
    strikeFlights: 0,
    reconFlights: 0,
    personnel: 0,
    personnelDestroyed: 0,
    personnelWounded: 0,
  };
}

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
    const requestedPeriod = String(
      req.query?.period || "today"
    ).toLowerCase();

    const period =
      ALLOWED_PERIODS.includes(
        requestedPeriod
      )
        ? requestedPeriod
        : "today";

    const selectedMonth = String(
      req.query?.month || ""
    );

    const latestDate =
      await getLatestReportDate();

    if (!latestDate) {
      return res.status(200).json({
        period,
        reportDate: null,
        selectedMonth: null,
        range: {
          from: null,
          to: null,
        },
        totals: emptyTotals(),
        categories: [],
        updates: [],
      });
    }

    const range = getDateRange(
      period,
      latestDate,
      selectedMonth
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
      emptyTotals()
    );

    const categoryMap = new Map();

    for (const row of categoryRows) {
      const name = String(
        row.category || ""
      ).trim();

      if (!name) {
        continue;
      }

      const current =
        categoryMap.get(name) || {
          name,
          hit: 0,
          destroyed: 0,
        };

      current.hit += toNumber(
        row.hit
      );

      current.destroyed += toNumber(
        row.destroyed
      );

      categoryMap.set(
        name,
        current
      );
    }

    const categories = Array.from(
      categoryMap.values()
    );

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

    const displayedReportDate =
      dailyReports.length > 0
        ? dailyReports[
            dailyReports.length - 1
          ].report_date
        : null;

    return res.status(200).json({
      period,

      reportDate:
        displayedReportDate,

      latestReportDate:
        latestDate,

      selectedMonth:
        range.month,

      range: {
        from: range.from,
        to: range.to,
      },

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