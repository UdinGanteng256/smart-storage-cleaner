import React from 'react';
import { FileNode, FILE_TYPE_COLORS, FILE_TYPE_ICONS } from '../types';

interface FileDetailProps {
  file: FileNode | null;
  onClose: () => void;
}

const FileDetail: React.FC<FileDetailProps> = ({ file, onClose }) => {
  if (!file) return null;

  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #eee'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: FILE_TYPE_COLORS[file.type] + '20',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            {FILE_TYPE_ICONS[file.type]}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              wordBreak: 'break-word'
            }}>
              {file.name}
            </h2>
            <div style={{
              fontSize: '12px',
              color: '#666',
              textTransform: 'uppercase',
              marginTop: '4px'
            }}>
              {file.extension} • {file.type}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
              Path
            </label>
            <div style={{
              fontSize: '13px',
              fontFamily: 'monospace',
              background: '#f5f5f5',
              padding: '8px',
              borderRadius: '4px',
              wordBreak: 'break-all'
            }}>
              {file.path}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Size
              </label>
              <div style={{ fontSize: '14px', fontWeight: '500' }}>{formatSize(file.size)}</div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Type
              </label>
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}>
                {file.type}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Created
              </label>
              <div style={{ fontSize: '13px' }}>{formatDate(file.createdAt)}</div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Modified
              </label>
              <div style={{ fontSize: '13px' }}>{formatDate(file.modifiedAt)}</div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Accessed
              </label>
              <div style={{ fontSize: '13px' }}>{formatDate(file.accessedAt)}</div>
            </div>
          </div>

          {file.metadata && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: '#f8f9fa',
              borderRadius: '6px'
            }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '8px' }}>
                Metadata
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {file.metadata.width && file.metadata.height && (
                  <div style={{ fontSize: '13px' }}>
                    Dimensions: {file.metadata.width} × {file.metadata.height}
                  </div>
                )}
                {file.metadata.duration && (
                  <div style={{ fontSize: '13px' }}>
                    Duration: {file.metadata.duration}s
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileDetail;
