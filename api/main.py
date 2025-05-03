from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from shapely.geometry import Point, shape
import json
import os
from pyproj import Geod
from typing import Optional

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
DATA_PATH = os.path.join(os.path.dirname(__file__), "../data/yimby_data.geojson")

try:
    with open(DATA_PATH, 'r') as f:
        geojson_data = json.load(f)
except Exception as e:
    print(f"Error loading GeoJSON data: {e}")
    geojson_data = {"type": "FeatureCollection", "features": []}

class CoordinateRequest(BaseModel):
    lat: float
    lon: float
    buffer_meters: float = 750
    year_start: Optional[int] = None
    year_end: Optional[int] = None

class RCORequest(BaseModel):
    rco_name: str
    year_start: Optional[int] = None
    year_end: Optional[int] = None

class DistrictRequest(BaseModel):
    district: str
    year_start: Optional[int] = None
    year_end: Optional[int] = None

@app.post("/api/spots-in-buffer")
async def get_spots_in_buffer(coords: CoordinateRequest):
    try:
        # Create center point
        center = Point(coords.lon, coords.lat)
        
        # Use a geodesic calculation for accurate buffer
        geod = Geod(ellps="WGS84")
        
        # Filter features within buffer and by year
        filtered_features = []
        for feature in geojson_data["features"]:
            try:
                # Check year range if provided
                cons_complete = feature["properties"].get("cons_complete")
                if cons_complete:
                    if coords.year_start and cons_complete < coords.year_start:
                        continue
                    if coords.year_end and cons_complete > coords.year_end:
                        continue
                
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

@app.post("/api/spots-by-rco")
async def get_spots_by_rco(request: RCORequest):
    try:
        filtered_features = []
        for feature in geojson_data["features"]:
            # Filter by RCO name
            if feature["properties"].get("RCO") == request.rco_name:
                # Check year range if provided
                cons_complete = feature["properties"].get("cons_complete")
                if cons_complete:
                    if request.year_start and cons_complete < request.year_start:
                        continue
                    if request.year_end and cons_complete > request.year_end:
                        continue
                filtered_features.append(feature)
        
        return {
            "type": "FeatureCollection",
            "features": filtered_features,
            "count": len(filtered_features)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.post("/api/spots-by-district")
async def get_spots_by_district(request: DistrictRequest):
    try:
        filtered_features = []
        for feature in geojson_data["features"]:
            # Filter by district
            if feature["properties"].get("DISTRICT") == request.district:
                # Check year range if provided
                cons_complete = feature["properties"].get("cons_complete")
                if cons_complete:
                    if request.year_start and cons_complete < request.year_start:
                        continue
                    if request.year_end and cons_complete > request.year_end:
                        continue
                filtered_features.append(feature)
        
        return {
            "type": "FeatureCollection",
            "features": filtered_features,
            "count": len(filtered_features)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/rco-list")
async def get_rco_list():
    """Get a list of unique RCO names"""
    try:
        rco_set = set()
        for feature in geojson_data["features"]:
            rco = feature["properties"].get("RCO")
            if rco:
                rco_set.add(rco)
        return sorted(list(rco_set))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/api/district-list")
async def get_district_list():
    """Get a list of unique district numbers"""
    try:
        district_set = set()
        for feature in geojson_data["features"]:
            district = feature["properties"].get("DISTRICT")
            if district:
                district_set.add(district)
        return sorted(list(district_set))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)