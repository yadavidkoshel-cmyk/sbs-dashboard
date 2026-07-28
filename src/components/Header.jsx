import { useEffect, useState } from "react";
import { FaClock, FaChevronDown } from "react-icons/fa";
import "../styles/Header.css";

function Header() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString("uk-UA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const date = now.toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const units = [
    "6ББпАК",
    "RAROG",
    "6ББпАК",
    "RAROG",
    "6ББпАК",
    "RAROG",
    "6ББпАК",
    "RAROG",
  ];

  return (
    <>
      <div className="unit-ticker">
        <div className="ticker-track">
          {[...units, ...units].map((unit, index) => (
            <div
              className={`ticker-item ${
                unit === "RAROG"
                  ? "ticker-rarog"
                  : "ticker-6bbpak"
              }`}
              key={index}
            >
              <span className="ticker-symbol">
                ◆
              </span>

              <span className="ticker-text">
                {unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <header className="report-header">

        <section className="report-brand">

          <div className="report-back">
            ❮
          </div>

          <div className="report-emblem">
            ◆
          </div>

          <div className="report-title">

            <span className="report-title-white">
              ЗВІТ
            </span>

            <span className="report-title-orange">
              427 РАРОГ
            </span>

          </div>

        </section>

        <section className="report-controls">

          <div className="report-control time-control">

            <FaClock className="control-icon" />

            <div>

              <div className="control-time">
                {time}
              </div>

              <div className="control-date">
                {date}
              </div>

            </div>

          </div>

          <div className="report-control">

            <div className="control-main">
              Липень
            </div>

          </div>

          <div className="report-control period-control">

            <div className="control-main">
              Сьогодні
            </div>

            <FaChevronDown className="period-arrow" />

          </div>

        </section>

      </header>
    </>
  );
}

export default Header;