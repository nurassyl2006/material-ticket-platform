import React, { useState, useEffect } from 'react';
import { 
  Database, Network, Table, Key, ArrowRight, Link2, 
  Layers, Code2, RefreshCw, CheckCircle2, ShieldCheck, FileText, Cpu
} from 'lucide-react';
import { api } from '../api';

export default function DatabaseSchema() {
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('erd'); // 'erd', 'browser', 'ddl'
  const [selectedTable, setSelectedTable] = useState('loans');
  const [tableData, setTableData] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [highlightRel, setHighlightRel] = useState(null);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await api.getDbSchema();
      setSchemaData(res.data);
    } catch (err) {
      console.error('Failed to load schema:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName) => {
    setTableLoading(true);
    try {
      const res = await api.getTableData(tableName);
      setTableData(res.data);
    } catch (err) {
      console.error('Failed to load table data:', err);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  useEffect(() => {
    if (activeView === 'browser') {
      fetchTableData(selectedTable);
    }
  }, [activeView, selectedTable]);

  if (loading || !schemaData) {
    return (
      <div className="data-view-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <RefreshCw size={28} className="spin" style={{ color: 'var(--primary-500)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Introspecting database structure from SQLite engine...</p>
      </div>
    );
  }

  const { tables, relationships } = schemaData;

  return (
    <div className="data-view-container" style={{ maxWidth: '1440px' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>
            <Database size={24} style={{ color: 'var(--primary-500)' }} />
            Database Architecture & Table Relations
          </h1>
          <p>
            Isolated SQLite database: <code style={{ color: '#a5b4fc' }}>{schemaData.databaseFile}</code>
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className={`preset-btn ${activeView === 'erd' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveView('erd')}
          >
            <Network size={15} />
            <span>Visual ERD & Relations</span>
          </button>
          <button 
            className={`preset-btn ${activeView === 'browser' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveView('browser')}
          >
            <Table size={15} />
            <span>Live Data Browser</span>
          </button>
          <button 
            className={`preset-btn ${activeView === 'ddl' ? 'active' : ''}`}
            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={() => setActiveView('ddl')}
          >
            <Code2 size={15} />
            <span>SQL Schema (DDL)</span>
          </button>
          <button 
            className="icon-button" 
            onClick={fetchSchema}
            title="Refresh Schema"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Database Engine Status Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '0.75rem 1.25rem',
        fontSize: '0.8rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} style={{ color: 'var(--emerald-500)' }} />
          <span>Engine: <strong>{schemaData.databaseEngine}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={14} style={{ color: 'var(--emerald-500)' }} />
          <span>Journal Mode: <strong>{schemaData.journalMode}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={14} style={{ color: 'var(--sky-500)' }} />
          <span>Foreign Keys: <strong>Enforced (ON)</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
          <Layers size={14} style={{ color: 'var(--amber-500)' }} />
          <span>Total Tables: <strong>4</strong></span>
        </div>
      </div>

      {/* =========================================================================
          VIEW 1: INTERACTIVE VISUAL ERD & RELATIONSHIPS
          ========================================================================= */}
      {activeView === 'erd' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Relationships Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(168, 85, 247, 0.08))',
            border: '1.5px solid rgba(99, 102, 241, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem', fontWeight: 700, color: '#c7d2fe' }}>
              <Link2 size={18} />
              <span>Entity-Relationship Foreign Key Connections:</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1rem' }}>
              {relationships.map((rel) => (
                <div 
                  key={rel.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span className="code-pill" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: '0.8rem' }}>
                      {rel.fromTable}.{rel.fromColumn}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--amber-500)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>
                      {rel.cardinality} FK
                    </span>
                    <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="code-pill" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', fontSize: '0.8rem' }}>
                      {rel.toTable}.{rel.toColumn} (PK)
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {rel.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Schema Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            alignItems: 'start'
          }}>
            {Object.entries(tables).map(([name, table]) => {
              const hasFK = table.foreignKeys && table.foreignKeys.length > 0;
              const isReferenced = relationships.some(r => r.toTable === name);

              return (
                <div 
                  key={name}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: 'var(--bg-tertiary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Table size={18} style={{ color: name === 'loans' ? 'var(--primary-500)' : name === 'books' ? 'var(--type-fiction)' : name === 'borrowers' ? 'var(--type-nonfiction)' : 'var(--amber-500)' }} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}>{table.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{table.rowCount} records stored</div>
                      </div>
                    </div>
                    {hasFK && (
                      <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', fontSize: '0.68rem' }}>
                        {table.foreignKeys.length} Foreign Keys
                      </span>
                    )}
                    {isReferenced && !hasFK && (
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7', fontSize: '0.68rem' }}>
                        Parent Table
                      </span>
                    )}
                  </div>

                  {/* Columns List */}
                  <div style={{ padding: '0.5rem 0' }}>
                    {table.columns.map((col) => {
                      const fkRelation = table.foreignKeys?.find(fk => fk.fromColumn === col.name);

                      return (
                        <div 
                          key={col.name}
                          style={{
                            padding: '8px 1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                            background: col.isPrimary ? 'rgba(245, 158, 11, 0.05)' : fkRelation ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                            fontSize: '0.82rem'
                          }}
                        >
                          {/* Left: Column Name & Key Badges */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {col.isPrimary && (
                              <span 
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  background: 'rgba(245, 158, 11, 0.2)',
                                  color: 'var(--amber-500)',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(245, 158, 11, 0.4)'
                                }}
                                title="Primary Key"
                              >
                                PK
                              </span>
                            )}

                            {fkRelation && (
                              <span 
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  background: 'rgba(99, 102, 241, 0.25)',
                                  color: '#a5b4fc',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  border: '1px solid rgba(99, 102, 241, 0.4)'
                                }}
                                title={`Foreign Key referencing ${fkRelation.toTable}.${fkRelation.toColumn}`}
                              >
                                FK ➔ {fkRelation.toTable}
                              </span>
                            )}

                            <span style={{ 
                              fontWeight: col.isPrimary || fkRelation ? 700 : 500,
                              fontFamily: 'var(--font-mono)',
                              color: col.isPrimary ? '#fbbf24' : fkRelation ? '#c7d2fe' : 'var(--text-primary)'
                            }}>
                              {col.name}
                            </span>
                          </div>

                          {/* Right: Type & Constraints */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {col.type || 'TEXT'}
                            </span>
                            {col.isNotNull && (
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '1px 4px', borderRadius: '3px' }}>
                                NOT NULL
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Indexes footer */}
                  {table.indexes && table.indexes.length > 0 && (
                    <div style={{
                      padding: '8px 1.25rem',
                      background: 'var(--bg-tertiary)',
                      borderTop: '1px solid var(--border-subtle)',
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px'
                    }}>
                      <span style={{ fontWeight: 600 }}>Indexes:</span>
                      {table.indexes.map(idx => (
                        <span key={idx.name} className="code-pill" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                          {idx.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: LIVE DATA BROWSER
          ========================================================================= */}
      {activeView === 'browser' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Table Selector Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Select Table:</span>
            {Object.keys(tables).map((t) => (
              <button 
                key={t}
                className={`preset-btn ${selectedTable === t ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '0.84rem' }}
                onClick={() => setSelectedTable(t)}
              >
                <span>{t}</span>
                <span className="code-pill" style={{ marginLeft: '6px', fontSize: '0.68rem' }}>
                  {tables[t].rowCount} rows
                </span>
              </button>
            ))}
          </div>

          {/* Live Records Table */}
          <div className="table-card" style={{ overflowX: 'auto' }}>
            {tableLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading table records...
              </div>
            ) : tableData && tableData.rows ? (
              <table className="data-table">
                <thead>
                  <tr>
                    {tableData.columns.map((col) => (
                      <th key={col.name}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {col.isPrimary && <span style={{ color: 'var(--amber-500)' }}>★</span>}
                          <span>{col.name}</span>
                          <span style={{ fontSize: '0.65rem', opacity: 0.6, fontWeight: 400 }}>({col.type})</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableData.rows.length === 0 ? (
                    <tr>
                      <td colSpan={tableData.columns.length} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No records stored in table "{selectedTable}".
                      </td>
                    </tr>
                  ) : (
                    tableData.rows.map((row, idx) => (
                      <tr key={idx}>
                        {tableData.columns.map((col) => {
                          const val = row[col.name];
                          return (
                            <td key={col.name}>
                              {val === null || val === undefined ? (
                                <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.75rem' }}>NULL</span>
                              ) : typeof val === 'object' ? (
                                <code style={{ fontSize: '0.72rem' }}>{JSON.stringify(val)}</code>
                              ) : col.isPrimary ? (
                                <span className="code-pill" style={{ fontWeight: 700 }}>{String(val)}</span>
                              ) : (
                                <span style={{ fontFamily: col.type === 'INTEGER' ? 'var(--font-mono)' : 'inherit', fontSize: '0.82rem' }}>
                                  {String(val)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: SQL DDL SCHEMA DEFINITIONS
          ========================================================================= */}
      {activeView === 'ddl' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {Object.entries(tables).map(([name, table]) => (
            <div 
              key={name}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Code2 size={16} style={{ color: 'var(--primary-500)' }} />
                  <span>DDL for Table: <code style={{ color: '#a5b4fc' }}>{name}</code></span>
                </div>
                <span className="badge badge-active">{table.rowCount} rows</span>
              </div>
              <pre style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                color: '#e2e8f0',
                overflowX: 'auto',
                lineHeight: 1.5
              }}>
                {table.ddl || 'DDL definition generated from SQLite master'}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
