const API_URL = "/api/report";

export async function getReportData(period = "today") {
  try {
    const response = await fetch(`${API_URL}?period=${period}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Помилка завантаження звіту:", error);

    return {
      period,
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
}

export function formatReportDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatShortDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
  });
}