import { useEffect, useState } from "react";

import Header from "../components/Header";
import Tables from "../components/Tables";

import {
  getReportData,
  formatShortDate,
} from "../services/reportService";

import "../styles/Home.css";

const EMPTY_REPORT = {
  reportDate: null,

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

function getCurrentMonth() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

function UnitLogo({
  src,
  alt,
  fallback,
}) {
  const [imageFailed, setImageFailed] =
    useState(false);

  return (
    <div className="unit-logo">
      {imageFailed ? (
        <span className="unit-logo-fallback">
          {fallback}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() =>
            setImageFailed(true)
          }
        />
      )}
    </div>
  );
}

function Home() {
  const [report, setReport] =
    useState(EMPTY_REPORT);

  const [loading, setLoading] =
    useState(true);

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] = useState("today");

  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(getCurrentMonth());

  useEffect(() => {
    let componentIsActive = true;
    let requestIsRunning = false;
    let currentController = null;

    async function loadReport() {
      if (
        document.visibilityState ===
        "hidden"
      ) {
        return;
      }

      if (requestIsRunning) {
        return;
      }

      requestIsRunning = true;

      currentController =
        new AbortController();

      try {
        const freshReport =
          await getReportData(
            selectedPeriod,
            selectedMonth,
            currentController.signal
          );

        if (
          componentIsActive &&
          freshReport
        ) {
          setReport(freshReport);
        }
      } finally {
        requestIsRunning = false;

        if (componentIsActive) {
          setLoading(false);
        }
      }
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        loadReport();
      }
    }

    loadReport();

    const updateInterval = setInterval(
      loadReport,
      1000
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      componentIsActive = false;

      clearInterval(updateInterval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );

      if (currentController) {
        currentController.abort();
      }
    };
  }, [
    selectedPeriod,
    selectedMonth,
  ]);

  function handlePeriodChange(period) {
    setLoading(true);
    setSelectedPeriod(period);
  }

  function handleMonthChange(month) {
    if (!month) {
      return;
    }

    setLoading(true);
    setSelectedMonth(month);
    setSelectedPeriod("month");
  }

  const totals =
    report?.totals ||
    EMPTY_REPORT.totals;

  const categories = Array.isArray(
    report?.categories
  )
    ? report.categories
    : [];

  const updates = Array.isArray(
    report?.updates
  )
    ? report.updates
    : [];

  function showValue(value) {
    if (loading) {
      return "—";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : 0;
  }

  return (
    <main className="dashboard">
      <video
        className="background-video-blur"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source
          src="/background.mp4"
          type="video/mp4"
        />
      </video>

      <video
        className="background-video-main"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source
          src="/background.mp4"
          type="video/mp4"
        />
      </video>

      <div className="video-overlay" />

      <div className="dashboard-content">
        <Header
          selectedPeriod={
            selectedPeriod
          }
          onPeriodChange={
            handlePeriodChange
          }
          selectedMonth={
            selectedMonth
          }
          onMonthChange={
            handleMonthChange
          }
          reportDate={
            report?.reportDate
          }
        />

        <section className="stats-row">
          <article className="stat-card">
            <div className="stat-part">
              <div className="stat-value">
                {showValue(
                  totals.targetsHit
                )}
              </div>

              <div className="stat-label">
                УРАЖЕНО ЦІЛЕЙ
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-part">
              <div className="stat-value">
                {showValue(
                  totals.targetsDestroyed
                )}
              </div>

              <div className="stat-label">
                В Т.Ч. ЗНИЩЕНО
              </div>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-part">
              <div className="stat-value">
                {showValue(
                  totals.strikeFlights
                )}
              </div>

              <div className="stat-label">
                УДАРНИХ ВИЛЬОТІВ
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-part">
              <div className="stat-value">
                {showValue(
                  totals.reconFlights
                )}
              </div>

              <div className="stat-label">
                РОЗВІД. ВИЛЬОТІВ
              </div>
            </div>
          </article>

          <article className="stat-card">
            <div className="stat-part">
              <div className="stat-value">
                {showValue(
                  totals.personnel
                )}
              </div>

              <div className="stat-label">
                ОС РОВ
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-part">
              <div className="stat-value">
                {showValue(
                  totals.personnelDestroyed
                )}
              </div>

              <div className="stat-label">
                ЗНИЩЕНО
              </div>
            </div>

            <div className="stat-divider" />

            <div className="stat-part">
              <div className="stat-value">
                {showValue(
                  totals.personnelWounded
                )}
              </div>

              <div className="stat-label">
                ПОРАНЕНО
              </div>
            </div>
          </article>
        </section>

        <section className="dashboard-info-grid">
          <article className="operations-box">
            <div className="section-heading">
              <span className="section-number">
                01
              </span>

              <div>
                <div className="section-kicker">
                  LIVE FEED
                </div>

                <h2>
                  ОПЕРАТИВНІ ОНОВЛЕННЯ
                </h2>
              </div>
            </div>

            <div className="operations-list">
              {loading && (
                <div className="operation-item">
                  <div className="operation-date">
                    --
                  </div>

                  <div className="operation-line" />

                  <div className="operation-text">
                    Завантаження даних...
                  </div>

                  <div />
                </div>
              )}

              {!loading &&
                updates.length === 0 && (
                  <div className="operation-item">
                    <div className="operation-date">
                      --
                    </div>

                    <div className="operation-line" />

                    <div className="operation-text">
                      Оновлень за цей
                      період немає
                    </div>

                    <div />
                  </div>
                )}

              {!loading &&
                updates.map(
                  (update, index) => (
                    <div
                      className="operation-item"
                      key={`${update.date}-${update.title}-${index}`}
                    >
                      <div className="operation-date">
                        {formatShortDate(
                          update.date
                        )}
                      </div>

                      <div className="operation-line" />

                      <div className="operation-text">
                        <div>
                          {update.title}
                        </div>

                        {update.description && (
                          <div className="operation-description">
                            {
                              update.description
                            }
                          </div>
                        )}
                      </div>

                      {update.isNew ? (
                        <div className="operation-status">
                          NEW
                        </div>
                      ) : (
                        <div />
                      )}
                    </div>
                  )
                )}
            </div>
          </article>

          <aside className="units-box">
            <div className="section-heading">
              <span className="section-number">
                02
              </span>

              <div>
                <div className="section-kicker">
                  UNITS
                </div>

                <h2>ПІДРОЗДІЛИ</h2>
              </div>
            </div>

            <div className="unit-card">
              <UnitLogo
                src="/logos/6bbpak-logo.png"
                alt="Логотип 6 бБпАК"
                fallback="6"
              />

              <div className="unit-info">
                <span className="unit-small">
                  ПІДРОЗДІЛ
                </span>

                <strong>6 бБпАК</strong>
              </div>

              <div className="unit-indicator">
                ACTIVE
              </div>
            </div>

            <div className="unit-card">
              <UnitLogo
                src="/logos/rarog-logo.png"
                alt="Логотип RAROG"
                fallback="R"
              />

              <div className="unit-info">
                <span className="unit-small">
                  ПІДРОЗДІЛ
                </span>

                <strong>RAROG</strong>
              </div>

              <div className="unit-indicator">
                ACTIVE
              </div>
            </div>
          </aside>
        </section>

        <Tables categories={categories} />
      </div>
    </main>
  );
}

export default Home;