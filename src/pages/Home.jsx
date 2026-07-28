import Header from "../components/Header";
import Tables from "../components/Tables";
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
  return (
    <main className="dashboard">

      {/* РОЗМИТЕ ВІДЕО НА ВЕСЬ ЕКРАН */}
      <video
        className="background-video-blur"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* ОСНОВНЕ ВІДЕО БЕЗ РОЗТЯГУВАННЯ */}
      <video
        className="background-video-main"
        autoPlay
        muted
        loop
        playsInline
      >
        <source src="/background.mp4" type="video/mp4" />
      </video>

      {/* ЛЕГКЕ ЗАТЕМНЕННЯ */}
      <div className="video-overlay" />

      <div className="dashboard-content">

        <Header />

        <section className="stats-row">

          <div className="stat-card">
            <StatPart value="60" label="УРАЖЕНО ЦІЛЕЙ" />
            <div className="stat-divider" />
            <StatPart value="14" label="В Т.Ч. ЗНИЩЕНО" />
          </div>

          <div className="stat-card">
            <StatPart value="301" label="УДАРНИХ ВИЛЬОТІВ" />
            <div className="stat-divider" />
            <StatPart value="225" label="РОЗВІД. ВИЛЬОТІВ" />
          </div>

          <div className="stat-card">
            <StatPart value="1" label="ОС РОВ" />
            <div className="stat-divider" />
            <StatPart value="0" label="ЗНИЩЕНО" />
            <div className="stat-divider" />
            <StatPart value="1" label="ПОРАНЕНО" />
          </div>

        </section>

        <section className="dashboard-info-grid">

          <div className="operations-box">

            <div className="section-heading">
              <span className="section-number">01</span>

              <div>
                <div className="section-kicker">LIVE FEED</div>
                <h2>ОПЕРАТИВНІ ОНОВЛЕННЯ</h2>
              </div>
            </div>

            <div className="operations-list">

              <div className="operation-item">
                <div className="operation-date">28.07</div>
                <div className="operation-line" />
                <div className="operation-text">
                  Оновлено добові показники звіту
                </div>
                <span className="operation-status">NEW</span>
              </div>

              <div className="operation-item">
                <div className="operation-date">28.07</div>
                <div className="operation-line" />
                <div className="operation-text">
                  Дані синхронізовано з поточним періодом
                </div>
              </div>

              <div className="operation-item">
                <div className="operation-date">27.07</div>
                <div className="operation-line" />
                <div className="operation-text">
                  Сформовано попередній добовий звіт
                </div>
              </div>

            </div>

          </div>

          <div className="units-box">

            <div className="section-heading compact-heading">
              <span className="section-number">02</span>

              <div>
                <div className="section-kicker">UNITS</div>
                <h2>ПІДРОЗДІЛИ</h2>
              </div>
            </div>

            <div className="unit-card">
              <div className="unit-logo-placeholder">6</div>

              <div className="unit-info">
                <span className="unit-small">ПІДРОЗДІЛ</span>
                <strong>6ББпАК</strong>
              </div>

              <div className="unit-indicator">
                ACTIVE
              </div>
            </div>

            <div className="unit-card">
              <div className="unit-logo-placeholder">R</div>

              <div className="unit-info">
                <span className="unit-small">ПІДРОЗДІЛ</span>
                <strong>RAROG</strong>
              </div>

              <div className="unit-indicator">
                ACTIVE
              </div>
            </div>

          </div>

        </section>

        <Tables />

      </div>

    </main>
  );
}

export default Home;