from flask import Flask, request, jsonify
from shapely.geometry import shape
import requests
import geojson
import os
from flask_caching import Cache
from flask_cors import CORS
import time
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)
app.config['CACHE_TYPE'] = 'SimpleCache'
app.config['CACHE_DEFAULT_TIMEOUT'] = 3600
cache = Cache(app)

ORS_API_KEY = os.getenv("ORS_API_KEY")
HEADERS = {
    'User-Agent': 'find/1.0 (daniel.yi166@gmail.com)'
}

def geocode_address(address: str):
    endpoint = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address,
        "format": "json",
        "limit": 1,
        "addressdetails": 1
    }
    try:
        time.sleep(1)
        response = requests.get(endpoint, params=params, headers=HEADERS, timeout=10)
        response.raise_for_status()
        data = response.json()
        if not data:
            return None
        return [float(data[0]["lon"]), float(data[0]["lat"])]
    except (requests.exceptions.RequestException, ValueError, KeyError) as e:
        app.logger.error(f"Geocoding failed for address {address}, {str(e)}")
        return None

@app.route('/api/geocode', methods=['GET'])
def proxy_geocode():
    address = request.args.get('q')
    if not address:
        return jsonify({"error": "Address parameter is required"}), 400

    response = requests.get(
        'https://nominatim.openstreetmap.org/search',
        params={'q': address, 'format': 'json', 'addressdetails': 1, 'limit': 5},
        headers={'User-Agent': 'YourAppName'}
    )

    if response.status_code != 200:
        return jsonify({"error": "Failed to fetch suggestions"}), 500

    return jsonify(response.json())

@cache.memoize()
def get_isochrone(coords: list, profile: str, time_minutes: int):
    url = f"https://api.openrouteservice.org/v2/isochrones/{profile}"
    headers = {"Authorization": ORS_API_KEY}
    
    params = {
        "locations": [coords],
        "range": [time_minutes * 60],
        "range_type": "time",
        "attributes": ["total_pop"]
    }
    
    try:
        response = requests.post(url, json=params, headers=headers, timeout=30)
        response.raise_for_status()
        return shape(response.json()["features"][0]["geometry"])
    except (requests.exceptions.RequestException, ValueError, KeyError) as e:
        app.logger.error(f"Isochrone generation error, {str(e)}")
        return None

@app.route('/api/locus', methods=['POST'])
def calculate_locus():
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400
        
    data = request.get_json()
    constraints = data.get("constraints", [])
    
    if not constraints:
        return jsonify({"error": "No constraints provided"}), 400
    
    features = []
    errors = []
    constraint_details = []
    
    for constraint in constraints:
        if not isinstance(constraint, dict) or "address" not in constraint:
            errors.append(f"Invalid constraint format: {constraint}")
            continue
            
        coords = geocode_address(constraint["address"])
        if not coords:
            errors.append(f"Address not found: {constraint['address']}")
            continue
        
        constraint_with_coords = {**constraint, "coordinates": coords}
        constraint_details.append(constraint_with_coords)
        
        profile = constraint.get('mode')
        time_val = constraint.get("time", 10)
        uncertainty = constraint.get("uncertainty", 2)
        
        outer = get_isochrone(coords, profile, time_val + uncertainty)
        inner = get_isochrone(coords, profile, max(0, time_val - uncertainty))
        
        if not outer:
            errors.append(f"Failed to generate outer isochrone for {constraint['address']}")
            continue
        
        if inner:
            ring = outer.difference(inner)
        else:
            ring = outer
        
        feature = geojson.Feature(
            geometry=ring,
            properties={
                "address": constraint["address"],
                "mode": profile,
                "time": time_val,
                "uncertainty": uncertainty,
                "color": get_color_for_index(len(features))
            }
        )
        features.append(feature)
    
    if errors:
        return jsonify({
            "error": "Partial failure", 
            "details": errors,
            "constraints": constraint_details,
            "features": features
        }), 207
    
    if not features:
        return jsonify({"error": "No valid constraints processed"}), 400

    return jsonify({
        "type": "FeatureCollection",
        "features": features,
        "constraints": constraint_details
    })

def get_color_for_index(index):
    colors = [
        "#FF5733", "#33FF57", "#3357FF", "#F333FF", "#FF33F3",
        "#33FFF5", "#FF8C33", "#8C33FF", "#33FF8C", "#FF338C"
    ]
    return colors[index % len(colors)]

if __name__ == "__main__":
    app.run(port=5000)