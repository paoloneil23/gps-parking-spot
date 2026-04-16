# Parking Spot Schema

## New Schema Format

The parking spot schema has been updated with the following structure:

```json
{
  "spotCode": "D1",
  "lotName": "Central Lot",
  "type": "disability",
  "isAvailable": true,
  "pricePerHour": 7,
  "isPaid": true,
  "location": {
    "type": "Point",
    "coordinates": [-79.3832, 43.6532]
  },
  "description": "Accessible parking spot",
  "totalSpaces": 1
}
```

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `spotCode` | String | Yes | Unique identifier for the spot (e.g., "D1", "EV-5") |
| `lotName` | String | Yes | Name of the parking lot (e.g., "Central Lot", "Downtown Garage") |
| `type` | Enum | Yes | Type of parking: `"disability"`, `"regular"`, or `"EV"` |
| `isAvailable` | Boolean | No | Whether the spot is currently available (default: true) |
| `pricePerHour` | Number | Yes | Cost per hour in dollars |
| `isPaid` | Boolean | No | Whether the spot requires payment (default: true, set to false for free) |
| `location` | GeoJSON | Yes | Geographic location as Point coordinates `[longitude, latitude]` |
| `description` | String | No | Optional notes about the parking spot |
| `totalSpaces` | Number | No | Total number of spaces in this lot (default: 1) |

## Parking Types

- **disability**: Accessible parking for people with disabilities (♿ icon)
- **regular**: Standard parking spot (🅿️ icon)
- **EV**: Electric vehicle charging spot (⚡ icon)

## API Examples

### Create a New Parking Spot

**POST** `/api/parking`

```json
{
  "spotCode": "D1",
  "lotName": "Central Lot",
  "type": "disability",
  "isAvailable": true,
  "pricePerHour": 7,
  "isPaid": true,
  "location": {
    "type": "Point",
    "coordinates": [-79.3832, 43.6532]
  },
  "description": "Accessible parking in downtown core",
  "totalSpaces": 1
}
```

### Example Data - Multiple Spots

```json
[
  {
    "spotCode": "D1",
    "lotName": "Central Lot",
    "type": "disability",
    "isAvailable": true,
    "pricePerHour": 7,
    "isPaid": true,
    "location": {
      "type": "Point",
      "coordinates": [-79.3832, 43.6532]
    },
    "totalSpaces": 1
  },
  {
    "spotCode": "EV-5",
    "lotName": "Downtown Garage",
    "type": "EV",
    "isAvailable": true,
    "pricePerHour": 5,
    "isPaid": false,
    "location": {
      "type": "Point",
      "coordinates": [-79.3750, 43.6650]
    },
    "totalSpaces": 1
  },
  {
    "spotCode": "R10",
    "lotName": "Street Parking",
    "type": "regular",
    "isAvailable": false,
    "pricePerHour": 3,
    "isPaid": true,
    "location": {
      "type": "Point",
      "coordinates": [-79.3900, 43.6400]
    },
    "totalSpaces": 1
  }
]
```

## Frontend Display

### Parking Card Display

Each parking card shows:
- **Spot Code**: "D1" in a purple badge
- **Type Icon**: 
  - ♿ for disability
  - ⚡ for EV
  - 🅿️ for regular
- **Lot Name**: "Central Lot"
- **Type Badge**: Shows full type name (Disability, Regular, EV)
- **Payment Badge**: Shows "💳 Paid" or "🆓 Free"
- **Price**: "$7/hour"
- **Availability**: Total/Available/Reserved counts
- **Status**: "Available" or "Full"

### Filtering

Users can filter by:
- **Search**: Spot code or lot name
- **Price**: Maximum price per hour
- **Type**: Disability, Regular, or EV
- **Availability**: Only available spots

## Map Integration

- Each spot is displayed as a marker on the interactive online map (OpenStreetMap via Leaflet)
- Markers show the parking type with different colors/icons
- Click a marker to select the spot and view details
- Spot details panel shows full information including reserved/available counts
