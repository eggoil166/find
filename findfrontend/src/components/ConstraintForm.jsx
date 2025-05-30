import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const ConstraintForm = ({ onConstraintsUpdate, isLoading }) => {
  const [currentConstraint, setCurrentConstraint] = useState({
    address: '',
    mode: 'driving-car',
    time: 10,
    uncertainty: 2
  });
  const [suggestions, setSuggestions] = useState([]);

  const fetchSuggestions = useCallback(debounce(async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5000/api/geocode?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.error) {
        setSuggestions([]);
      } else {
        setSuggestions(data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }},400),[]
  );

  const addConstraint = () => {
    if (!currentConstraint.address) return;
    
    onConstraintsUpdate(prev => [...prev, {...currentConstraint,time: Number(currentConstraint.time),uncertainty: Number(currentConstraint.uncertainty)}]);
    
    setCurrentConstraint({
      address: '',
      mode: 'driving-car',
      time: 10,
      uncertainty: 2
    });
    setSuggestions([]);
  };

  return (
    <div className="constraint-form">
      <div className="form-row">
        <div className="form-group">
          <label>Address</label>
          <input
            onBlur={() => setTimeout(() => setSuggestions([]), 200)}
            onFocus={() => {
                if (currentConstraint.address.length > 2) {
                  fetchSuggestions(currentConstraint.address);
                }
              }}
            type="text"
            placeholder="Enter location"
            value={currentConstraint.address}
            onChange={(e) => {
              setCurrentConstraint({...currentConstraint, address: e.target.value});
              fetchSuggestions(e.target.value);
            }}
          />
          {suggestions.length > 0 && (
            <div className="suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="suggestion-item"
                  onClick={() => {
                    setCurrentConstraint({
                      ...currentConstraint,
                      address: suggestion.display_name
                    });
                    setSuggestions([]);
                  }}
                >
                  {suggestion.display_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Mode</label>
          <select
            value={currentConstraint.mode}
            onChange={(e) => {
                const value = e.target.value;
                setCurrentConstraint({...currentConstraint, mode: e.target.value});
            }}
          >
            <option value="driving-car">Car</option>
            <option value="foot-walking">Walking</option>
            <option value="cycling">Bicycle</option>
          </select>
        </div>

        <div className="form-group">
          <label>Time (min)</label>
          <input
            type="number"
            min="1"
            max="120"
            value={currentConstraint.time}
            onChange={(e) => setCurrentConstraint({...currentConstraint, time: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label>± (min)</label>
          <input
            type="number"
            min="0"
            max="30"
            value={currentConstraint.uncertainty}
            onChange={(e) => setCurrentConstraint({...currentConstraint, uncertainty: e.target.value})}
          />
        </div>

        <button 
          onClick={addConstraint}
          disabled={isLoading}
          className="add-button"
        >
          {isLoading ? 'Adding...' : 'Add Constraint'}
        </button>
      </div>
    </div>
  );
};

export default ConstraintForm;