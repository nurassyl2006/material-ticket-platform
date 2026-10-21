import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Search, Filter, Trash2, Edit3, 
  ExternalLink, Sparkles, Check, X, AlertTriangle, Layers
} from 'lucide-react';
import { api } from '../api';
import { playScanBeep } from '../utils/sound';

export default function BookCatalog({ onSelectBookForCirculation }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    barcode: '',
    isbn: '',
    title: '',
    author: '',
    genre: '',
    book_type: 'Fiction',
    total_copies: 1,
    published_year: new Date().getFullYear(),
    shelf_location: '',
    description: '',
    cover_url: ''
  });
  const [isbnLoading, setIsbnLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load books
  const loadBooks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedType !== 'All') params.book_type = selectedType;
      if (selectedGenre !== 'All') params.genre = selectedGenre;
      if (onlyAvailable) params.available_only = 'true';

      const res = await api.getBooks(params);
      setBooks(res.data || []);
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, [search, selectedType, selectedGenre, onlyAvailable]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingBook(null);
    // Suggest next barcode
    const nextNum = Math.floor(1000 + Math.random() * 9000);
    setFormData({
      barcode: `BK-${nextNum}`,
      isbn: '',
      title: '',
      author: '',
      genre: '',
      book_type: 'Fiction',
      total_copies: 2,
      published_year: 2024,
      shelf_location: 'Aisle 1',
      description: '',
      cover_url: ''
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (book) => {
    setEditingBook(book);
    setFormData({
      barcode: book.barcode,
      isbn: book.isbn || '',
      title: book.title,
      author: book.author,
      genre: book.genre || '',
      book_type: book.book_type,
      total_copies: book.total_copies,
      published_year: book.published_year || '',
      shelf_location: book.shelf_location || '',
      description: book.description || '',
      cover_url: book.cover_url || ''
    });
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  // Online ISBN Auto-lookup
  const handleIsbnLookup = async () => {
    if (!formData.isbn) return;
    setIsbnLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.lookupIsbnOnline(formData.isbn);
      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        author: data.author || prev.author,
        genre: data.genre || prev.genre,
        published_year: data.published_year || prev.published_year,
        cover_url: data.cover_url || prev.cover_url
      }));
      playScanBeep();
    } catch (err) {
      setErrorMsg(err.message || 'Could not fetch metadata from Open Library');
    } finally {
      setIsbnLoading(false);
    }
  };

  // Save Book (Create or Update)
  const handleSubmitBook = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      if (editingBook) {
        await api.updateBook(editingBook.barcode, formData);
      } else {
        await api.createBook(formData);
      }
      setIsModalOpen(false);
      loadBooks();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save book');
    }
  };

  // Delete Book
  const handleDeleteBook = async (barcode, title) => {
    if (!confirm(`Are you sure you want to delete "${title}" (${barcode})?`)) return;
    try {
      await api.deleteBook(barcode);
      loadBooks();
    } catch (err) {
      alert(err.message || 'Failed to delete book');
    }
  };

  // Unique genres for filter dropdown
  const genres = Array.from(new Set(books.map(b => b.genre).filter(Boolean))).sort();

  return (
    <div className="data-view-container">
      {/* Header */}
      <div className="view-header">
        <div className="view-title-group">
          <h1>Book Catalog</h1>
          <p>Minimum required table 1: Barcode, ISBN, title, author, genre, book type (Fiction, Nonfiction, Textbooks)</p>
        </div>
        <button className="primary-button" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-group">
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="search-field" 
            placeholder="Search by Barcode, Title, Author, ISBN..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select 
          className="select-field"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="All">All Types (Fiction, Nonfiction, Textbooks)</option>
          <option value="Fiction">Fiction (14 days default)</option>
          <option value="Nonfiction">Nonfiction (21 days default)</option>
          <option value="Textbooks">Textbooks (120 days default)</option>
        </select>

        {genres.length > 0 && (
          <select 
            className="select-field"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="All">All Genres</option>
            {genres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            style={{ accentColor: 'var(--primary-500)' }}
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Data Table */}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Barcode</th>
              <th>Book Title & Author</th>
              <th>Book Type</th>
              <th>Genre</th>
              <th>Copies (Avail / Total)</th>
              <th>Location</th>
              <th>ISBN</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  Loading catalog records...
                </td>
              </tr>
            ) : books.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No books found matching search filters.
                </td>
              </tr>
            ) : (
              books.map((book) => (
                <tr key={book.barcode}>
                  <td>
                    <span className="code-pill">{book.barcode}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{book.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>by {book.author}</div>
                  </td>
                  <td>
                    <span className={`type-pill type-${book.book_type.toLowerCase()}`}>
                      {book.book_type}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {book.genre || '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 700, 
                      color: book.available_copies > 0 ? 'var(--emerald-500)' : 'var(--rose-500)' 
                    }}>
                      {book.available_copies} / {book.total_copies}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {book.shelf_location || 'General'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {book.isbn || '—'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      <button 
                        className="table-btn primary"
                        onClick={() => onSelectBookForCirculation && onSelectBookForCirculation(book)}
                        title="Checkout this book in Circulation Desk"
                      >
                        Loan
                      </button>
                      <button 
                        className="table-btn"
                        onClick={() => handleOpenEdit(book)}
                        title="Edit Book"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button 
                        className="table-btn danger"
                        onClick={() => handleDeleteBook(book.barcode, book.title)}
                        title="Delete Book"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Book Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingBook ? `Edit Book: ${editingBook.barcode}` : 'Add New Book to Collection'}
              </h2>
              <button className="icon-button" onClick={() => setIsModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitBook}>
              <div className="modal-body">
                {errorMsg && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--rose-bg)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fda4af',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertTriangle size={15} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Barcode & Book Type (Core DB Fields) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Barcode (Unique ID) *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. BK-1009"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      disabled={!!editingBook}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Book Type *</label>
                    <select 
                      className="form-input"
                      value={formData.book_type}
                      onChange={(e) => setFormData({ ...formData, book_type: e.target.value })}
                      required
                    >
                      <option value="Fiction">Fiction (14 days loan)</option>
                      <option value="Nonfiction">Nonfiction (21 days loan)</option>
                      <option value="Textbooks">Textbooks (120 days loan)</option>
                    </select>
                  </div>
                </div>

                {/* ISBN with online auto-lookup button */}
                <div className="form-group">
                  <label className="form-label">ISBN</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. 978-0451524935"
                      value={formData.isbn}
                      onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className="secondary-button"
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                      onClick={handleIsbnLookup}
                      disabled={!formData.isbn || isbnLoading}
                      title="Auto-fill title, author, and genre from Open Library API"
                    >
                      <Sparkles size={14} style={{ color: 'var(--amber-500)' }} />
                      <span>{isbnLoading ? 'Looking up...' : 'Auto-Fill'}</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div className="form-group">
                  <label className="form-label">Book Title *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="e.g. The Lord of the Rings"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Author & Genre (Core DB Fields) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Author *</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. J.R.R. Tolkien"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Genre (ganre)</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. High Fantasy, Physics"
                      value={formData.genre}
                      onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    />
                  </div>
                </div>

                {/* Copies & Shelf Location */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Total Copies</label>
                    <input 
                      type="number" 
                      min="1"
                      className="form-input"
                      value={formData.total_copies}
                      onChange={(e) => setFormData({ ...formData, total_copies: parseInt(e.target.value, 10) || 1 })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Shelf Location</label>
                    <input 
                      type="text" 
                      className="form-input"
                      placeholder="e.g. Row 4, Shelf B"
                      value={formData.shelf_location}
                      onChange={(e) => setFormData({ ...formData, shelf_location: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label className="form-label">Description / Summary</label>
                  <textarea 
                    className="form-input"
                    rows="2"
                    placeholder="Brief synopsis or curriculum grade level..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <Check size={16} />
                  <span>{editingBook ? 'Save Changes' : 'Create Book'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
