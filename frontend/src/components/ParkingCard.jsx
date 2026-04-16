function ParkingCard({ spot, isSelected, onSelect, onSavePreference }) {
  const spotCode = spot.spotCode || "N/A";
  const lotName = spot.lotName || "Parking Lot";
  const parkingType = spot.type || "regular";
  const isPaid = spot.isPaid !== undefined ? spot.isPaid : true;
  const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
  const isAvailable =
    typeof spot.availableSpots === "number"
      ? spot.availableSpots > 0
      : spot.isAvailable !== undefined
        ? spot.isAvailable
        : spot.available;
  const reservedSpots =
    typeof spot.reservedSpots === "number"
      ? Math.min(spot.reservedSpots, totalSpaces)
      : 0;
  const availableSpots =
    typeof spot.availableSpots === "number"
      ? Math.max(spot.availableSpots, 0)
      : Math.max(totalSpaces - reservedSpots, 0);
  const availabilityState =
    availableSpots <= 0 ? "full" : availableSpots <= Math.max(1, Math.ceil(totalSpaces * 0.25)) ? "limited" : "available";
  const statusLabel = availabilityState === "full" ? "Full" : availabilityState === "limited" ? "Limited" : "Available";

  const getTypeIcon = (type) => {
    switch (type) {
      case "disability":
        return "♿";
      case "EV":
        return "⚡";
      case "visitor":
        return "V";
      case "regular":
        return "🅿️";
      default:
        return "🅿️";
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`dashboard-spot-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(spot)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(spot);
        }
      }}
    >
      <div className="dashboard-spot-card-head">
        <div className="spot-code-and-type">
          <span className="spot-code">{spotCode}</span>
          <span className="type-icon" title={parkingType}>
            {getTypeIcon(parkingType)}
          </span>
        </div>
        <span className={`status-pill ${availabilityState}`}>
          {statusLabel}
        </span>
      </div>

      <h3 className="spot-lot-name">{lotName}</h3>

      <div className="spot-type-and-payment">
        <span className="spot-type-badge">
          {parkingType.charAt(0).toUpperCase() + parkingType.slice(1)}
        </span>
        <span className={`payment-badge ${isPaid ? "paid" : "free"}`}>
          {isPaid ? "💳 Paid" : "🆓 Free"}
        </span>
      </div>

      <div className="spot-meta">
        <span>{isPaid ? `$${spot.pricePerHour ?? "-"}/hour` : "Free of charge"}</span>
        <span>{totalSpaces} total spots</span>
      </div>

      <div className="spot-meta">
        <span>{availableSpots} available</span>
        <span>{reservedSpots} reserved</span>
      </div>

      {typeof onSavePreference === "function" ? (
        <div className="spot-card-actions">
          <button
            type="button"
            className="spot-save-preference-btn"
            onClick={(event) => {
              event.stopPropagation();
              onSavePreference(spot);
            }}
          >
            Save Preference
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default ParkingCard;