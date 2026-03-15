import React from 'react';
import { FILE_TYPE_COLORS, FILE_TYPE_ICONS } from '../types';

interface FilterPanelProps {
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  fileCount: number;
  totalSize: number;
}

const FILE_TYPES = ['image', 'document', 'video', 'audio', 'other'];

const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedTypes,
  onTypeToggle,
  searchQuery,
  onSearchChange,
  fileCount,
  totalSize
}) => {
  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div style={{
      padding: '20px',
      background: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      marginBottom: '20px'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Search</h3>
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>Filter by Type</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {FILE_TYPES.map(type => (
            <button
              key={type}
              onClick={() => onTypeToggle(type)}
              style={{
                padding: '8px 16px',
                border: '2px solid ' + (selectedTypes.includes(type) ? FILE_TYPE_COLORS[type] : '#ddd'),
                borderRadius: '20px',
                background: selectedTypes.includes(type) ? FILE_TYPE_COLORS[type] + '20' : '#fff',
                color: selectedTypes.includes(type) ? FILE_TYPE_COLORS[type] : '#666',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: selectedTypes.includes(type) ? '600' : '400',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{FILE_TYPE_ICONS[type]}</span>
              <span style={{ textTransform: 'capitalize' }}>{type}</span>
            </button>
          ))}
        </div>
        {selectedTypes.length > 0 && (
          <button
            onClick={() => selectedTypes.forEach(onTypeToggle)}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              border: 'none',
              background: 'transparent',
              color: '#666',
              cursor: 'pointer',
              fontSize: '12px',
              textDecoration: 'underline'
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>Statistics</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Files</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {fileCount.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Size</div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {formatSize(totalSize)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
