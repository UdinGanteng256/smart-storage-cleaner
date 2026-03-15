import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FileNode, UnusedFilesResponse } from '../types';
import FileDetail from './FileDetail';

interface UnusedFilesViewProps {
  path: string;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const UnusedFilesView: React.FC<UnusedFilesViewProps> = ({ path }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<UnusedFilesResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [daysNotAccessed, setDaysNotAccessed] = useState(90);
  const [minSizeMB, setMinSizeMB] = useState(0);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getUnusedFiles(path, {
        daysNotAccessed,
        minSize: minSizeMB * 1024 * 1024,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load unused files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(debounce);
  }, [path, daysNotAccessed, minSizeMB]);

  const presetOptions = [
    { label: '30 days', value: 30 },
    { label: '60 days', value: 60 },
    { label: '90 days', value: 90 },
    { label: '180 days', value: 180 },
    { label: '1 year', value: 365 },
  ];

  return (
    <div style={{ padding: '20px' }}>
      {/* Header with controls */}
      <div style={{
        background: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🗑️ Unused Files Detector
        </h2>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Days not accessed slider */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#555' }}>
              Not accessed in:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {presetOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDaysNotAccessed(opt.value)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid',
                    borderColor: daysNotAccessed === opt.value ? '#667eea' : '#ddd',
                    background: daysNotAccessed === opt.value ? '#667eea' : '#fff',
                    color: daysNotAccessed === opt.value ? '#fff' : '#666',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: daysNotAccessed === opt.value ? '500' : '400'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum size slider */}
          <div style={{ width: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#555' }}>
              Min size: {minSizeMB} MB
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={minSizeMB}
              onChange={(e) => setMinSizeMB(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={loadData}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? '#ccc' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Loading...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Quick actions */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setDaysNotAccessed(365); setMinSizeMB(100); }}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666'
            }}
          >
            🎯 Large & Old (1 year, 100MB+)
          </button>
          <button
            onClick={() => { setDaysNotAccessed(180); setMinSizeMB(50); }}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              background: '#fff',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: '#666'
            }}
          >
            📦 Medium & Unused (6 months, 50MB+)
          </button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{
          padding: '40px',
          textAlign: 'center',
          background: '#fff',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#666' }}>Scanning for unused files...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Unused Files</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.total}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                Not accessed in {daysNotAccessed} days
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Potential Savings</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatSize(data.totalSavings)}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {data.total > 0 ? formatSize(Math.round(data.totalSavings / data.total)) + ' avg/file' : ''}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Min Size Filter</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{minSizeMB} MB</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                Files ≥ {formatSize(minSizeMB * 1024 * 1024)}
              </div>
            </div>
          </div>

          {/* File list */}
          {data.files.length === 0 ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '8px',
              color: '#666'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>✨</div>
              <h3>No Unused Files Found!</h3>
              <p>All your files have been accessed recently.</p>
            </div>
          ) : (
            <div style={{
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #eee',
                background: '#f9f9f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '16px' }}>
                  Files ({data.files.length})
                </h3>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  Sorted by size (largest first)
                </span>
              </div>

              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {data.files.map((file, index) => (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    style={{
                      padding: '16px 20px',
                      borderBottom: index < data.files.length - 1 ? '1px solid #eee' : 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f7ff'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                  >
                    {/* Icon */}
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: file.type === 'image' ? '#FF6B6B20' :
                        file.type === 'video' ? '#45B7D120' :
                          file.type === 'document' ? '#4ECDC420' : '#FFEAA720',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      flexShrink: 0
                    }}>
                      {file.type === 'image' ? '🖼️' :
                        file.type === 'video' ? '🎬' :
                          file.type === 'document' ? '📄' :
                            file.type === 'audio' ? '🎵' : '📦'}
                    </div>

                    {/* File info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: '500',
                        fontSize: '14px',
                        marginBottom: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {file.name}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#888',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {file.path}
                      </div>
                    </div>

                    {/* Size */}
                    <div style={{
                      textAlign: 'right',
                      minWidth: '100px',
                      flexShrink: 0
                    }}>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#e74c3c'
                      }}>
                        {formatSize(file.size)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Last: {new Date(file.accessedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* File detail modal */}
      <FileDetail
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
};

export default UnusedFilesView;
