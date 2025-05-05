from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shapely.geometry import Point, shape
import requests
import json

# Load GeoJSON from public URL
GEOJSON_URL = "https://storage.googleapis.com/practicumdata/yimby.geojson"
geojson_data = {"type": "FeatureCollection", "features": []}

try:
    response = requests.get(GEOJSON_URL)
    response.raise_for_status()
    geojson_data = response.json()
    print("✅ Successfully loaded GeoJSON")
except Exception as e:
    print(f"❌ Failed to load GeoJSON: {e}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # allow all origins for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CoordinateRequest(BaseModel):
    lat: float
    lon: float
    buffer_meters: float = 250

def calculate_average(values):
    filtered = [float(v) for v in values if v is not None and v != ""]
    return sum(filtered) / len(filtered) if filtered else None

def calculate_statistics(features):
    if not features:
        return {}

    yearly_data = {}
    zoning_data = {}
    market_values = []
    sale_prices = []
    impact_scores = []

    for feature in features:
        props = feature.get("properties", {})

        for year in range(2015, 2024):
            year_str = str(year)
            if year_str not in yearly_data:
                yearly_data[year_str] = {"incomes": [], "home_values": [], "count": 0}

            income = props.get(f"med_income_{year}")
            home_value = props.get(f"med_home_value_{year}")

            if income is not None:
                yearly_data[year_str]["incomes"].append(income)
            if home_value is not None:
                yearly_data[year_str]["home_values"].append(home_value)

            cons_complete = props.get("cons_complete")
            if cons_complete == year or cons_complete == year_str:
                yearly_data[year_str]["count"] += 1

        zoning = props.get("zoning")
        if zoning:
            zoning_data[zoning] = zoning_data.get(zoning, 0) + 1

        if props.get("market_value"):
            market_values.append(float(props["market_value"]))
        if props.get("sale_price"):
            sale_prices.append(float(props["sale_price"]))
        if props.get("impact_score"):
            impact_scores.append(float(props["impact_score"]))

    avg_impact_score = calculate_average(impact_scores)
    normalized_score = 100 if avg_impact_score and avg_impact_score > 500 else avg_impact_score

    return {
        "years": sorted(yearly_data),
        "avgIncome": [calculate_average(yearly_data[y]["incomes"]) for y in sorted(yearly_data)],
        "avgHomeValue": [calculate_average(yearly_data[y]["home_values"]) for y in sorted(yearly_data)],
        "countByYear": [yearly_data[y]["count"] for y in sorted(yearly_data)],
        "zoningLabels": list(zoning_data),
        "zoningValues": list(zoning_data.values()),
        "avgMarketValue": calculate_average(market_values),
        "avgSalePrice": calculate_average(sale_prices),
        "avgImpactScore": normalized_score,
        "rawAvgImpactScore": avg_impact_score
    }

@app.post("/api/spots-in-buffer")
async def get_spots_in_buffer(coords: CoordinateRequest):
    try:
        center = Point(coords.lon, coords.lat)
        buffer_degrees = coords.buffer_meters / 111000
        buffer_circle = center.buffer(buffer_degrees)

        filtered = []
        for feature in geojson_data.get("features", []):
            try:
                geom = shape(feature["geometry"])
                if buffer_circle.intersects(geom):
                    filtered.append(feature)
            except Exception as e:
                print(f"Error processing feature: {e}")

        stats = calculate_statistics(filtered)
        buffer_geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[(p[0], p[1]) for p in buffer_circle.exterior.coords]],
            },
            "properties": {}
        }

        return {
            "spots": {"type": "FeatureCollection", "features": filtered, "count": len(filtered)},
            "buffer": buffer_geojson,
            "statistics": stats
        }

    except Exception as e:
        print(f"API error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
