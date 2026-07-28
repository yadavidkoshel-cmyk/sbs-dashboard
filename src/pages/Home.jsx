import { useEffect, useState } from "react";

import Header from "../components/Header";
import Tables from "../components/Tables";
import {
  getReportData,
  formatShortDate,
} from "../services/reportService";

import "../styles/Home.css";

function StatPart({ value, label }) {
  return (
    <div className="stat-part">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Home() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      const data = await getReportData("today");

      setReport(data);
      setLoading(false);
    }

    loadReport();
  }, []);

  const totals = report?.totals || {
    targetsHit: 0,
    targetsDestroyed: 0,
    strikeFlights: 0,
    reconFlights: 0,
    personnel: 0,
    personnelDestroyed: 0,
    personnelWounded: 0,
  };

  const updates = report?.updates || [];

  return (
    <main className="dashboard">

      <video
        className="background-video-blur"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <video
        className="background-video-main"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      <div className="video-overlay" />

      <div className="dashboard-content">

        <Header />

        <section className="stats-row">

          <div className="stat-card">
            <StatPart
              value={loading ? "..." : totals.targetsHit}
              label="УРАЖЕНО ЦІЛЕЙ"
            />

            <div className="stat-divider" />

            <StatPart
              value={loading ? "..." : totals.targetsDestroyed}
              label="В Т.Ч. ЗНИЩЕНО"
            />
          </div>

          <div className="stat-card">
            <StatPart
              value={loading ? "..." : totals.strikeFlights}
              label="УДАРНИХ ВИЛЬОТІВ"
            />

            <div className="stat-divider" />

            <StatPart
              value={loading ? "..." : totals.reconFlights}
              label="РОЗВІД. ВИЛЬОТІВ"
            />
          </div>

          <div className="stat-card">
            <StatPart
              value={loading ? "..." : totals.personnel}
              label="ОС РОВ"
            />

            <div className="stat-divider" />

            <StatPart
              value={loading ? "..." : totals.personnelDestroyed}
              label="ЗНИЩЕНО"
            />

            <div className="stat-divider" />

            <StatPart
              value={loading ? "..." : totals.personnelWounded}
              label="ПОРАНЕНО"
            />
          </div>

        </section>

        <section className="dashboard-info-grid">

          <div className="operations-box">

            <div className="section-heading">
              <span className="section-number">01</span>

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
                  <div className="operation-date">--</div>

                  <div className="operation-line" />

                  <div className="operation-text">
                    Завантаження даних...
                  </div>
                </div>
              )}

              {!loading && updates.length === 0 && (
                <div className="operation-item">
                  <div className="operation-date">--</div>

                  <div className="operation-line" />

                  <div className="operation-text">
                    Оновлень поки немає
                  </div>
                </div>
              )}

              {!loading &&
                updates.map((item, index) => (
                  <div
                    className="operation-item"
                    key={`${item.date}-${item.title}-${index}`}
                  >
                    <div className="operation-date">
                      {formatShortDate(item.date)}
                    </div>

                    <div className="operation-line" />

                    <div className="operation-text">
                      {item.title}

                      {item.description && (
                        <div className="operation-description">
                          {item.description}
                        </div>
                      )}
                    </div>

                    {item.isNew && (
                      <span className="operation-status">
                        NEW
                      </span>
                    )}
                  </div>
                ))}

            </div>

          </div>

          <div className="units-box">

            <div className="section-heading compact-heading">
              <span className="section-number">02</span>

              <div>
                <div className="section-kicker">
                  UNITS
                </div>

                <h2>
                  ПІДРОЗДІЛИ
                </h2>
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

                <strong>
                  6ББпАК
                </strong>
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

                <strong>
                  RAROG
                </strong>
              </div>

              <div className="unit-indicator">
                ACTIVE
              </div>

            </div>

          </div>

        </section>

       <Tables categories={report?.categories || []} />

      </div>

    </main>
  );
}

export default Home;