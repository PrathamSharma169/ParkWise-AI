import React, { useEffect, useState } from 'react';
import { getDateRange } from '../utils/api';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

export default function DateSelector({ onFilterChange }) {
  const [bounds, setBounds] = useState({ min: '2023-11-01', max: '2024-04-30' });
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'single', 'range'
  const [singleDate, setSingleDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activePreset, setActivePreset] = useState('all');

  // Fetch date boundaries from dataset on mount
  useEffect(() => {
    async function loadBounds() {
      try {
        const range = await getDateRange();
        setBounds({
          min: range.min_date,
          max: range.max_date,
        });
        
        // Initialize inputs within limits
        setSingleDate(range.min_date);
        setStartDate(range.min_date);
        setEndDate(range.max_date);
      } catch (e) {
        console.error('Failed to load date boundaries:', e);
      }
    }
    loadBounds();
  }, []);

  // Propagate date selection changes back to App.jsx
  useEffect(() => {
    if (filterMode === 'all') {
      onFilterChange(null, null);
    } else if (filterMode === 'single') {
      if (singleDate) {
        onFilterChange(singleDate, singleDate);
      }
    } else if (filterMode === 'range') {
      if (startDate && endDate) {
        onFilterChange(startDate, endDate);
      }
    }
  }, [filterMode, singleDate, startDate, endDate]);

  const applyPreset = (presetName, start, end) => {
    setActivePreset(presetName);
    if (presetName === 'all') {
      setFilterMode('all');
    } else {
      setFilterMode('range');
      setStartDate(start);
      setEndDate(end);
    }
  };

  const handleModeChange = (mode) => {
    setFilterMode(mode);
    setActivePreset(mode === 'all' ? 'all' : 'custom');
  };

  return (
    <div className="date-selector-container">
      {/* Mode Selectors */}
      <div className="date-mode-toggle">
        <button
          className={`mode-btn ${filterMode === 'all' ? 'active' : ''}`}
          onClick={() => handleModeChange('all')}
        >
          <Clock size={13} />
          <span>Full Dataset</span>
        </button>
        <button
          className={`mode-btn ${filterMode === 'single' ? 'active' : ''}`}
          onClick={() => handleModeChange('single')}
        >
          <Calendar size={13} />
          <span>Single Date</span>
        </button>
        <button
          className={`mode-btn ${filterMode === 'range' ? 'active' : ''}`}
          onClick={() => handleModeChange('range')}
        >
          <Calendar size={13} />
          <span>Date Period</span>
        </button>
      </div>

      {/* Dynamic Date Inputs based on Mode */}
      {filterMode === 'single' && (
        <div className="date-inputs-wrapper single-date-mode">
          <label>Select Date:</label>
          <input
            type="date"
            value={singleDate}
            min={bounds.min}
            max={bounds.max}
            onChange={(e) => {
              setSingleDate(e.target.value);
              setActivePreset('custom');
            }}
            className="premium-date-input"
          />
        </div>
      )}

      {filterMode === 'range' && (
        <div className="date-inputs-wrapper range-date-mode">
          <div className="date-input-field">
            <label>From:</label>
            <input
              type="date"
              value={startDate}
              min={bounds.min}
              max={bounds.max}
              onChange={(e) => {
                setStartDate(e.target.value);
                setActivePreset('custom');
              }}
              className="premium-date-input"
            />
          </div>
          <ChevronRight size={14} className="input-separator" />
          <div className="date-input-field">
            <label>To:</label>
            <input
              type="date"
              value={endDate}
              min={bounds.min}
              max={bounds.max}
              onChange={(e) => {
                setEndDate(e.target.value);
                setActivePreset('custom');
              }}
              className="premium-date-input"
            />
          </div>
        </div>
      )}

      {/* Preset Pills */}
      <div className="date-presets-wrapper">
        <button
          className={`preset-pill ${activePreset === 'all' ? 'active' : ''}`}
          onClick={() => applyPreset('all')}
        >
          All Time
        </button>
        <button
          className={`preset-pill ${activePreset === 'nov23' ? 'active' : ''}`}
          onClick={() => applyPreset('nov23', '2023-11-01', '2023-11-30')}
        >
          Nov 2023
        </button>
        <button
          className={`preset-pill ${activePreset === 'dec23' ? 'active' : ''}`}
          onClick={() => applyPreset('dec23', '2023-12-01', '2023-12-31')}
        >
          Dec 2023
        </button>
        <button
          className={`preset-pill ${activePreset === 'mar24' ? 'active' : ''}`}
          onClick={() => applyPreset('mar24', '2024-03-01', '2024-03-31')}
        >
          Mar 2024
        </button>
        <button
          className={`preset-pill ${activePreset === 'apr24' ? 'active' : ''}`}
          onClick={() => applyPreset('apr24', '2024-04-01', '2024-04-30')}
        >
          Apr 2024
        </button>
      </div>
    </div>
  );
}
