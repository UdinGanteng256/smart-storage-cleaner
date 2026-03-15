import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { FileNode, LargeFilesResponse } from '../types';
import FileDetail from './FileDetail';

interface LargeFilesViewProps {
  path: string;
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const LargeFilesView: React.FC<LargeFilesViewProps> = ({ path }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LargeFilesResponse | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [minSizeMB, setMinSizeMB] = useState(100);
  const [limit, setLimit] = useState(100);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await api.getLargeFiles(path, {
        minSizeMB,
        limit,
      });
      setData(result);
    } catch (error) {
      console.error('Failed to load large files:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(debounce);
  }, [path, minSizeMB, limit]);

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
          📦 Large Files Detector
        </h2>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Minimum size slider */}
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#555' }}>
              Minimum size: {minSizeMB} MB
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={minSizeMB}
              onChange={(e) => setMinSizeMB(parseInt(e.target.value, 10))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#999', marginTop: '4px' }}>
              <span>10 MB</span>
              <span>1 GB</span>
            </div>
          </div>

          {/* Limit selector */}
          <div style={{ width: '150px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '8px', color: '#555' }}>
              Max results
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
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
            onClick={() => setMinSizeMB(500)}
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
            🐘 500 MB+
          </button>
          <button
            onClick={() => setMinSizeMB(200)}
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
            📼 200 MB+
          </button>
          <button
            onClick={() => setMinSizeMB(100)}
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
            📁 100 MB+
          </button>
          <button
            onClick={() => setMinSizeMB(50)}
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
            📄 50 MB+
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
          <p style={{ color: '#666' }}>Scanning for large files...</p>
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
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Large Files</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{data.total}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                Files ≥ {formatSize(minSizeMB * 1024 * 1024)}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Total Size</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{formatSize(data.totalSize)}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                {data.total > 0 ? formatSize(Math.round(data.totalSize / data.total)) + ' avg/file' : ''}
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              color: '#fff'
            }}>
              <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Showing</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{Math.min(data.total, limit)}</div>
              <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>
                Top files by size
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
              <h3>No Large Files Found!</h3>
              <p>No files found ≥ {formatSize(minSizeMB * 1024 * 1024)}</p>
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
                    {/* Rank */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: index < 3 ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : '#f0f0f0',
                      color: index < 3 ? '#fff' : '#666',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      flexShrink: 0
                    }}>
                      #{index + 1}
                    </div>

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
                        {file.extension.toUpperCase()}
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

export default LargeFilesView;
