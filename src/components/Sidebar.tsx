import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';

export function Sidebar() {
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showImportExport, setShowImportExport] = useState<string | null>(null);

  const {
    currentView,
    setCurrentView,
    playlists,
    favorites,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    exportPlaylist,
    importPlaylist,
    isSidebarOpen,
    toggleSidebar
  } = usePlayerStore();

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const handleExportPlaylist = (id: string) => {
    const data = exportPlaylist(id);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `playlist-${id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowImportExport(null);
  };

  const handleImportPlaylist = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          try {
            importPlaylist(result);
            alert('Playlist imported successfully!');
          } catch {
            alert('Failed to import playlist. Please check the file format.');
          }
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
    setShowImportExport(null);
  };

  const handleDeletePlaylist = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deletePlaylist(id);
    }
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}
      
      <aside className={`sidebar ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img 
              src="/Favicon.png" 
              alt="Notify Music Player Logo" 
              width="32" 
              height="32"
              className="sidebar-logo-icon"
            />
            <h2 className="sidebar-title" style={{ color: '#ffffff !important' }}>Notify Music Player</h2>
          </div>
          <button
            onClick={toggleSidebar}
            className="btn btn-ghost btn-icon sidebar-toggle"
            aria-label="Toggle sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18"/>
              <path d="M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul className="sidebar-nav-list">
            <li>
              <button
                onClick={() => setCurrentView('search')}
                className={`sidebar-nav-item ${currentView === 'search' ? 'sidebar-nav-item-active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
                Search
              </button>
            </li>
            
            <li>
              <button
                onClick={() => setCurrentView('favorites')}
                className={`sidebar-nav-item ${currentView === 'favorites' ? 'sidebar-nav-item-active' : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill={currentView === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                Favorites
                {favorites.length > 0 && (
                  <span className="sidebar-badge">{favorites.length}</span>
                )}
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h3 className="sidebar-section-title">Playlists</h3>
            <button
              onClick={() => setShowCreatePlaylist(true)}
              className="btn btn-ghost btn-icon btn-sm"
              aria-label="Create playlist"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>

          {showCreatePlaylist && (
            <form onSubmit={handleCreatePlaylist} className="sidebar-create-form">
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Playlist name"
                className="input input-sm"
                autoFocus
              />
              <div className="sidebar-form-actions">
                <button type="submit" className="btn btn-primary btn-sm">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreatePlaylist(false);
                    setNewPlaylistName('');
                  }}
                  className="btn btn-ghost btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="sidebar-playlists">
            {playlists.length === 0 ? (
              <p className="sidebar-empty">No playlists yet</p>
            ) : (
              <ul className="sidebar-playlist-list">
                {playlists.map((playlist) => (
                  <li key={playlist.id} className="sidebar-playlist-item">
                    <button
                      onClick={() => setCurrentView('playlists')}
                      className="sidebar-playlist-button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="9" y1="9" x2="15" y2="9" />
                        <line x1="9" y1="13" x2="15" y2="13" />
                        <line x1="9" y1="17" x2="13" y2="17" />
                      </svg>
                      <span className="truncate">{playlist.name}</span>
                      {playlist.tracks.length > 0 && (
                        <span className="sidebar-badge">{playlist.tracks.length}</span>
                      )}
                    </button>
                    
                    <div className="sidebar-playlist-actions">
                      <button
                        onClick={() => setShowImportExport(showImportExport === playlist.id ? null : playlist.id)}
                        className="btn btn-ghost btn-icon btn-sm"
                        aria-label="More options"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>

                      {showImportExport === playlist.id && (
                        <div className="sidebar-dropdown">
                          <button
                            onClick={() => {
                              const newName = prompt('Enter new name:', playlist.name);
                              if (newName && newName.trim() !== playlist.name) {
                                renamePlaylist(playlist.id, newName.trim());
                              }
                              setShowImportExport(null);
                            }}
                            className="sidebar-dropdown-item"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleExportPlaylist(playlist.id)}
                            className="sidebar-dropdown-item"
                          >
                            Export
                          </button>
                          <button
                            onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                            className="sidebar-dropdown-item sidebar-dropdown-item-danger"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sidebar-import">
            <label htmlFor="import-playlist" className="btn btn-secondary btn-sm w-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              Import Playlist
            </label>
            <input
              id="import-playlist"
              type="file"
              accept=".json"
              onChange={handleImportPlaylist}
              className="visually-hidden"
            />
          </div>
        </div>

        <div className="sidebar-footer">
          <p className="sidebar-attribution">
            Music provided by{' '}
            <a 
              href="https://www.jamendo.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="sidebar-link"
            >
              <span style={{ color: '#ffffff !important' }}>Jamendo</span>
            </a>
            <br />
            <span className="text-muted">(Creative Commons)</span>
          </p>
        </div>
      </aside>
    </>
  );
}
