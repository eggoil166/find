import React from 'react';

const ConstraintsList = ({ constraints, onRemoveConstraint }) => {
  return (
    <div className="constraints-panel">
      <h3>Current Constraints</h3>
      {constraints.length === 0 ? (
        <p>No constraints added yet</p>
      ) : (
        <ul className="constraints-list">
          {constraints.map((constraint, index) => (
            <li key={index} className="constraint-item">
              <div className="constraint-info">
                <span className="constraint-address">{constraint.address}</span>
                <div className="constraint-details">
                  <span>Mode: {getModeName(constraint.mode)}</span>
                  <span>Time: {constraint.time} ± {constraint.uncertainty} min</span>
                </div>
              </div>
              <button 
                onClick={() => onRemoveConstraint(index)}
                className="remove-constraint"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const getModeName = (mode) => {
  switch (mode) {
    case 'driving-car': return 'Car';
    case 'foot-walking': return 'Walking';
    case 'cycling': return 'Bicycle';
    default: return mode;
  }
};

export default ConstraintsList;