from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shapely.geometry import Point, shape
import json
import os
from pyproj import Geod

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load GeoJSON data
DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/multifamily.geojson")

try:
    with open(DATA_PATH, 'r') as f:
        geojson_data = json.load(f)
except Exception as e:
    print(f"Error loading GeoJSON data: {e}")
    geojson_data = {"type": "FeatureCollection", "features": []}

class CoordinateRequest(BaseModel):
    lat: float
    lon: float
    buffer_meters: float = 750  # Default buffer of 750 meters

@app.post("/api/spots-in-buffer")
async def get_spots_in_buffer(coords: CoordinateRequest):
    try:
        # Create center point
        center = Point(coords.lon, coords.lat)
        
        # Use a geodesic calculation for accurate buffer
        geod = Geod(ellps="WGS84")
        
        # Filter features within buffer
        filtered_features = []
        for feature in geojson_data["features"]:
            try:
                # Handle different geometry types
                feature_geom = shape(feature["geometry"])
                
                # Calculate distance in meters
                if feature_geom.geom_type == "Point":
                    # For Point geometries
                    lon1, lat1 = center.x, center.y
                    lon2, lat2 = feature_geom.x, feature_geom.y
                    _, _, distance = geod.inv(lon1, lat1, lon2, lat2)
                else:
                    # For other geometry types, find closest point
                    distance = feature_geom.distance(center) * 111000  # Rough conversion to meters
                
                if distance <= coords.buffer_meters:
                    filtered_features.append(feature)
            except Exception as e:
                print(f"Error processing feature: {e}")
                continue
        
        return {
            "type": "FeatureCollection",
            "features": filtered_features,
            "count": len(filtered_features)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)