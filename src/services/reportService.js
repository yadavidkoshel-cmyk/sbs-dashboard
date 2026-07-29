const API_URL = "/api/report";

export async function getReportData(
  period = "today",
  signal
) {
  try {
    const response = await fetch(
      `${API_URL}?period=${period}&t=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
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

    return await response.json();
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

export function formatReportDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "uk-UA",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

export function formatShortDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
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