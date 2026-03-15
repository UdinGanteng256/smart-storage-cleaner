import React, { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import * as d3 from 'd3';
import { FileNode, FileConnection, FILE_TYPE_COLORS } from '../types';

interface NetworkGraphProps {
  nodes: FileNode[];
  connections: FileConnection[];
  selectedTypes: string[];
  searchQuery: string;
  onNodeClick?: (node: FileNode) => void;
  width?: number;
  height?: number;
}

// Performance constants - optimized for handling thousands of files
const NODES_PER_PAGE = 150; // Increased for better coverage
const MAX_CONNECTIONS = 300; // Limit connections for performance
const ALPHA_DECAY = 0.02; // Faster cooling
const VELOCITY_DECAY = 0.3; // Faster stabilization
const NODE_RADIUS = 8; // Fixed node size for performance

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  connections,
  selectedTypes,
  searchQuery,
  onNodeClick,
  width = 800,
  height = 600
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const simulationRef = useRef<d3.Simulation<FileNode, undefined> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null);
  const containerRef = useRef<SVGGElement | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);

  // Filter nodes based on selected types and search query
  const filteredNodes = useMemo(() => {
    let result = nodes.filter(node => {
      const typeMatch = selectedTypes.length === 0 || selectedTypes.includes(node.type);
      const searchMatch = !searchQuery ||
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.path.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && searchMatch;
    });

    // Sort by size (larger files first) for better visualization
    result.sort((a, b) => b.size - a.size);

    return result;
  }, [nodes, selectedTypes, searchQuery]);

  // Paginate nodes for performance
  const paginatedNodes = useMemo(() => {
    const start = currentPage * NODES_PER_PAGE;
    return filteredNodes.slice(start, start + NODES_PER_PAGE);
  }, [filteredNodes, currentPage]);

  const totalPages = Math.ceil(filteredNodes.length / NODES_PER_PAGE);

  // Filter and limit connections
  const filteredConnections = useMemo(() => {
    const nodeIds = new Set(paginatedNodes.map(n => n.id));

    // Get connections where both nodes are in current page
    let relevantConnections = connections.filter(conn => {
      const sourceId = typeof conn.source === 'string' ? conn.source : conn.source.id;
      const targetId = typeof conn.target === 'string' ? conn.target : conn.target.id;
      return nodeIds.has(sourceId) && nodeIds.has(targetId);
    });

    // Sort by strength and take top connections
    relevantConnections.sort((a, b) => b.strength - a.strength);
    return relevantConnections.slice(0, MAX_CONNECTIONS);
  }, [connections, paginatedNodes]);

  // Cleanup simulation on unmount
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedTypes, searchQuery]);

  const renderGraph = useCallback(() => {
    if (!svgRef.current || paginatedNodes.length === 0) return;

    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container for zoom
    const container = svg.append('g');
    containerRef.current = container.node();

    // Setup zoom with debounce
    let zoomTimeout: NodeJS.Timeout;
    zoomRef.current = d3.zoom<any, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        // Debounce zoom updates
        clearTimeout(zoomTimeout);
        zoomTimeout = setTimeout(() => {
          container.attr('transform', event.transform);
        }, 16); // ~60fps
      });

    svg.call(zoomRef.current as any);

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Create optimized simulation
    simulationRef.current = d3.forceSimulation<FileNode>(paginatedNodes)
      .force('link', d3.forceLink<FileNode, FileConnection>(filteredConnections)
        .id(d => d.id)
        .distance(80)
        .strength(d => d.strength * 0.5)
      )
      .force('charge', d3.forceManyBody()
        .strength(-150)
        .distanceMax(300) // Limit charge distance for performance
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide()
        .radius((d: any) => {
          const size = Math.log10(d.size + 1);
          return Math.max(8, Math.min(25, size + 5)) + 5;
        })
        .strength(0.7)
      )
      .force('x', d3.forceX(width / 2).strength(0.05))
      .force('y', d3.forceY(height / 2).strength(0.05))
      .alphaDecay(ALPHA_DECAY)
      .velocityDecay(VELOCITY_DECAY);

    setIsSimulationRunning(true);

    // Draw links with simple lines (not paths for performance)
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(filteredConnections)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => Math.max(1, d.strength * 2));

    // Draw nodes group
    const nodeGroup = container.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(paginatedNodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer');

    // Add circles with size based on file size
    const circles = nodeGroup.append('circle')
      .attr('r', d => {
        const size = Math.log10(d.size + 1);
        return Math.max(6, Math.min(20, size + 4));
      })
      .attr('fill', d => FILE_TYPE_COLORS[d.type] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5);

    // Add simple labels only for larger nodes (performance optimization)
    nodeGroup.filter((d: any) => d.size > 100000)
      .append('text')
      .text((d: any) => d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name)
      .attr('x', 0)
      .attr('y', (d: any) => {
        const size = Math.log10(d.size + 1);
        return Math.max(6, Math.min(20, size + 4)) + 12;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#333')
      .attr('pointer-events', 'none')
      .style('opacity', 0.8);

    // Event handlers with debounce
    let hoverTimeout: NodeJS.Timeout;
    circles
      .on('mouseover', function() {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          d3.select(this)
            .transition().duration(150)
            .attr('r', NODE_RADIUS * 1.3)
            .attr('stroke-width', 2.5);
        }, 50);
      })
      .on('mouseout', function() {
        clearTimeout(hoverTimeout);
        d3.select(this)
          .transition().duration(150)
          .attr('r', NODE_RADIUS)
          .attr('stroke-width', 1.5);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeClick?.(d);
      });

    // Drag behavior
    const dragBehavior = d3.drag<SVGGElement, any>()
      .on('start', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
        (d as any).fx = d.x;
        (d as any).fy = d.y;
      })
      .on('drag', (event, d) => {
        (d as any).fx = event.x;
        (d as any).fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulationRef.current?.alphaTarget(0);
        (d as any).fx = null;
        (d as any).fy = null;
      });

    nodeGroup.call(dragBehavior as any);

    // Optimized tick function - use requestAnimationFrame
    let ticking = false;
    simulationRef.current.on('tick', () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          link
            .attr('x1', d => (d.source as FileNode).x || 0)
            .attr('y1', d => (d.source as FileNode).y || 0)
            .attr('x2', d => (d.target as FileNode).x || 0)
            .attr('y2', d => (d.target as FileNode).y || 0);

          nodeGroup.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
          ticking = false;
        });
      }
    });

    // Stop simulation after it stabilizes
    setTimeout(() => {
      simulationRef.current?.alphaTarget(0);
      setIsSimulationRunning(false);
    }, 3000);

  }, [paginatedNodes, filteredConnections, width, height, onNodeClick]);

  useEffect(() => {
    renderGraph();
  }, [renderGraph]);

  return (
    <div>
      {/* Performance Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        padding: '8px 12px',
        background: '#f8f9fa',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div>
          Showing {paginatedNodes.length} of {filteredNodes.length} files
          {filteredNodes.length > NODES_PER_PAGE && (
            <span style={{ marginLeft: '8px', color: '#e74c3c' }}>
              (Performance limited to {NODES_PER_PAGE} nodes/page)
            </span>
          )}
          {isSimulationRunning && (
            <span style={{ marginLeft: '8px', color: '#3498db' }}>
              ⚡ Stabilizing...
            </span>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              style={{
                padding: '4px 8px',
                border: '1px solid #ddd',
                background: '#fff',
                borderRadius: '4px',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                opacity: currentPage === 0 ? 0.5 : 1
              }}
            >
              ← Prev
            </button>
            <span style={{ padding: '0 8px' }}>
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              style={{
                padding: '4px 8px',
                border: '1px solid #ddd',
                background: '#fff',
                borderRadius: '4px',
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
                fontSize: '11px',
                opacity: currentPage >= totalPages - 1 ? 0.5 : 1
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          background: '#f8f9fa'
        }}
      />
    </div>
  );
};

export default NetworkGraph;
