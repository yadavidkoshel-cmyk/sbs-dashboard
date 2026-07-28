export default function handler(req, res) {
  const period = req.query.period || "today";

  const data = {
    period,

    totals: {
      targetsHit: 60,
      targetsDestroyed: 14,
      strikeFlights: 301,
      reconFlights: 225,
      personnel: 1,
      personnelDestroyed: 0,
      personnelWounded: 1,
    },

    categories: [
      {
        name: "ОС РОВ",
        hit: 1,
        destroyed: 0,
      },
      {
        name: "Точки вильоту дронів",
        hit: 0,
        destroyed: 0,
      },
      {
        name: "Антени",
        hit: 1,
        destroyed: 0,
      },
      {
        name: "Ворожі крила",
        hit: 8,
        destroyed: 6,
      },
      {
        name: "Шахеди та Гербери",
        hit: 1,
        destroyed: 1,
      },
    ],

    updates: [
      {
        date: "2026-07-28",
        title: "Оновлено добові показники звіту",
        description: "",
        isNew: true,
      },
      {
        date: "2026-07-28",
        title: "Дані синхронізовано з поточним періодом",
        description: "",
        isNew: false,
      },
      {
        date: "2026-07-27",
        title: "Сформовано попередній добовий звіт",
        description: "",
        isNew: false,
      },
    ],
  };

  res.status(200).json(data);
}