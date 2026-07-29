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

function Home() {
  const [report, setReport] =
    useState(EMPTY_REPORT);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let componentIsActive = true;
    let currentController = null;

    async function loadReport() {
      if (
        document.visibilityState === "hidden"
      ) {
        return;
      }

      if (currentController) {
        currentController.abort();
      }

      currentController =
        new AbortController();

      const freshReport =
        await getReportData(
          "today",
          currentController.signal
        );

      if (
        componentIsActive &&
        freshReport
      ) {
        setReport(freshReport);
      }

      if (componentIsActive) {
        setLoading(false);
      }
    }

    function handleVisibilityChange() {
      if (
        document.visibilityState === "visible"
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
  }, []);

  const totals =
    report?.totals ||
    EMPTY_REPORT.totals;

  const updates = Array.isArray(
    report?.updates
  )
    ? report.updates
    : [];

  const categories = Array.isArray(
    report?.categories
  )
    ? report.categories
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
      {/* Размытый фон по краям */}
      <video
        className="background-video-blur"
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src="/background.mp4"
          type="video/mp4"
        />
      </video>

      {/* Основное видео */}
      <video
        className="background-video-main"
        autoPlay
        muted
        loop
        playsInline
      >
        <source
          src="/background.mp4"
          type="video/mp4"
        />
      </video>

      <div className="video-overlay" />

      <div className="dashboard-content">
        <Header />

        {/* Верхние показатели */}
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

        {/* Обновления и подразделения */}
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
                      Оновлень поки немає
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
              <div className="unit-logo-placeholder">
                6
              </div>

              <div className="unit-info">
                <span className="unit-small">
                  ПІДРОЗДІЛ
                </span>

                <strong>6ББпАК</strong>
              </div>

              <div className="unit-indicator">
                ACTIVE
              </div>
            </div>

            <div className="unit-card">
              <div className="unit-logo-placeholder">
                R
              </div>

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

        {/* Нижние таблицы */}
        <Tables categories={categories} />
      </div>
    </main>
  );
}

export default Home;