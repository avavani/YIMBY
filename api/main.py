from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shapely.geometry import Point, Polygon, shape
import json
import os
import statistics
import numpy as np
from google.cloud import storage
from dotenv import load_dotenv
# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update this to be more restrictive in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Google Cloud Storage configuration
BUCKET_NAME = "Practicum"  # Replace with your actual bucket name
GEOJSON_BLOB_NAME = "data/yimby.geojson"  # Path in your bucket

# Initialize Google Cloud Storage client
storage_client = storage.Client()
bucket = storage_client.bucket(BUCKET_NAME)

# Load GeoJSON data from Google Cloud Storage
try:
    blob = bucket.blob(GEOJSON_BLOB_NAME)
    geojson_content = blob.download_as_text()
    geojson_data = json.loads(geojson_content)
    print(f"Successfully loaded GeoJSON data from Cloud Storage")
except Exception as e:
    print(f"Error loading GeoJSON data from Cloud Storage: {e}")
    geojson_data = {"type": "FeatureCollection", "features": []}

class CoordinateRequest(BaseModel):
    lat: float
    lon: float
    buffer_meters: float = 250

# The rest of your code remains the same
def calculate_average(values):
    """Calculate average of a list of values, filtering out None/null values"""
    if not values:
        return None
    
    # Filter out None/null values and convert to float
    filtered_values = [float(v) for v in values if v is not None and v != ""]
    
    if not filtered_values:
        return None
    
    return sum(filtered_values) / len(filtered_values)

def calculate_statistics(features):
    # Your existing calculate_statistics function (unchanged)
    """Calculate various statistics from the features"""
    if not features:
        return {}
    
    # Initialize data structures
    yearly_data = {}
    zoning_data = {}
    market_values = []
    sale_prices = []
    impact_scores = []
    
    # Process each feature
    for feature in features:
        props = feature.get("properties", {})
        
        # Extract yearly data
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
            
            # Count by construction completion year
            cons_complete = props.get("cons_complete")
            if cons_complete == year or cons_complete == year_str:
                yearly_data[year_str]["count"] += 1
        
        # Extract zoning data
        zoning = props.get("zoning")
        if zoning:
            if zoning not in zoning_data:
                zoning_data[zoning] = 0
            zoning_data[zoning] += 1
        
        # Extract market value and sale price
        market_value = props.get("market_value")
        sale_price = props.get("sale_price")
        impact_score = props.get("impact_score")
        
        if market_value is not None and market_value != "":
            market_values.append(float(market_value))
        if sale_price is not None and sale_price != "":
            sale_prices.append(float(sale_price))
        if impact_score is not None and impact_score != "":
            impact_scores.append(float(impact_score))
    
    # Calculate statistics
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
    
    # Calculate impact score statistics and normalize
    avg_impact_score = calculate_average(impact_scores)
    
    # If we have impact scores, normalize them around 100
    if avg_impact_score is not None:
        if avg_impact_score > 500:  # If too large, normalize
            normalization_factor = avg_impact_score / 100
            stats["avgImpactScore"] = 100  # Normalized value
            stats["rawAvgImpactScore"] = avg_impact_score  # Original value
            
            # Log for debugging
            print(f"Normalized impact score: original={avg_impact_score}, normalized=100")
        else:
            stats["avgImpactScore"] = avg_impact_score
            stats["rawAvgImpactScore"] = avg_impact_score
    else:
        stats["avgImpactScore"] = None
        stats["rawAvgImpactScore"] = None
    
    # Calculate yearly averages
    for year in sorted(yearly_data.keys()):
        stats["years"].append(year)
        
        # Average income
        stats["avgIncome"].append(
            calculate_average(yearly_data[year]["incomes"])
        )
        
        # Average home value
        stats["avgHomeValue"].append(
            calculate_average(yearly_data[year]["home_values"])
        )
        
        # Count by year
        stats["countByYear"].append(yearly_data[year]["count"])
    
    return stats

@app.post("/api/spots-in-buffer")
async def get_spots_in_buffer(coords: CoordinateRequest):
    try:
        # Create center point
        center = Point(coords.lon, coords.lat)
        
        # Create a buffer around the center point
        # For simplicity, we'll use a degree-based buffer and approximate meters
        # 0.00001 degrees is roughly 1.11 meters at the equator
        buffer_degrees = coords.buffer_meters / 111000  # Approximate conversion
        buffer_circle = center.buffer(buffer_degrees)
        
        # Filter features within buffer
        filtered_features = []
        for feature in geojson_data["features"]:
            try:
                # Convert feature geometry to shapely object
                feature_geom = shape(feature["geometry"])
                
                # Check if feature intersects with the buffer
                if buffer_circle.intersects(feature_geom):
                    filtered_features.append(feature)
            except Exception as e:
                print(f"Error processing feature: {e}")
                continue
        
        # Calculate statistics for the filtered features
        stats = calculate_statistics(filtered_features)
        
        # Create GeoJSON for the buffer
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
    uvicorn.run(app, host="0.0.0.0", port=8080)  # Changed port to 8080 for Google Cloud Run