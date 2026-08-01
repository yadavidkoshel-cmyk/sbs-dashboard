const API_URL = "/api/report";

const ZERO_TOTALS = {
  targetsHit: 0,
  targetsDestroyed: 0,
  strikeFlights: 0,
  reconFlights: 0,
  personnel: 0,
  personnelDestroyed: 0,
  personnelWounded: 0,
};

function getKyivToday() {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Europe/Kyiv",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
}

function createEmptyTodayReport(data, today) {
  const categories = Array.isArray(
    data?.categories
  )
    ? data.categories.map((item) => ({
        ...item,
        hit: 0,
        destroyed: 0,
      }))
    : [];

  return {
    ...data,

    period: "today",
    reportDate: today,
    selectedMonth: today.slice(0, 7),

    range: {
      from: today,
      to: today,
    },

    totals: {
      ...ZERO_TOTALS,
    },

    categories: categories,
    updates: [],
  };
}

export async function getReportData(
  period = "today",
  month = "",
  signal
) {
  try {
    const params = new URLSearchParams({
      period,
      t: String(Date.now()),
    });

    if (period === "month" && month) {
      params.set("month", month);
    }

    const response = await fetch(
      `${API_URL}?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        signal,

        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status}`
      );
    }

    const data = await response.json();

    /*
      Якщо за реальну поточну дату
      звіт ще не опублікований,
      режим «СЬОГОДНІ» показує нулі,
      а не останній звіт за вчора.
    */

    if (period === "today") {
      const today = getKyivToday();

      if (data?.reportDate !== today) {
        return createEmptyTodayReport(
          data,
          today
        );
      }
    }

    return data;

  } catch (error) {
    if (error?.name === "AbortError") {
      return null;
    }

    console.error(
      "Помилка завантаження звіту:",
      error
    );

    return null;
  }
}

function parseReportDate(value) {
  const match = String(value || "").match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    year,
    month - 1,
    day
  );

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function formatReportDate(value) {
  const date = parseReportDate(value);

  if (!date) {
    return "ДАНИХ НЕМАЄ";
  }

  return new Intl.DateTimeFormat(
    "uk-UA",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

export function formatShortDate(value) {
  const date = parseReportDate(value);

  if (!date) {
    return "--";
  }

  return new Intl.DateTimeFormat(
    "uk-UA",
    {
      day: "2-digit",
      month: "2-digit",
    }
  ).format(date);
}
