import { useState, useEffect, useCallback } from 'react';
import NetworkGraph from './components/NetworkGraph';
import FilterPanel from './components/FilterPanel';
import FileDetail from './components/FileDetail';
import UnusedFilesView from './components/UnusedFilesView';
import LargeFilesView from './components/LargeFilesView';
import { api } from './api/client';
import { FileNode, FileGraph, ViewMode } from './types';

const DEFAULT_PATH = '/Users/muhammadpathihbataviant/Documents';

function App() {
  const [graphData, setGraphData] = useState<FileGraph>({ nodes: [], connections: [] });
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [scanPath, setScanPath] = useState(DEFAULT_PATH);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('graph');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.scanDirectory(scanPath, true, 3);
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [scanPath]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const totalSize = graphData.nodes.reduce((sum, node) => sum + node.size, 0);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f0f2f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid #ddd',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            🕸️
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
              Photo Organizer
            </h1>
            <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
              Network Graph Visualization
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* View mode tabs */}
          <div style={{
            display: 'flex',
            background: '#f0f0f0',
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setViewMode('graph')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: viewMode === 'graph' ? '600' : '400',
                background: viewMode === 'graph' ? '#fff' : 'transparent',
                color: viewMode === 'graph' ? '#667eea' : '#666',
                boxShadow: viewMode === 'graph' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🔗 Graph View
            </button>
            <button
              onClick={() => setViewMode('unused')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: viewMode === 'unused' ? '600' : '400',
                background: viewMode === 'unused' ? '#fff' : 'transparent',
                color: viewMode === 'unused' ? '#e74c3c' : '#666',
                boxShadow: viewMode === 'unused' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              🗑️ Unused Files
            </button>
            <button
              onClick={() => setViewMode('large')}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: viewMode === 'large' ? '600' : '400',
                background: viewMode === 'large' ? '#fff' : 'transparent',
                color: viewMode === 'large' ? '#f5576c' : '#666',
                boxShadow: viewMode === 'large' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📦 Large Files
            </button>
          </div>

          <input
            type="text"
            value={scanPath}
            onChange={(e) => setScanPath(e.target.value)}
            placeholder="Enter path to scan..."
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              width: '300px'
            }}
          />
          <button
            onClick={loadData}
            disabled={loading || viewMode !== 'graph'}
            style={{
              padding: '8px 16px',
              background: (loading || viewMode !== 'graph') ? '#ccc' : '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: (loading || viewMode !== 'graph') ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      {viewMode === 'graph' ? (
        <div style={{
          display: 'flex',
          padding: '24px',
          gap: '24px',
          maxWidth: '1600px',
          margin: '0 auto'
        }}>
          {/* Sidebar */}
          <div style={{ width: '320px', flexShrink: 0 }}>
            <FilterPanel
              selectedTypes={selectedTypes}
              onTypeToggle={handleTypeToggle}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              fileCount={graphData.nodes.length}
              totalSize={totalSize}
            />

            <div style={{
              padding: '20px',
              background: '#fff',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '16px' }}>How to Use</h3>
              <ul style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '13px',
                color: '#666',
                lineHeight: '1.8'
              }}>
                <li>Drag nodes to rearrange</li>
                <li>Scroll to zoom in/out</li>
                <li>Click a node for details</li>
                <li>Use filters to focus on specific types</li>
                <li>Search by filename or path</li>
              </ul>
            </div>
          </div>

          {/* Graph Area */}
          <div style={{ flex: 1 }}>
            {error ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                background: '#fff',
                borderRadius: '8px',
                color: '#e74c3c'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h3>Error Loading Files</h3>
                <p>{error}</p>
                <button
                  onClick={loadData}
                  style={{
                    padding: '10px 20px',
                    background: '#667eea',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginTop: '16px'
                  }}
                >
                  Retry
                </button>
              </div>
            ) : loading ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                background: '#fff',
                borderRadius: '8px'
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #667eea',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px'
                }} />
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
                <p>Scanning directory... This may take a moment.</p>
              </div>
            ) : graphData.nodes.length === 0 ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                background: '#fff',
                borderRadius: '8px',
                color: '#666'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                <h3>No Files Found</h3>
                <p>Enter a path and click Scan to start.</p>
              </div>
            ) : (
              <div style={{
                background: '#fff',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                padding: '20px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <div>
                    <span style={{
                      fontSize: '14px',
                      color: '#666'
                    }}>
                      Showing {graphData.nodes.length.toLocaleString()} files
                      {selectedTypes.length > 0 && ` (${selectedTypes.join(', ')})`}
                      {searchQuery && ` matching "${searchQuery}"`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setSelectedTypes([])}
                      disabled={selectedTypes.length === 0}
                      style={{
                        padding: '6px 12px',
                        border: '1px solid #ddd',
                        background: '#fff',
                        borderRadius: '4px',
                        cursor: selectedTypes.length === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        opacity: selectedTypes.length === 0 ? 0.5 : 1
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>

                <NetworkGraph
                  nodes={graphData.nodes}
                  connections={graphData.connections}
                  selectedTypes={selectedTypes}
                  searchQuery={searchQuery}
                  onNodeClick={setSelectedFile}
                  width={900}
                  height={600}
                />
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'unused' ? (
        <div style={{
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <UnusedFilesView path={scanPath} />
        </div>
      ) : (
        <div style={{
          padding: '24px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <LargeFilesView path={scanPath} />
        </div>
      )}

      {/* File Detail Modal */}
      <FileDetail
        file={selectedFile}
        onClose={() => setSelectedFile(null)}
      />
    </div>
  );
}

export default App;
