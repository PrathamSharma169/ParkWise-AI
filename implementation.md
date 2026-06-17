# ParkWise AI - Gridlock 2.0 Hackathon Implementation Plan

## Project Title

**ParkWise AI: Parking Enforcement Intelligence Platform**

---

# 1. Problem Statement

Parking violations are one of the major contributors to urban traffic disruption. Current systems focus only on detecting violations after they occur.

Our solution identifies parking risk zones across Bengaluru using historical parking violation data, prioritizes them based on operational impact, and recommends targeted enforcement actions.

---

# 2. Core Objective

Build an AI-powered Parking Enforcement Intelligence Platform that:

* Detects parking hotspots automatically
* Prioritizes hotspots using a custom Impact Score
* Identifies recurring parking-risk zones
* Generates actionable recommendations
* Visualizes risk zones on an interactive map

---

# 3. Final User Flow

```text
Dataset
    ↓
Data Cleaning
    ↓
Feature Engineering
    ↓
DBSCAN Clustering
    ↓
Parking Risk Zones
    ↓
Impact Score Calculation
    ↓
Zone Ranking
    ↓
Recommendation Engine
    ↓
Interactive Dashboard
```

---

# 4. Technology Stack

## Backend

### Python

Used for:

* Data processing
* DBSCAN clustering
* Feature engineering
* Impact score calculation

Libraries:

```bash
pandas
numpy
scikit-learn
geopy
```

---

## API Layer

### FastAPI

Used for:

* Serving hotspot data
* Serving analytics
* Recommendation APIs

Endpoints:

```text
/api/hotspots
/api/hotspot/{id}
/api/analytics
/api/recommendations
```

---

## Database

### PostgreSQL

Tables:

```text
hotspots
hotspot_details
recommendations
```

---

## Frontend

### React + Vite

Reason:

* Fast development
* Modern UI
* Easy Map integration

---

## Mapping

### Mapbox

Reason:

* Professional appearance
* Smooth interaction
* Easy hotspot visualization

---

## Charts

### Recharts

Used for:

* Vehicle distribution
* Hourly patterns
* Violation trends

---

# 5. Dataset Understanding

Available Fields:

```text
latitude
longitude
location
vehicle_number
vehicle_type
description
violation_type
created_datetime
closed_datetime
police_station
junction_name
```

Important Fields:

### Latitude + Longitude

Used for:

```text
DBSCAN clustering
Map visualization
Zone center calculation
```

---

### Vehicle Type

Used for:

```text
Vehicle impact calculation
```

---

### Created Datetime

Used for:

```text
Trend analysis
Hourly distribution
Weekly distribution
```

---

### Closed Datetime

Used for:

```text
Enforcement difficulty score
```

---

### Location

Used for:

```text
Zone naming
Top affected roads
```

---

### Junction Name

Used for:

```text
Junction impact analysis
```

---

# 6. Data Cleaning

Tasks:

### Remove

```text
Null latitude
Null longitude
Duplicate records
```

---

### Standardize

Vehicle Types

Example:

```text
CAR
Car
car
```

becomes

```text
CAR
```

---

### Convert Dates

Convert:

```text
created_datetime
closed_datetime
```

to datetime objects.

---

# 7. Hotspot Generation

## Why DBSCAN?

Because:

* Number of hotspots unknown
* Natural clustering
* Works well with geospatial data

---

## Parameters

Initial Values:

```python
eps = 500 meters
min_samples = 20
```

These values can be tuned after experimentation.

---

## Process

Input:

```text
Latitude
Longitude
```

Output:

```text
Cluster ID
```

Example:

```text
Violation A → Cluster 17
Violation B → Cluster 17
Violation C → Cluster 17
```

---

## Cluster Center

For every cluster:

```python
center_lat = mean(latitude)
center_lon = mean(longitude)
```

Stored as hotspot center.

---

# 8. Zone Naming Logic

Never show:

```text
Cluster 17
```

Instead:

Find most frequent location inside cluster.

Example:

```text
18th Main Road
```

Zone Name:

```text
Koramangala - 18th Main Zone
```

---

# 9. Impact Score Design

## Objective

Create a transparent score between:

```text
0 - 100
```

---

## Component 1

### Violation Density

Weight:

```text
45%
```

Measures:

```text
Total violations inside hotspot
```

---

## Component 2

### Vehicle Impact

Weight:

```text
25%
```

Vehicle Weights:

```text
BIKE      = 1
AUTO      = 2
CAR       = 3
MAXI CAB  = 4
BUS       = 5
TRUCK     = 5
```

Calculate average cluster weight.

---

## Component 3

### Junction Impact

Weight:

```text
15%
```

Measures:

```text
Violations occurring near junctions
```

Higher junction concentration means higher risk.

---

## Component 4

### Enforcement Difficulty

Weight:

```text
15%
```

Formula:

```text
closed_datetime
-
created_datetime
```

Longer resolution times imply more difficult enforcement.

---

## Final Formula

```text
Impact Score

=
0.45 × Violation Density

+
0.25 × Vehicle Impact

+
0.15 × Junction Impact

+
0.15 × Enforcement Difficulty
```

---

# 10. Zone Ranking

Sort all zones by:

```text
Impact Score
```

Example:

```text
#1 Highest Risk Zone
#2 Highest Risk Zone
#3 Highest Risk Zone
```

Displayed in UI.

---

# 11. Recommendation Engine

Rule-Based System

Example:

### High Vehicle Impact

Recommendation:

```text
Increase towing patrol frequency
```

---

### High Junction Impact

Recommendation:

```text
Deploy officers near junction
```

---

### Long Enforcement Time

Recommendation:

```text
Dedicated enforcement team
```

---

### Repeat Offender Zone

Recommendation:

```text
Install permanent no-parking barriers
```

---

# 12. Dashboard Design

## Screen 1

### City Map

Displays:

```text
Parking Risk Zones
```

Visualization:

```text
Green
Yellow
Orange
Red
```

based on Impact Score.

---

## Screen 2

### Zone Details

On hotspot click:

```text
Zone Name
Impact Score
City Rank
Total Violations
Police Station
```

---

## Screen 3

### Affected Roads

Display:

```text
Top 3 roads
Violation counts
```

Example:

```text
18th Main Road
17th Cross Road
Sony Signal Road
```

---

## Screen 4

### Vehicle Distribution

Pie Chart:

```text
Cars
Bikes
Autos
Cabs
```

---

## Screen 5

### Recommendation Panel

Display:

```text
Recommended action
Reason
Expected benefit
```

---

# 13. API Design

## Get All Hotspots

```http
GET /api/hotspots
```

Returns:

```json
[
 {
   "zone_id":1,
   "zone_name":"Koramangala Zone",
   "lat":12.92,
   "lon":77.61,
   "impact_score":92
 }
]
```

---

## Get Hotspot Details

```http
GET /api/hotspot/{id}
```

Returns detailed information.

---

# 14. Database Schema

## hotspots

```text
zone_id
zone_name
center_lat
center_lon
impact_score
rank
total_violations
```

---

## hotspot_details

```text
zone_id
vehicle_distribution
top_locations
junction_ratio
avg_resolution_time
```

# Dashboard Enhancement: Dual Intelligence Map System

## Why Two Maps?

Most solutions only show where violations happen.

Our platform shows:

### Map 1: Violation Density Map

Answers:

> Where do parking violations occur most frequently?

### Map 2: Operational Impact Map

Answers:

> Which parking zones should authorities prioritize first?

This transforms the platform from a visualization tool into a decision-support system.

---

# Map 1: Violation Density Map

## Objective

Visualize violation concentration across Bengaluru.

This map is purely data-driven and does not use the Impact Score.

---

## Data Source

Generated after DBSCAN clustering.

For every hotspot:

```text
zone_id
total_violations
```

---

## Density Ranking

Calculate:

```python
total_violations_per_zone
```

Generate:

```python
P25
P50
P75
P90
```

percentiles.

---

## Color Logic

| Percentile Range | Color  | Risk     |
| ---------------- | ------ | -------- |
| < P50            | Green  | Low      |
| P50 - P75        | Yellow | Moderate |
| P75 - P90        | Orange | High     |
| > P90            | Red    | Critical |

---

## Purpose

Helps authorities understand:

* High-frequency violation regions
* Parking pressure across the city
* Historical concentration patterns

---

## Example

```text
Koramangala Zone

Violations:
532

Density Rank:
#1 / 487
```

---

# Map 2: Operational Impact Map

## Objective

Prioritize enforcement based on operational impact rather than raw frequency.

This is the primary innovation of the project.

---

## Data Source

Custom Impact Score.

---

## Impact Score Formula

Impact Score =

45% Violation Density

*

25% Vehicle Impact

*

15% Junction Impact

*

15% Enforcement Difficulty

---

## Severity Bands

| Impact Score | Color  |
| ------------ | ------ |
| 0 - 25       | Green  |
| 25 - 50      | Yellow |
| 50 - 75      | Orange |
| 75 - 100     | Red    |

---

## Purpose

Helps authorities decide:

* Where to deploy officers
* Where to increase towing operations
* Which zones create the greatest operational disruption

---

## Example

```text
Madiwala Zone

Impact Score:
91

Impact Rank:
#2 / 487
```

---

# Key Insight Engine

The platform compares both maps to identify hidden patterns.

---

## Case 1

High Density + High Impact

```text
Density Rank: #1
Impact Rank: #2
```

Interpretation:

Major city priority.

---

## Case 2

High Density + Low Impact

```text
Density Rank: #2
Impact Rank: #18
```

Interpretation:

Frequent violations but lower operational disruption.

---

## Case 3

Low Density + High Impact

```text
Density Rank: #15
Impact Rank: #2
```

Interpretation:

Critical hidden hotspot.

These are the zones most likely to be overlooked by conventional systems.

---

# Updated Dashboard Structure

## Screen 1

### Violation Density Map

Displays:

* DBSCAN hotspots
* Percentile-based coloring
* Density ranking

Purpose:

Understand where violations happen.

---

## Screen 2

### Operational Impact Map

Displays:

* DBSCAN hotspots
* Impact Score coloring
* Impact ranking

Purpose:

Understand where action is needed.

---

## Screen 3

### Zone Analytics

Displays:

* Zone name
* Density rank
* Impact rank
* Impact score
* Total violations
* Top affected roads
* Vehicle distribution
* Junction analysis

---

## Screen 4

### Recommendation Center

Displays:

* Recommended action
* Reason
* Priority level
* Enforcement strategy

---

## Screen 5

### City Intelligence Dashboard

Displays:

Top 10 High Impact Zones

Top 10 High Density Zones

Most Overlooked Zones

Repeat Offender Zones

Police Station Analytics

---

# Backend Changes

## Additional Fields

Store in hotspot table:

```text
density_rank
impact_rank
violation_percentile
impact_score
```

---

## Additional API

GET

```http
/api/density-map
```

Returns:

```json
[
 {
   "zone_id":17,
   "zone_name":"Koramangala Zone",
   "violations":532,
   "density_rank":1,
   "percentile":"P90"
 }
]
```

---

GET

```http
/api/impact-map
```

Returns:

```json
[
 {
   "zone_id":17,
   "zone_name":"Koramangala Zone",
   "impact_score":92,
   "impact_rank":3
 }
]
```

---

# Judge Demo Flow

Step 1

Show Density Map.

Statement:

"These are the areas where parking violations occur most frequently."

---

Step 2

Switch to Impact Map.

Statement:

"However, frequency does not always indicate operational severity."

---

Step 3

Show a hotspot where:

```text
Density Rank = #15
Impact Rank = #2
```

Statement:

"Our system identifies hidden high-impact zones that traditional violation-count dashboards would miss."

---

Step 4

Open hotspot details.

Show:

* Impact Score
* Rank
* Top roads
* Recommendation
---

assume that in .env file the postgres sql database links are given
also use two different folder for frontend and backend
Keep the UI design simple and proffesional
