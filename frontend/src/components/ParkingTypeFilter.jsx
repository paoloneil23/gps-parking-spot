import "./ParkingTypeFilter.css";

const PARKING_TYPES = ["disability", "regular", "EV", "visitor"];

function ParkingTypeFilter({ selectedTypes, onChange }) {
  const handleToggle = (type) => {
    if (selectedTypes.includes(type)) {
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const handleSelectAll = () => {
    onChange(PARKING_TYPES);
  };

  return (
    <div className="parking-type-filter">
      <div className="filter-header">
        <h3>Parking Type</h3>
        <div className="filter-actions">
          <button className="filter-link" onClick={handleSelectAll}>
            All
          </button>
          <span className="filter-separator">·</span>
          <button className="filter-link" onClick={handleClearAll}>
            None
          </button>
        </div>
      </div>

      <div className="filter-options">
        {PARKING_TYPES.map((type) => (
          <label key={type} className="filter-checkbox">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => handleToggle(type)}
            />
            <span className="checkbox-label">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          </label>
        ))}
      </div>

      {selectedTypes.length > 0 && (
        <div className="filter-selected">
          <span className="selected-count">
            {selectedTypes.length} selected
          </span>
        </div>
      )}
    </div>
  );
}

export default ParkingTypeFilter;