import { useState, useEffect } from 'react';
import axios from 'axios';
import ConstraintForm from './components/ConstraintForm';
import ConstraintsList from './components/ConstraintsList';
import ResultMap from './components/ResultMap';
import './App.css';

function App() {
  const [constraints, setConstraints] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchResults = async (constraints) => {
    if (constraints.length === 0) {
      setGeoData(null);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/locus', { 
        constraints 
      });
      
      if (response.data.error) {
        setError(response.data.error);
        setGeoData(null);
      } else {
        setGeoData(response.data);
      }
  
      setConstraints(prev => {
        const newConstraints = [...prev];
        const hasNewCoordinates = response.data?.constraints?.some((c, i) => 
          c.coordinates && (!newConstraints[i]?.coordinates || 
          (c.coordinates[0] !== newConstraints[i]?.coordinates[0] || 
           c.coordinates[1] !== newConstraints[i]?.coordinates[1]))
        );
  
        if (hasNewCoordinates) {
          return newConstraints.map((c, i) => ({
            ...c,
            coordinates: response.data.constraints[i]?.coordinates || c.coordinates
          }));
        }
        return prev;
      });
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setError(error.response?.data?.error || 'Failed to calculate locations');
      setGeoData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const removeConstraint = (index) => {
    setConstraints(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    fetchResults(constraints);
  }, [constraints]);

  return (
    <div className="app-container">
      <h1>Location Finder</h1>
      
      <div className="main-content">
        <div className="constraints-section">
          <ConstraintForm 
            onConstraintsUpdate={setConstraints}
            isLoading={isLoading}
          />
          
          <ConstraintsList 
            constraints={constraints}
            onRemoveConstraint={removeConstraint}
          />
        </div>
        
        <div className="results-section">
          {isLoading && <div className="loading-spinner">Loading...</div>}
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <ResultMap 
            geoData={geoData} 
            constraints={constraints}
            onRemoveConstraint={removeConstraint}
          />
        </div>
      </div>
    </div>
  );
}

export default App;