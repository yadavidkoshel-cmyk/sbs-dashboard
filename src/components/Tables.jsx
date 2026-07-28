import {
  FaUser,
  FaMapMarkerAlt,
  FaBroadcastTower,
  FaPlane,
  FaShip,
  FaBolt,
  FaSatelliteDish,
  FaTruck,
  FaCrosshairs,
  FaChevronUp,
  FaMotorcycle,
  FaWarehouse,
  FaBuilding,
  FaCamera,
  FaShieldAlt,
  FaCircle,
} from "react-icons/fa";

import {
  leftTable,
  rightTable,
} from "../data/tableData";

import "../styles/Tables.css";

const icons = {
  user: FaUser,
  marker: FaMapMarkerAlt,
  antenna: FaBroadcastTower,
  plane: FaPlane,
  ship: FaShip,
  energy: FaBolt,
  satellite: FaSatelliteDish,
  truck: FaTruck,
  target: FaCrosshairs,
  wing: FaChevronUp,
  motorcycle: FaMotorcycle,
  warehouse: FaWarehouse,
  building: FaBuilding,
  camera: FaCamera,
  shield: FaShieldAlt,
  circle: FaCircle,
};

function ReportTable({ data }) {
  return (
    <div className="report-table">

      {/* ВЕРХНІ НАЗВИ КОЛОНОК */}
      <div className="report-table-columns">

        <div className="category-label">
          КАТЕГОРІЯ
        </div>

        <div>
          УРАЖЕНО
        </div>

        <div>
          ЗНИЩЕНО
        </div>

      </div>

      {/* РЯДКИ ТАБЛИЦІ */}
      <div className="report-table-body">

        {data.map((item, index) => {
          const Icon = icons[item.icon] || FaCircle;

          return (
            <div
              className={`report-row ${
                item.highlight
                  ? "report-row-highlight"
                  : ""
              }`}
              key={`${item.name}-${index}`}
            >

              {/* НАЗВА + ІКОНКА */}
              <div className="report-name-cell">

                <div className="report-row-icon">
                  <Icon />
                </div>

                <span>
                  {item.name}
                </span>

                {item.accent && (
                  <strong className="report-accent">
                    {item.accent}
                  </strong>
                )}

              </div>

              {/* УРАЖЕНО */}
              <div
                className={`report-number ${
                  item.hit === 0 ? "zero" : ""
                }`}
              >
                {item.secret ? (
                  <span className="secret">
                    CLASSIFIED
                  </span>
                ) : (
                  item.hit
                )}
              </div>

              {/* ЗНИЩЕНО */}
              <div
                className={`report-number ${
                  item.destroyed === 0 ? "zero" : ""
                }`}
              >
                {item.secret ? (
                  <span className="secret">
                    CLASSIFIED
                  </span>
                ) : (
                  item.destroyed
                )}
              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}


function Tables() {
  return (
    <section className="combat-statistics">

      <div className="tables-layout">

        <ReportTable data={leftTable} />

        <ReportTable data={rightTable} />

      </div>

    </section>
  );
}

export default Tables;