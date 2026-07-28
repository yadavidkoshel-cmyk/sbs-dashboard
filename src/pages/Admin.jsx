import { useState } from "react";
import * as XLSX from "xlsx";

function Admin() {
  const [fileName, setFileName] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setStatus("Файл обрано");
  }

  async function uploadExcel(event) {
    event.preventDefault();

    const input = document.getElementById("excel-file");
    const file = input?.files?.[0];

    if (!file) {
      setStatus("Спочатку обери Excel-файл");
      return;
    }

    try {
      setLoading(true);
      setStatus("Читаємо Excel...");

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      const reportSheet =
        workbook.Sheets["Щоденний звіт"];

      const updatesSheet =
        workbook.Sheets["Оперативні оновлення"];

      if (!reportSheet) {
        throw new Error(
          'Не знайдено аркуш "Щоденний звіт"'
        );
      }

      const reportRows = XLSX.utils.sheet_to_json(
        reportSheet,
        {
          header: 1,
          defval: "",
        }
      );

      const rawReportDate = reportRows?.[2]?.[1] || null;

function excelDateToLocalString(value) {
  if (!value) return null;

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  return String(value);
}

const reportDate = excelDateToLocalString(rawReportDate);

      const strikeFlights =
        Number(reportRows?.[3]?.[1] || 0);

      const reconFlights =
        Number(reportRows?.[4]?.[1] || 0);

      const personnel =
        Number(reportRows?.[3]?.[3] || 0);

      const personnelDestroyed =
        Number(reportRows?.[3]?.[4] || 0);

      const personnelWounded =
        Number(reportRows?.[3]?.[5] || 0);

      const categories = [];

      for (
        let rowIndex = 8;
        rowIndex < reportRows.length;
        rowIndex++
      ) {
        const row = reportRows[rowIndex];

        if (!row) continue;

        const name = row[0];

        if (!name) continue;

        if (
          name === "ПІДСУМОК" ||
          name === "Усі категорії"
        ) {
          continue;
        }

        const hit = Number(row[1] || 0);
        const destroyed = Number(row[2] || 0);

        categories.push({
          name,
          hit,
          destroyed,
        });
      }

      const targetsHit = categories.reduce(
        (sum, item) => sum + item.hit,
        0
      );

      const targetsDestroyed = categories.reduce(
        (sum, item) => sum + item.destroyed,
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
            }
          );

        for (
          let rowIndex = 3;
          rowIndex < updateRows.length;
          rowIndex++
        ) {
          const row = updateRows[rowIndex];

          if (!row || !row[0] || !row[1]) {
            continue;
          }

          const showOnSite =
            String(row[5] || "")
              .trim()
              .toUpperCase();

          if (showOnSite === "НІ") {
            continue;
          }

          updates.push({
  date: excelDateToLocalString(row[0]),
  title: row[1],
            description: row[2] || "",
            isNew:
              String(row[3] || "")
                .trim()
                .toUpperCase() === "ТАК",
            order: Number(row[4] || 999),
          });
        }

        updates.sort(
          (a, b) => a.order - b.order
        );
      }

      const payload = {
        reportDate,

        totals: {
          targetsHit,
          targetsDestroyed,
          strikeFlights,
          reconFlights,
          personnel,
          personnelDestroyed,
          personnelWounded,
        },

        categories,
        updates,
      };

      setStatus("Відправляємо дані на сервер...");

      const response = await fetch(
        "/api/import-report",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Помилка завантаження"
        );
      }

      setStatus(
        `Готово. Дані за ${result.reportDate} оновлено.`
      );
    } catch (error) {
      console.error(error);

      setStatus(
        `Помилка: ${error.message}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              color: "#b83c31",
              fontSize: "12px",
              fontWeight: "900",
              letterSpacing: "2px",
            }}
          >
            ADMIN PANEL
          </div>

          <h1
            style={{
              fontSize: "34px",
              margin: "8px 0",
            }}
          >
            ОНОВЛЕННЯ ЗВІТУ
          </h1>

          <p
            style={{
              color: "#8d928d",
            }}
          >
            Завантаж Excel-файл зі щоденним
            звітом.
          </p>
        </div>

        <form
          onSubmit={uploadExcel}
          style={{
            border:
              "1px solid rgba(190,190,190,0.35)",
            padding: "30px",
            background:
              "rgba(15,15,15,0.9)",
          }}
        >
          <label
            htmlFor="excel-file"
            style={{
              display: "block",
              border:
                "1px dashed rgba(190,190,190,0.5)",
              padding: "50px 20px",
              textAlign: "center",
              cursor: "pointer",
              marginBottom: "20px",
            }}
          >
            <strong
              style={{
                display: "block",
                marginBottom: "8px",
              }}
            >
              {fileName ||
                "ОБЕРИ EXCEL-ФАЙЛ"}
            </strong>

            <span
              style={{
                color: "#777",
                fontSize: "13px",
              }}
            >
              .xlsx
            </span>
          </label>

          <input
            id="excel-file"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            style={{
              display: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "52px",
              border: "1px solid #b83c31",
              background: loading
                ? "#333"
                : "#b83c31",
              color: "#fff",
              fontSize: "14px",
              fontWeight: "900",
              letterSpacing: "1px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            {loading
              ? "ОБРОБКА..."
              : "ЗАВАНТАЖИТИ НА САЙТ"}
          </button>

          {status && (
            <div
              style={{
                marginTop: "18px",
                padding: "14px",
                background:
                  "rgba(255,255,255,0.04)",
                borderLeft:
                  "3px solid #b83c31",
                color: "#d7dad5",
                fontSize: "13px",
              }}
            >
              {status}
            </div>
          )}
        </form>
      </div>
    </main>
  );
}

export default Admin;