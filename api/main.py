from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shapely.geometry import Point, shape
import json
import statistics
import numpy as np
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this to be more restrictive in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load GeoJSON data from local file
try:
    local_geojson_path = os.path.join("..", "data", "yimby.geojson")
    with open(local_geojson_path, "r") as f:
        geojson_data = json.load(f)
    print(f"Successfully loaded GeoJSON data from {local_geojson_path}")
except Exception as e:
    print(f"Error loading GeoJSON data from local file: {e}")
    geojson_data = {"type": "FeatureCollection", "features": []}

class CoordinateRequest(BaseModel):
    lat: float
    lon: float
    buffer_meters: float = 250

def calculate_average(values):
    if not values:
        return None
    filtered_values = [float(v) for v in values if v is not None and v != ""]
    return sum(filtered_values) / len(filtered_values) if filtered_values else None

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
                yearly_data[year_str] = {
                    "incomes": [],
                    "home_values": [],
                    "count": 0
                }

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

        market_value = props.get("market_value")
        sale_price = props.get("sale_price")
        impact_score = props.get("impact_score")

        if market_value not in (None, ""):
            market_values.append(float(market_value))
        if sale_price not in (None, ""):
            sale_prices.append(float(sale_price))
        if impact_score not in (None, ""):
            impact_scores.append(float(impact_score))

    stats = {
        "years": [],
        "avgIncome": [],
        "avgHomeValue": [],
        "countByYear": [],
        "zoningLabels": list(zoning_data.keys()),
        "zoningValues": list(zoning_data.values()),
        "avgMarketValue": calculate_average(market_values),
        "avgSalePrice": calculate_average(sale_prices)
    }

    avg_impact_score = calculate_average(impact_scores)
    if avg_impact_score is not None:
        if avg_impact_score > 500:
            stats["avgImpactScore"] = 100
            stats["rawAvgImpactScore"] = avg_impact_score
            print(f"Normalized impact score: original={avg_impact_score}, normalized=100")
        else:
            stats["avgImpactScore"] = avg_impact_score
            stats["rawAvgImpactScore"] = avg_impact_score
    else:
        stats["avgImpactScore"] = None
        stats["rawAvgImpactScore"] = None

    for year in sorted(yearly_data.keys()):
        stats["years"].append(year)
        stats["avgIncome"].append(calculate_average(yearly_data[year]["incomes"]))
        stats["avgHomeValue"].append(calculate_average(yearly_data[year]["home_values"]))
        stats["countByYear"].append(yearly_data[year]["count"])

    return stats

@app.post("/api/spots-in-buffer")
async def get_spots_in_buffer(coords: CoordinateRequest):
    try:
        center = Point(coords.lon, coords.lat)
        buffer_degrees = coords.buffer_meters / 111000
        buffer_circle = center.buffer(buffer_degrees)

        filtered_features = []
        for feature in geojson_data["features"]:
            try:
                feature_geom = shape(feature["geometry"])
                if buffer_circle.intersects(feature_geom):
                    filtered_features.append(feature)
            except Exception as e:
                print(f"Error processing feature: {e}")
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
        print(f"Error in API: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
