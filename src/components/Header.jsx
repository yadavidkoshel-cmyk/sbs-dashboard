import {
  useEffect,
  useState,
} from "react";

import {
  FaClock,
  FaCalendarAlt,
  FaChevronDown,
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

const months = [
  { number: "01", name: "Січень" },
  { number: "02", name: "Лютий" },
  { number: "03", name: "Березень" },
  { number: "04", name: "Квітень" },
  { number: "05", name: "Травень" },
  { number: "06", name: "Червень" },
  { number: "07", name: "Липень" },
  { number: "08", name: "Серпень" },
  { number: "09", name: "Вересень" },
  { number: "10", name: "Жовтень" },
  { number: "11", name: "Листопад" },
  { number: "12", name: "Грудень" },
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

  const dayText =
    currentTime.toLocaleDateString(
      "uk-UA",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
      }
    );

  const selectedYear =
    selectedMonth?.split("-")?.[0] ||
    reportDate?.split("-")?.[0] ||
    String(currentTime.getFullYear());

  const currentMonthNumber = String(
    currentTime.getMonth() + 1
  ).padStart(2, "0");

  const safeSelectedMonth =
    /^\d{4}-\d{2}$/.test(
      String(selectedMonth || "")
    )
      ? selectedMonth
      : `${selectedYear}-${currentMonthNumber}`;

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

          <div className="report-brand-text">
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
            <div className="clock-icon">
              <FaClock />
            </div>

            <div className="clock-content">
              <span className="clock-label">
                ПОТОЧНИЙ ЧАС
              </span>

              <strong className="clock-time">
                {timeText}
              </strong>

              <span className="clock-date">
                {dayText}
              </span>
            </div>
          </div>

          <label className="month-picker">
            <span className="month-picker-label">
              <FaCalendarAlt />

              ВИБРАТИ МІСЯЦЬ
            </span>

            <div className="month-select-wrapper">
              <select
                value={safeSelectedMonth}
                onChange={(event) =>
                  onMonthChange(
                    event.target.value
                  )
                }
              >
                {months.map((month) => (
                  <option
                    key={month.number}
                    value={`${selectedYear}-${month.number}`}
                  >
                    {month.name}
                  </option>
                ))}
              </select>

              <FaChevronDown className="month-chevron" />
            </div>
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
              <span className="period-number">
                01
              </span>

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
              <span className="period-number">
                07
              </span>

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
              <span className="period-number">
                30
              </span>

              ЗА МІСЯЦЬ
            </button>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;