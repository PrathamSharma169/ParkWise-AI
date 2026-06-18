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


# ParkWise AI - Recommendation & Intelligence Engine Implementation Plan

# Objective

Convert hotspot analytics into actionable enforcement intelligence.

The system should not only identify hotspots but also answer:

* Which zones require immediate action?
* Why is a zone important?
* What intervention should authorities take?
* Which zones are being overlooked?
* What is the expected operational benefit?

---

# Current System Status

Completed:

```text
Dataset
    ↓
Data Cleaning
    ↓
DBSCAN Clustering
    ↓
Parking Risk Zones
    ↓
Density Map
    ↓
Impact Score Map
```

Next Stage:

```text
Density Intelligence
+
Impact Intelligence
      ↓
Zone Classification
      ↓
Rule Engine
      ↓
Gemini 2.5 Flash
      ↓
Recommendation Dashboard
```

---

# Recommendation Philosophy

The system should NOT allow the LLM to make decisions.

Bad:

```text
Hotspot Data
      ↓
LLM
      ↓
Recommendation
```

Problems:

* Hallucinations
* Inconsistent outputs
* Difficult to justify

---

Good:

```text
Hotspot Data
      ↓
Rule Engine
      ↓
Recommendation
      ↓
Gemini 2.5 Flash
      ↓
Explanation
```

This provides:

* Explainability
* Repeatability
* Judge-friendly architecture
* AI-powered insights

---

# Intelligence Sources

The recommendation engine uses TWO independent intelligence layers.

---

# Layer 1: Density Intelligence

## Purpose

Identify where parking violations occur most frequently.

---

## Input

For each hotspot:

```text
total_violations
```

---

## Percentile Calculation

After DBSCAN:

```python
violation_counts = hotspots["total_violations"]
```

Calculate:

```python
P50
P75
P90
```

---

## Density Categories

### Low Density

```text
Violations < P50
```

---

### Medium Density

```text
P50 <= Violations < P75
```

---

### High Density

```text
P75 <= Violations < P90
```

---

### Critical Density

```text
Violations >= P90
```

---

## Density Rank

Example:

```text
Koramangala Zone

Density Rank:
#1 / 487
```

Stored in database.

---

# Layer 2: Impact Intelligence

## Purpose

Identify zones causing maximum operational disruption.

---

## Impact Formula

```text
Impact Score

=
45% Violation Density

+
25% Vehicle Impact

+
15% Junction Impact

+
15% Enforcement Difficulty
```

---

## Impact Categories

### Low Impact

```text
0 - 40
```

---

### Medium Impact

```text
40 - 60
```

---

### High Impact

```text
60 - 80
```

---

### Critical Impact

```text
80 - 100
```

---

## Impact Rank

Example:

```text
Impact Rank:
#3 / 487
```

Stored in database.

---

# Zone Classification Engine

This is the core innovation.

Instead of showing raw scores, classify every hotspot.

---

## Classification 1

Critical Zone

Condition:

```python
density_percentile == "P90"
and
impact_score >= 80
```

Meaning:

```text
Frequent violations
+
Severe disruption
```

---

## Classification 2

Frequent Violation Zone

Condition:

```python
density_percentile == "P90"
and
impact_score < 60
```

Meaning:

```text
Many violations
Low operational impact
```

---

## Classification 3

Hidden Risk Zone

Condition:

```python
density_percentile < "P75"
and
impact_score >= 80
```

Meaning:

```text
Few violations
High disruption
```

This is one of the most important insights.

---

## Classification 4

Stable Zone

Condition:

```python
density_percentile < "P50"
and
impact_score < 40
```

Meaning:

```text
Low priority
```

---

# Rule Engine

The Rule Engine converts classifications into actions.

---

## Critical Zone

Recommendation:

```text
Immediate Enforcement Priority
Increase Officer Presence
Increase Towing Operations
```

---

## Frequent Violation Zone

Recommendation:

```text
Improve Parking Infrastructure
Install Additional Signage
Public Awareness Campaign
```

---

## Hidden Risk Zone

Recommendation:

```text
Targeted Enforcement
Junction Monitoring
Dedicated Patrol Team
```

---

## Stable Zone

Recommendation:

```text
Routine Monitoring
```

---

# Advanced Rules

## High Vehicle Impact

Condition:

```python
vehicle_impact > 70
```

Recommendation:

```text
Increase Towing Frequency
```

---

## High Junction Impact

Condition:

```python
junction_impact > 60
```

Recommendation:

```text
Deploy Officers Near Junction
```

---

## High Enforcement Difficulty

Condition:

```python
enforcement_difficulty > 60
```

Recommendation:

```text
Dedicated Response Team
```

---

## Repeat Offender Zone

Condition:

```python
Zone repeatedly appears
across weeks/months
```

Recommendation:

```text
Permanent Infrastructure Intervention
```

Examples:

```text
No Parking Barricades
Smart Signage
Dedicated Parking Facility
```

---

# Gemini 2.5 Flash Integration

Model:

```text
gemini-2.5-flash
```

Purpose:

NOT recommendation generation.

Purpose:
Generate:

* Risk Summary
* Recommendation Explanation
* Expected Benefits
* Enforcement Justification

---

# Gemini Prompt Architecture

## System Prompt

```text
You are an urban traffic management expert.

You analyze parking violation hotspots and generate
professional operational insights.

Rules:

1. Never invent data.
2. Use only supplied hotspot information.
3. Keep explanations concise.
4. Explain why the recommendation exists.
5. Focus on actionable intelligence.
6. Do not create new recommendations.
7. Explain the recommendations generated by the rule engine.
```

---

## User Prompt Template

```text
Analyze the following hotspot.

Zone Name:
{zone_name}

Zone Classification:
{zone_classification}

Density Rank:
{density_rank}

Density Percentile:
{density_percentile}

Impact Score:
{impact_score}

Impact Rank:
{impact_rank}

Total Violations:
{total_violations}

Top Roads:
{top_roads}

Rule Engine Recommendations:
{recommendations}

Generate:

1. Risk Summary
2. Key Risk Factors
3. Recommendation Explanation
4. Expected Benefit

Maximum 120 words.
```

---

# Example Input

```json
{
  "zone_name": "Koramangala - 18th Main Zone",
  "zone_classification": "Critical Zone",
  "density_rank": 1,
  "density_percentile": "P90",
  "impact_score": 92,
  "impact_rank": 3,
  "total_violations": 532,
  "recommendations": [
      "Immediate Enforcement Priority",
      "Increase Officer Presence",
      "Increase Towing Operations"
  ]
}
```

---

# Example Gemini Output

```text
Risk Summary

Koramangala - 18th Main Zone ranks among the most
critical parking hotspots in Bengaluru, exhibiting
both extremely high violation density and significant
operational impact.

Key Risk Factors

• Persistent parking violations
• High congestion potential
• Above-average enforcement complexity

Recommendation Explanation

Enhanced officer deployment and towing operations
are recommended due to the sustained concentration
of violations in this zone.

Expected Benefit

Improved road availability, faster clearance of
violations, and reduced parking-induced disruption.
```

---

# Recommendation Object Structure

Generated by backend.

```json
{
    "zone_id":17,
    "zone_name":"Koramangala Zone",

    "zone_classification":"Critical Zone",

    "density_rank":1,

    "impact_rank":3,

    "recommendations":[
        "Immediate Enforcement Priority",
        "Increase Officer Presence",
        "Increase Towing Operations"
    ],

    "ai_explanation":{
        "risk_summary":"...",
        "key_risk_factors":[
            "...",
            "..."
        ],
        "recommendation_explanation":"...",
        "expected_benefit":"..."
    }
}
```

---

# Database Design

## recommendation_table

Columns:

```text
id
zone_id
zone_classification
recommendation_type
recommendation_text
generated_explanation
created_at
```

---

# API Design

## Get Recommendation

```http
GET /api/recommendation/{zone_id}
```

---

## Response

```json
{
    "zone_id":17,
    "zone_name":"Koramangala Zone",

    "zone_classification":"Critical Zone",

    "density_rank":1,
    "impact_rank":3,

    "recommendations":[
        "Immediate Enforcement Priority",
        "Increase Officer Presence"
    ],

    "risk_summary":"...",

    "recommendation_explanation":"...",

    "expected_benefit":"..."
}
```

---

# Frontend Design

## Recommendation Panel

```text
------------------------------------------------

Koramangala - 18th Main Zone

Classification:
CRITICAL ZONE

Density Rank:
#1

Impact Rank:
#3

Impact Score:
92

------------------------------------------------

Recommendations

✓ Immediate Enforcement Priority

✓ Increase Officer Presence

✓ Increase Towing Operations

------------------------------------------------

AI Risk Summary

[ Gemini Output ]

------------------------------------------------

Expected Benefit

[ Gemini Output ]

------------------------------------------------
```

---

# Additional Feature

## Explain This Zone

Button:

```text
[ Explain Risk ]
```

When clicked:

```text
Frontend
      ↓
Recommendation API
      ↓
Gemini 2.5 Flash
      ↓
Generated Explanation
```

---

# Additional Feature

## Why Is This Zone Important?

Button:

```text
[ Why Important? ]
```

Gemini explains:

```text
This zone ranks #1 in violation density
and #3 in operational impact, indicating
a combination of frequent violations and
significant traffic disruption potential.
```

This feature gives judges a strong AI interaction demo.

---

# Dashboard Integration

## Tab 1

Density Map

Purpose:

```text
Where violations happen most frequently.
```

---

## Tab 2

Impact Map

Purpose:

```text
Where violations cause the highest operational disruption.
```

---

## Tab 3

Zone Analytics

Displays:

```text
Zone Name
Density Rank
Impact Rank
Impact Score
Top Roads
Vehicle Distribution
Police Station
```

---

## Tab 4

Recommendation Center

Displays:

```text
Zone Classification
Recommendations
AI Risk Summary
Expected Benefits
```

---

# Final Architecture

```text
Dataset
    ↓

Data Cleaning
    ↓

DBSCAN
    ↓

Parking Risk Zones
    ↓

────────────────────────────

Density Intelligence

Violation Counts
    ↓

Percentile Analysis
(P50, P75, P90)
    ↓

Density Rank

────────────────────────────

Impact Intelligence

Violation Density
Vehicle Impact
Junction Impact
Enforcement Difficulty
    ↓

Impact Score
    ↓

Impact Rank

────────────────────────────

Density Rank
+
Impact Rank
    ↓

Zone Classification
    ↓

Rule Engine
    ↓

Recommendations
    ↓

Gemini 2.5 Flash
    ↓

Risk Explanation
Expected Benefits
Recommendation Justification

────────────────────────────

Dashboard
```

---

Deliverable:

```text
Recommendation Dashboard
```

---

# Success Criteria

The system should be capable of:

✓ Detecting hotspots

✓ Ranking hotspots by density

✓ Ranking hotspots by impact

✓ Identifying hidden risk zones

✓ Classifying hotspot severity

✓ Generating rule-based recommendations

✓ Producing AI-powered explanations

✓ Supporting operational decision-making

✓ Demonstrating actionable intelligence to judges

```
```
