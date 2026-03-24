function ParkingCard({ spot, isSelected, onSelect }) {
  const spotCode = spot.spotCode || "N/A";
  const lotName = spot.lotName || "Parking Lot";
  const parkingType = spot.type || "regular";
  const isPaid = spot.isPaid !== undefined ? spot.isPaid : true;
  const isAvailable = spot.isAvailable !== undefined ? spot.isAvailable : spot.available;
  
  const totalSpaces = Number(spot.totalSpaces) > 0 ? Number(spot.totalSpaces) : 1;
  const reservedSpots =
    typeof spot.reservedSpots === "number"
      ? Math.min(spot.reservedSpots, totalSpaces)
      : 0;
  const availableSpots =
    typeof spot.availableSpots === "number"
      ? Math.max(spot.availableSpots, 0)
      : Math.max(totalSpaces - reservedSpots, 0);

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
    <button
      type="button"
      className={`dashboard-spot-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(spot)}
    >
      <div className="dashboard-spot-card-head">
        <div className="spot-code-and-type">
          <span className="spot-code">{spotCode}</span>
          <span className="type-icon" title={parkingType}>
            {getTypeIcon(parkingType)}
          </span>
        </div>
        <span className={`status-pill ${isAvailable ? "open" : "closed"}`}>
          {isAvailable ? "Available" : "Full"}
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
        <span>${spot.pricePerHour ?? "-"}/hour</span>
        <span>{totalSpaces} total spots</span>
      </div>

      <div className="spot-meta">
        <span>{availableSpots} available</span>
        <span>{reservedSpots} reserved</span>
      </div>
    </button>
  );
}

export default ParkingCard;