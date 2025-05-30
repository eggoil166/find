import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

function FitBounds({ geoData, constraints }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const bounds = new L.LatLngBounds();
    let hasBounds = false;

    constraints.forEach(constraint => {
      if (constraint.coordinates) {
        bounds.extend([constraint.coordinates[1], constraint.coordinates[0]]);
        hasBounds = true;
      }
    });

    if (geoData && geoData.features) {
      geoData.features.forEach(feature => {
        const layer = L.geoJSON(feature);
        bounds.extend(layer.getBounds());
        hasBounds = true;
      });
    }

    if (hasBounds) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [geoData, constraints, map]);

  return null;
}

const ResultMap = ({ geoData, constraints, onRemoveConstraint }) => {
  return (
    <div className="map-container">
      <MapContainer
        center={[40.7128, -74.0060]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        
        {geoData?.features?.map((feature, index) => (
          <GeoJSON 
            key={`isochrone-${index}`}
            data={feature.geometry} 
            style={{
              fillColor: feature.properties?.color || '#3388ff',
              weight: 2,
              opacity: 1,
              color: 'white',
              fillOpacity: 0.4
            }}
          />
        ))}
        
        {constraints.map((constraint, index) => {
          if (!constraint.coordinates) return null;
          
          return (
            <Marker 
              key={`constraint-${index}`} 
              position={[constraint.coordinates[1], constraint.coordinates[0]]}
            >
              <Popup>
                <div className="constraint-popup">
                  <h4>Constraint {index + 1}</h4>
                  <p>{constraint.address}</p>
                  <p>Mode: {constraint.mode.replace(/-/g, ' ')}</p>
                  <p>Time: {constraint.time} ± {constraint.uncertainty} min</p>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveConstraint(index);
                    }}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <FitBounds geoData={geoData} constraints={constraints} />
      </MapContainer>
    </div>
  );
};

export default ResultMap;