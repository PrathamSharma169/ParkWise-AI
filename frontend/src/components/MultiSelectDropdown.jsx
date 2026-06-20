import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export default function MultiSelectDropdown({ options, selected, onChange, placeholder = 'Select Zones', accentColor = '#1B4332' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleOption = (val) => {
    if (selected.includes(val)) {
      onChange(selected.filter(item => item !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTriggerText = () => {
    if (selected.length === 0) return null;
    const firstOpt = options.find(o => o.value === selected[0]);
    const name = firstOpt ? firstOpt.label : selected[0];
    return selected.length === 1 ? name : `${name} +${selected.length - 1}`;
  };

  const displayText = getTriggerText();

  // Inline accent styles (avoids color-mix() compatibility issues)
  const accentBg = accentColor + '22';
  const accentBorder = accentColor + '44';

  return (
    <div className="msd-container" ref={containerRef}>
      <div
        className={`msd-trigger ${isOpen ? 'msd-trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="msd-trigger__content">
          {selected.length === 0 ? (
            <span className="msd-placeholder">{placeholder}</span>
          ) : (
            <div className="msd-selected-display">
              <span
                className="msd-selected-count"
                style={{ background: accentBg, color: accentColor, border: `1px solid ${accentBorder}` }}
              >
                {selected.length}
              </span>
              <span className="msd-selected-text">{displayText}</span>
            </div>
          )}
        </div>

        <div className="msd-trigger__actions">
          {selected.length > 0 && (
            <button
              className="msd-clear-btn"
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              title="Clear selection"
            >
              <X size={11} />
            </button>
          )}
          <ChevronDown size={14} className={`msd-chevron ${isOpen ? 'msd-chevron--open' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="msd-dropdown">
          <div className="msd-search">
            <Search size={12} className="msd-search__icon" />
            <input
              ref={inputRef}
              type="text"
              className="msd-search__input"
              placeholder="Search zones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button className="msd-search__clear" onClick={() => setSearchTerm('')}>
                <X size={10} />
              </button>
            )}
          </div>

          {selected.length > 0 && (
            <div className="msd-selection-info">
              <span>{selected.length} selected</span>
              <button className="msd-deselect-all" onClick={() => onChange([])}>Clear all</button>
            </div>
          )}

          <div className="msd-options">
            {filteredOptions.length === 0 ? (
              <div className="msd-empty">No zones found</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selected.includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className={`msd-option ${isSelected ? 'msd-option--selected' : ''}`}
                    onClick={() => toggleOption(opt.value)}
                    style={isSelected ? { background: accentBg } : {}}
                  >
                    <div
                      className="msd-checkbox"
                      style={isSelected
                        ? { background: accentColor, borderColor: accentColor }
                        : {}
                      }
                    >
                      {isSelected && <Check size={9} strokeWidth={3} />}
                    </div>
                    <span className="msd-option__label">{opt.label}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}