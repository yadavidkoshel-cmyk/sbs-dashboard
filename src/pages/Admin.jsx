import { useEffect, useState } from "react";
import * as XLSX from "xlsx";

/* =========================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
========================================= */

function toNumber(value) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  const normalized = String(value)
    .trim()
    .replace(",", ".");

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}

function toYesNo(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function toYMD(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return null;
    }

    const year = value.getFullYear();

    const month = String(
      value.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      value.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number") {
    const parsed =
      XLSX.SSF.parse_date_code(value);

    if (parsed) {
      const year = parsed.y;

      const month = String(
        parsed.m
      ).padStart(2, "0");

      const day = String(
        parsed.d
      ).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }
  }

  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const ukrainianDate = text.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/
  );

  if (ukrainianDate) {
    const [, dayValue, monthValue, year] =
      ukrainianDate;

    const day = dayValue.padStart(2, "0");
    const month = monthValue.padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return null;
}

/* =========================================
   СТРАНИЦА
========================================= */

function Admin() {
  const [checkingSession, setCheckingSession] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [loginStatus, setLoginStatus] =
    useState("");

  const [loginLoading, setLoginLoading] =
    useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [uploadStatus, setUploadStatus] =
    useState("");

  const [uploadLoading, setUploadLoading] =
    useState(false);

  /* =========================================
     ПРОВЕРКА СЕССИИ
  ========================================= */

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch(
          "/api/admin-session",
          {
            method: "GET",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        setAuthenticated(response.ok);
      } catch (error) {
        console.error(
          "Session check error:",
          error
        );

        setAuthenticated(false);
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  /* =========================================
     ВХОД
  ========================================= */

  async function handleLogin(event) {
    event.preventDefault();

    if (!password.trim()) {
      setLoginStatus("Введіть пароль");
      return;
    }

    setLoginLoading(true);
    setLoginStatus("Перевірка пароля...");

    try {
      const response = await fetch(
        "/api/admin-login",
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Помилка входу"
        );
      }

      setAuthenticated(true);
      setPassword("");
      setLoginStatus("");
    } catch (error) {
      setLoginStatus(
        error instanceof Error
          ? error.message
          : "Помилка входу"
      );
    } finally {
      setLoginLoading(false);
    }
  }

  /* =========================================
     ЧТЕНИЕ EXCEL
  ========================================= */

  async function readExcelFile(file) {
    const arrayBuffer =
      await file.arrayBuffer();

    const workbook = XLSX.read(
      arrayBuffer,
      {
        type: "array",
        cellDates: false,
      }
    );

    const reportSheet =
      workbook.Sheets["Щоденний звіт"];

    const updatesSheet =
      workbook.Sheets[
        "Оперативні оновлення"
      ];

    if (!reportSheet) {
      throw new Error(
        'Не знайдено аркуш "Щоденний звіт"'
      );
    }

    const reportRows =
      XLSX.utils.sheet_to_json(
        reportSheet,
        {
          header: 1,
          defval: "",
          raw: true,
        }
      );

    const reportDate = toYMD(
      reportRows?.[2]?.[1]
    );

    if (!reportDate) {
      throw new Error(
        "Не вдалося прочитати дату звіту з клітинки B3"
      );
    }

    const strikeFlights = toNumber(
      reportRows?.[3]?.[1]
    );

    const reconFlights = toNumber(
      reportRows?.[4]?.[1]
    );

    const personnel = toNumber(
      reportRows?.[3]?.[3]
    );

    const personnelDestroyed = toNumber(
      reportRows?.[3]?.[4]
    );

    const personnelWounded = toNumber(
      reportRows?.[3]?.[5]
    );

    const categories = reportRows
      .slice(8)
      .map((row) => {
        const name = String(
          row?.[0] || ""
        ).trim();

        return {
          name,
          hit: toNumber(row?.[1]),
          destroyed: toNumber(row?.[2]),
        };
      })
      .filter((item) => {
        const normalizedName =
          item.name.toUpperCase();

        return (
          item.name &&
          normalizedName !== "ПІДСУМОК" &&
          normalizedName !== "УСІ КАТЕГОРІЇ"
        );
      });

    const targetsHit = categories.reduce(
      (sum, item) => sum + item.hit,
      0
    );

    const targetsDestroyed =
      categories.reduce(
        (sum, item) =>
          sum + item.destroyed,
        0
      );

    let updates = [];

    if (updatesSheet) {
      const updateRows =
        XLSX.utils.sheet_to_json(
          updatesSheet,
          {
            header: 1,
            defval: "",
            raw: true,
          }
        );

      updates = updateRows
        .slice(3)
        .map((row) => {
          const title = String(
            row?.[1] || ""
          ).trim();

          const description = String(
            row?.[2] || ""
          ).trim();

          const newValue = toYesNo(
            row?.[3]
          );

          const order = toNumber(
            row?.[4]
          );

          const showValue = toYesNo(
            row?.[5]
          );

          return {
            date:
              toYMD(row?.[0]) ||
              reportDate,

            title,
            description,

            isNew:
              newValue === "ТАК" ||
              newValue === "YES",

            order,

            show:
              showValue !== "НІ" &&
              showValue !== "NO",
          };
        })
        .filter(
          (item) =>
            item.title && item.show
        )
        .sort(
          (first, second) =>
            first.order - second.order
        )
        .map(
          ({
            show,
            order,
            ...item
          }) => item
        );
    }

    return {
      reportDate,
      targetsHit,
      targetsDestroyed,
      strikeFlights,
      reconFlights,
      personnel,
      personnelDestroyed,
      personnelWounded,
      categories,
      updates,
    };
  }

  /* =========================================
     ЗАГРУЗКА НА САЙТ
  ========================================= */

  async function handleUpload() {
    if (!selectedFile) {
      setUploadStatus(
        "Спочатку виберіть Excel-файл"
      );

      return;
    }

    setUploadLoading(true);
    setUploadStatus(
      "Читання та завантаження даних..."
    );

    try {
      const reportData =
        await readExcelFile(selectedFile);

      const response = await fetch(
        "/api/import-report",
        {
          method: "POST",
          credentials: "include",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify(
            reportData
          ),
        }
      );

      const result =
        await response.json();

      if (response.status === 401) {
        setAuthenticated(false);

        throw new Error(
          "Сесію завершено. Увійдіть повторно."
        );
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Помилка завантаження"
        );
      }

      setUploadStatus(
        `Готово. Дані за ${result.reportDate} оновлено.`
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "excel-file"
        );

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error(
        "Upload error:",
        error
      );

      setUploadStatus(
        error instanceof Error
          ? error.message
          : "Помилка завантаження"
      );
    } finally {
      setUploadLoading(false);
    }
  }

  /* =========================================
     ЗАГРУЗКА СТРАНИЦЫ
  ========================================= */

  if (checkingSession) {
    return (
      <main style={styles.page}>
        <div style={styles.panel}>
          <p style={styles.muted}>
            Перевірка доступу...
          </p>
        </div>
      </main>
    );
  }

  /* =========================================
     ФОРМА ВХОДА
  ========================================= */

  if (!authenticated) {
    return (
      <main style={styles.page}>
        <form
          style={styles.loginPanel}
          onSubmit={handleLogin}
        >
          <div style={styles.number}>
            ADMIN
          </div>

          <h1 style={styles.title}>
            Вхід до панелі
          </h1>

          <p style={styles.muted}>
            Введіть пароль адміністратора
          </p>

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(
                event.target.value
              )
            }
            placeholder="Пароль"
            autoComplete="current-password"
            style={styles.input}
            disabled={loginLoading}
          />

          <button
            type="submit"
            style={styles.button}
            disabled={loginLoading}
          >
            {loginLoading
              ? "ПЕРЕВІРКА..."
              : "УВІЙТИ"}
          </button>

          {loginStatus && (
            <p style={styles.status}>
              {loginStatus}
            </p>
          )}

          <a
            href="/"
            style={styles.backLink}
          >
            ← Повернутися на сайт
          </a>
        </form>
      </main>
    );
  }

  /* =========================================
     АДМИН-ПАНЕЛЬ
  ========================================= */

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <div style={styles.number}>
          ADMIN PANEL
        </div>

        <h1 style={styles.title}>
          Завантаження звіту
        </h1>

        <p style={styles.muted}>
          Завантажте готовий Excel-файл.
          Дані за обрану дату будуть
          оновлені на сайті.
        </p>

        <label style={styles.fileBox}>
          <span style={styles.fileTitle}>
            ВИБРАТИ EXCEL-ФАЙЛ
          </span>

          <span style={styles.fileName}>
            {selectedFile
              ? selectedFile.name
              : "Файл не вибрано"}
          </span>

          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            style={{ display: "none" }}
            onChange={(event) => {
              setSelectedFile(
                event.target.files?.[0] ||
                  null
              );

              setUploadStatus("");
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleUpload}
          style={styles.button}
          disabled={uploadLoading}
        >
          {uploadLoading
            ? "ЗАВАНТАЖЕННЯ..."
            : "ЗАВАНТАЖИТИ НА САЙТ"}
        </button>

        {uploadStatus && (
          <p style={styles.status}>
            {uploadStatus}
          </p>
        )}

        <a
          href="/"
          style={styles.backLink}
        >
          ← Відкрити сайт
        </a>
      </section>
    </main>
  );
}

/* =========================================
   СТИЛИ
========================================= */

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top, #12333a 0%, #050808 50%, #020303 100%)",
    color: "#f2f3ef",
    fontFamily:
      "Arial, Helvetica, sans-serif",
  },

  panel: {
    width: "100%",
    maxWidth: "620px",
    padding: "38px",
    background:
      "rgba(5, 9, 9, 0.94)",
    border:
      "1px solid rgba(180, 185, 180, 0.38)",
    borderTop: "3px solid #d84034",
    boxShadow:
      "0 20px 60px rgba(0, 0, 0, 0.65)",
  },

  loginPanel: {
    width: "100%",
    maxWidth: "460px",
    padding: "38px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    background:
      "rgba(5, 9, 9, 0.96)",
    border:
      "1px solid rgba(180, 185, 180, 0.38)",
    borderTop: "3px solid #d84034",
    boxShadow:
      "0 20px 60px rgba(0, 0, 0, 0.65)",
  },

  number: {
    color: "#d84034",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "2px",
  },

  title: {
    margin: "0",
    fontSize: "34px",
    lineHeight: "1.05",
    textTransform: "uppercase",
  },

  muted: {
    margin: "0",
    color: "#9ca29d",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "15px 16px",
    border:
      "1px solid rgba(180, 185, 180, 0.38)",
    background: "#090d0d",
    color: "#ffffff",
    fontSize: "16px",
    outline: "none",
  },

  fileBox: {
    marginTop: "24px",
    minHeight: "110px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
    background:
      "rgba(255, 255, 255, 0.025)",
    border:
      "1px dashed rgba(216, 64, 52, 0.7)",
  },

  fileTitle: {
    color: "#d84034",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  fileName: {
    color: "#d8dad6",
    fontSize: "14px",
    wordBreak: "break-word",
  },

  button: {
    width: "100%",
    marginTop: "6px",
    padding: "16px",
    cursor: "pointer",
    border: "1px solid #d84034",
    background: "#d84034",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "1px",
  },

  status: {
    margin: "0",
    padding: "13px",
    background:
      "rgba(216, 64, 52, 0.1)",
    borderLeft: "3px solid #d84034",
    color: "#e8e9e5",
    fontSize: "14px",
    lineHeight: "1.5",
  },

  backLink: {
    marginTop: "8px",
    color: "#9ca29d",
    fontSize: "13px",
    textDecoration: "none",
  },
};

export default Admin;