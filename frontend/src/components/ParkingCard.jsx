
function ParkingCard({ spot, rank, isSelected, onSelect, onSavePreference }) {
  const parkingType = spot.type || "Regular";
  const spotCode = spot.spotCode || spot.lotName || "Parking Spot";
  const totalSpaces = Number(spot.totalSpaces || 0);
  const reservedSpots = Number(spot.reservedSpots || 0);

  const isAvailable =
    typeof spot.availableSpots === "number"
      ? spot.availableSpots > 0
      : spot.isAvailable !== undefined
        ? spot.isAvailable
        : totalSpaces - reservedSpots > 0;

  const availableSpots =
    typeof spot.availableSpots === "number"
      ? Math.max(spot.availableSpots, 0)
      : Math.max(totalSpaces - reservedSpots, 0);

  const distanceToEntranceKm = spot.distanceToEntranceKm;
  const distanceToEVChargerKm = spot.distanceToEVChargerKm;
  const isBestOption = spot.isBestOption;

  const getTypeIcon = (type) => {
    switch (String(type).toLowerCase()) {
      case "ev":
        return "⚡";
      case "disability":
        return "♿";
      case "family":
        return "👨‍👩‍👧";
      default:
        return "🅿️";
    }
  };

  return (
    <article
      className={`dashboard-spot-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect?.(spot)}
    >
      <div className="dashboard-spot-card-head">
        <div className="spot-code-and-type">
          <span className="spot-code">{spotCode}</span>
          <span className="type-icon" title={parkingType}>
            {getTypeIcon(parkingType)}
          </span>
        </div>

        <div>
          <span className={`status-pill ${isAvailable ? "open" : "closed"}`}>
            {isAvailable ? "Available" : "Full"}
          </span>
          {isBestOption ? (
            <div style={{ marginTop: "6px", fontWeight: "600", color: "green" }}>
              ⭐ Best Option
            </div>
          ) : null}
        </div>
      </div>

      <p className="spot-lot-name">{spot.lotName || "Parking Lot"}</p>

      <div className="spot-meta">
        <span>{availableSpots} available</span>
        <span>{reservedSpots} reserved</span>
      </div>

      <div className="spot-meta">
        <span>Rank: #{rank + 1}</span>
        <span>
          Distance to entrance:{" "}
          {distanceToEntranceKm != null ? `${distanceToEntranceKm} km` : "N/A"}
        </span>
      </div>

      {distanceToEVChargerKm != null ? (
        <div className="spot-meta">
          <span>Distance to EV charger: {distanceToEVChargerKm} km</span>
        </div>
      ) : null}

      <div className="spot-meta">
        <span>Price: ${spot.pricePerHour ?? 0}/hr</span>
        <span>Type: {parkingType}</span>
      </div>

      {onSavePreference ? (
        <button
          type="button"
          className="save-preference-btn"
          onClick={(event) => {
            event.stopPropagation();
            onSavePreference(spot);
          }}
        >
          Save Preference
        </button>
      ) : null}
    </article>
  );
}

export default ParkingCard;