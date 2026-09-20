import { useState, useMemo } from 'react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Table } from '../ui/Table';
import type { KeywordRow } from '../../types';

interface KeywordsTableProps {
  rows: KeywordRow[];
}

export function KeywordsTable({ rows }: KeywordsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'position' | 'change' | 'keyword'>('position');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'top3' | 'improved'>('all');

  const filteredAndSortedRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((r) => r.keyword.toLowerCase().includes(term));
    }

    if (filterType === 'top3') {
      result = result.filter((r) => r.position <= 3);
    } else if (filterType === 'improved') {
      result = result.filter((r) => r.change > 0);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'position') {
        comparison = a.position - b.position;
      } else if (sortBy === 'change') {
        comparison = a.change - b.change;
      } else {
        comparison = a.keyword.localeCompare(b.keyword);
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [rows, searchTerm, sortBy, sortAsc, filterType]);

  const handleSort = (column: 'position' | 'change' | 'keyword') => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(column === 'position');
    }
  };

  return (
    <Card
      title="High-impact search queries"
      action={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Badge tone="positive">{rows.length} tracked queries</Badge>
        </div>
      }
    >
      {/* Table controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <input
          type="text"
          className="input"
          placeholder="Filter keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ width: '220px', padding: '6px 10px', fontSize: '12px' }}
        />

        <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
          <button
            type="button"
            className={`badge ${filterType === 'all' ? 'badge-neutral' : ''}`}
            onClick={() => setFilterType('all')}
            style={{ border: 0, cursor: 'pointer' }}
          >
            All ({rows.length})
          </button>
          <button
            type="button"
            className={`badge ${filterType === 'top3' ? 'badge-positive' : ''}`}
            onClick={() => setFilterType('top3')}
            style={{ border: 0, cursor: 'pointer' }}
          >
            Top 3 Rankings
          </button>
          <button
            type="button"
            className={`badge ${filterType === 'improved' ? 'badge-positive' : ''}`}
            onClick={() => setFilterType('improved')}
            style={{ border: 0, cursor: 'pointer' }}
          >
            Gaining Rank
          </button>
        </div>
      </div>

      <Table>
        <thead>
          <tr>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('keyword')}
              title="Click to sort by keyword"
            >
              Keyword {sortBy === 'keyword' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('position')}
              title="Click to sort by rank position"
            >
              Rank {sortBy === 'position' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th>Search Volume</th>
            <th>Traffic Share</th>
            <th
              style={{ cursor: 'pointer' }}
              onClick={() => handleSort('change')}
              title="Click to sort by ranking shift"
            >
              Change {sortBy === 'change' ? (sortAsc ? '▲' : '▼') : ''}
            </th>
            <th>Intent</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedRows.length > 0 ? (
            filteredAndSortedRows.map((row) => (
              <tr key={row.keyword}>
                <td>
                  <strong>{row.keyword}</strong>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      minWidth: '28px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: row.position <= 3 ? '#e1f4e9' : 'rgba(0,0,0,0.05)',
                      color: row.position <= 3 ? '#146b50' : 'inherit',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  >
                    #{row.position}
                  </span>
                </td>
                <td>{row.volume} / mo</td>
                <td>{row.traffic}</td>
                <td>
                  <span
                    className={
                      row.change > 0
                        ? 'trend trend-up'
                        : row.change < 0
                        ? 'trend trend-down'
                        : 'trend trend-neutral'
                    }
                  >
                    {row.change > 0 ? `+${row.change}` : row.change === 0 ? '—' : row.change}
                  </span>
                </td>
                <td>
                  {row.intent && (
                    <Badge
                      tone={
                        row.intent === 'transactional'
                          ? 'positive'
                          : row.intent === 'commercial'
                          ? 'warning'
                          : 'neutral'
                      }
                    >
                      {row.intent}
                    </Badge>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--muted)' }}>
                No search queries matching "{searchTerm}"
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </Card>
  );
}
