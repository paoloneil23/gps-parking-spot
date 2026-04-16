import { useState } from "react";

const defaultFormState = {
  spotCode: "",
  lotName: "",
  type: "regular",
  isAvailable: true,
  isPaid: true,
  pricePerHour: "",
  latitude: "",
  longitude: "",
  totalSpaces: "1",
  occupiedSpots: "0",
  description: "",
};

function ParkingSpotForm({ onSubmitSpot, isSubmitting = false }) {
  const [formData, setFormData] = useState(defaultFormState);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (
      !formData.spotCode.trim() ||
      !formData.lotName.trim() ||
      formData.pricePerHour === "" ||
      formData.latitude === "" ||
      formData.longitude === ""
    ) {
      setError("Please fill all required fields.");
      return;
    }

    const price = Number(formData.pricePerHour);
    const latitude = Number(formData.latitude);
    const longitude = Number(formData.longitude);
    const totalSpaces = Math.max(1, Number(formData.totalSpaces) || 1);
    const occupiedSpots = Math.min(
      Math.max(0, Number(formData.occupiedSpots) || 0),
      totalSpaces
    );

    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be a valid number greater than or equal to 0.");
      return;
    }

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setError("Latitude and longitude must be valid numbers.");
      return;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      setError("Coordinates are out of range.");
      return;
    }

    const payload = {
      spotCode: formData.spotCode.trim(),
      lotName: formData.lotName.trim(),
      type: formData.type,
      isAvailable: formData.isAvailable,
      isPaid: formData.isPaid,
      pricePerHour: price,
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
      totalSpaces,
      occupiedSpots,
      description: formData.description.trim(),
    };

    const result = await onSubmitSpot(payload);

    if (result?.ok) {
      setFormData(defaultFormState);
      return;
    }

    setError(result?.message || "Failed to add parking spot.");
  };

  return (
    <form className="parking-spot-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Spot Code *
          <input
            name="spotCode"
            value={formData.spotCode}
            onChange={handleChange}
            placeholder="A12"
          />
        </label>

        <label>
          Lot Name *
          <input
            name="lotName"
            value={formData.lotName}
            onChange={handleChange}
            placeholder="Central Lot"
          />
        </label>

        <label>
          Type
          <select name="type" value={formData.type} onChange={handleChange}>
            <option value="regular">Regular</option>
            <option value="disability">Disability</option>
            <option value="EV">EV</option>
            <option value="visitor">Visitor</option>
          </select>
        </label>

        <label>
          Price Per Hour *
          <input
            type="number"
            min="0"
            step="0.5"
            name="pricePerHour"
            value={formData.pricePerHour}
            onChange={handleChange}
            placeholder="5"
          />
        </label>

        <label>
          Latitude *
          <input
            type="number"
            step="0.000001"
            name="latitude"
            value={formData.latitude}
            onChange={handleChange}
            placeholder="43.6532"
          />
        </label>

        <label>
          Longitude *
          <input
            type="number"
            step="0.000001"
            name="longitude"
            value={formData.longitude}
            onChange={handleChange}
            placeholder="-79.3832"
          />
        </label>

        <label>
          Total Spaces
          <input
            type="number"
            min="1"
            name="totalSpaces"
            value={formData.totalSpaces}
            onChange={handleChange}
          />
        </label>

        <label>
          Occupied Spots
          <input
            type="number"
            min="0"
            name="occupiedSpots"
            value={formData.occupiedSpots}
            onChange={handleChange}
          />
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            name="isAvailable"
            checked={formData.isAvailable}
            onChange={handleChange}
          />
          Available now
        </label>

        <label className="checkbox-label">
          <input
            type="checkbox"
            name="isPaid"
            checked={formData.isPaid}
            onChange={handleChange}
          />
          Paid parking
        </label>
      </div>

      <label>
        Description
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          placeholder="Optional details for admins and users"
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <button type="submit" className="admin-submit-btn" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Parking Spot"}
      </button>
    </form>
  );
}

export default ParkingSpotForm;