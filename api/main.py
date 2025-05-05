from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shapely.geometry import Point, shape
import requests
import json
import functools

# Lazy-load GeoJSON only once when needed
GEOJSON_URL = "https://storage.googleapis.com/practicumdata/yimby.geojson"

@functools.lru_cache(maxsize=1)
def get_geojson_data():
    try:
        response = requests.get(GEOJSON_URL)
        response.raise_for_status()
        print("✅ GeoJSON loaded")
        return response.json()
    except Exception as e:
        print(f"❌ Error loading GeoJSON: {e}")
        return {"type": "FeatureCollection", "features": []}

# Initialize FastAPI app
app = FastAPI()
print("✅ FastAPI initialized")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class CoordinateRequest(BaseModel):
    lat: float
    lon: float
    buffer_meters: float = 250

# Helper: average calculation
def calculate_average(values):
    filtered = [float(v) for v in values if v is not None and v != ""]
    return sum(filtered) / len(filtered) if filtered else None

# Helper: statistics from features
def calculate_statistics(features):
    if not features:
        return {}

    yearly_data = {}
    zoning_data = {}
    market_values, sale_prices, impact_scores = [], [], []

    for feature in features:
        props = feature.get("properties", {})

        for year in range(2015, 2024):
            year_str = str(year)
            yearly_data.setdefault(year_str, {"incomes": [], "home_values": [], "count": 0})

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
        "years": sorted(yearly_data.keys()),
        "avgIncome": [calculate_average(yearly_data[y]["incomes"]) for y in sorted(yearly_data)],
        "avgHomeValue": [calculate_average(yearly_data[y]["home_values"]) for y in sorted(yearly_data)],
        "countByYear": [yearly_data[y]["count"] for y in sorted(yearly_data)],
        "zoningLabels": list(zoning_data.keys()),
        "zoningValues": list(zoning_data.values()),
        "avgMarketValue": calculate_average(market_values),
        "avgSalePrice": calculate_average(sale_prices),
        "avgImpactScore": normalized_score,
        "rawAvgImpactScore": avg_impact_score,
    }

# POST endpoint for spatial buffer analysis
@app.post("/api/spots-in-buffer")
async def get_spots_in_buffer(coords: CoordinateRequest):
    try:
        geojson_data = get_geojson_data()

        center = Point(coords.lon, coords.lat)
        buffer_degrees = coords.buffer_meters / 111000
        buffer_circle = center.buffer(buffer_degrees)

        filtered_features = []
        for feature in geojson_data.get("features", []):
            try:
                if buffer_circle.intersects(shape(feature["geometry"])):
                    filtered_features.append(feature)
            except Exception as e:
                print(f"⚠️ Error processing feature: {e}")
                continue

        stats = calculate_statistics(filtered_features)

        buffer_geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[(p[0], p[1]) for p in buffer_circle.exterior.coords]]
            },
            "properties": {}
        }

        return {
            "spots": {
                "type": "FeatureCollection",
                "features": filtered_features,
                "count": len(filtered_features)
            },
            "buffer": buffer_geojson,
            "statistics": stats
        }

    except Exception as e:
        print(f"❌ API error: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

# Local development entry
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080)
