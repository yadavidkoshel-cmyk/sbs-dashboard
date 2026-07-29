import {
  useEffect,
  useState,
} from "react";

import {
  FaClock,
  FaCalendarAlt,
} from "react-icons/fa";

import {
  formatReportDate,
} from "../services/reportService";

import "../styles/Header.css";

const tickerUnits = [
  "RAROG",
  "6ББпАК",
  "RAROG",
  "6ББпАК",
  "RAROG",
  "6ББпАК",
  "RAROG",
  "6ББпАК",
  "RAROG",
  "6ББпАК",
];

function Header({
  selectedPeriod,
  onPeriodChange,
  selectedMonth,
  onMonthChange,
  reportDate,
}) {
  const [currentTime, setCurrentTime] =
    useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const timeText =
    currentTime.toLocaleTimeString(
      "uk-UA",
      {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    );

  const dateText =
    currentTime.toLocaleDateString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );

  return (
    <>
      <div className="unit-ticker">
        <div className="ticker-track">
          {tickerUnits.map(
            (unit, index) => (
              <div
                className={`ticker-item ${
                  unit === "RAROG"
                    ? "ticker-rarog"
                    : "ticker-6bbpak"
                }`}
                key={`${unit}-${index}`}
              >
                <span className="ticker-dot">
                  ◆
                </span>

                {unit}
              </div>
            )
          )}
        </div>
      </div>

      <header className="report-header">
        <div className="report-brand">
          <div className="report-emblem">
            R
          </div>

          <div>
            <div className="report-kicker">
              ЩОДЕННИЙ ЗВІТ
            </div>

            <h1 className="report-title">
              427 РАРОГ
            </h1>

            <div className="report-date">
              Дані станом на:{" "}
              <strong>
                {formatReportDate(
                  reportDate
                )}
              </strong>
            </div>
          </div>
        </div>

        <div className="report-controls">
          <div className="clock-box">
            <FaClock />

            <div>
              <strong>{timeText}</strong>
              <span>{dateText}</span>
            </div>
          </div>

          <label className="month-picker">
            <span>
              <FaCalendarAlt />
              ВИБРАТИ МІСЯЦЬ
            </span>

            <input
              type="month"
              value={selectedMonth}
              onChange={(event) =>
                onMonthChange(
                  event.target.value
                )
              }
            />
          </label>

          <div className="period-buttons">
            <button
              type="button"
              className={
                selectedPeriod === "today"
                  ? "period-button active"
                  : "period-button"
              }
              onClick={() =>
                onPeriodChange("today")
              }
            >
              СЬОГОДНІ
            </button>

            <button
              type="button"
              className={
                selectedPeriod === "week"
                  ? "period-button active"
                  : "period-button"
              }
              onClick={() =>
                onPeriodChange("week")
              }
            >
              ЗА ТИЖДЕНЬ
            </button>

            <button
              type="button"
              className={
                selectedPeriod === "month"
                  ? "period-button active"
                  : "period-button"
              }
              onClick={() =>
                onPeriodChange("month")
              }
            >
              ЗА МІСЯЦЬ
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;