from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shapely.geometry import Point, Polygon, shape
import json
import os

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
DATA_PATH = os.path.join(os.path.dirname(__file__), "data/yimby.geojson")

try:
    with open(DATA_PATH, 'r') as f:
        geojson_data = json.load(f)
except Exception as e:
    print(f"Error loading GeoJSON data: {e}")
    geojson_data = {"type": "FeatureCollection", "features": []}

class CoordinateRequest(BaseModel):
    lat: float
    lon: float
    buffer_meters: float = 250

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