import React from 'react';
import { useShift } from '../context/ShiftContext';

const shifts = [
  { number: 1, label: 'Shift 1', desc: 'Morning' },
  { number: 2, label: 'Shift 2', desc: 'Afternoon' },
  { number: 3, label: 'Shift 3', desc: 'Night' },
];

export const ShiftPicker: React.FC = () => {
  const { setShift } = useShift();

  return (
    <div className="shift-picker-screen">
      <div className="shift-picker-content">
        <div className="shift-picker-icon">🍏</div>
        <h1 className="shift-picker-title">FoodATM</h1>
        <p className="shift-picker-subtitle">Select your shift to begin</p>

        <div className="shift-options">
          {shifts.map(shift => (
            <button
              key={shift.number}
              className="shift-option-btn"
              onClick={() => setShift(shift.number)}
              type="button"
            >
              <span className="shift-option-label">{shift.label}</span>
              <span className="shift-option-desc">{shift.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
