import { useEffect, useState } from 'react';
import { SearchBar } from './components/SearchBar';
import { TrackListModern } from './components/TrackListModern';
import { PlayerControls } from './components/PlayerControls';
import { Sidebar } from './components/Sidebar';
import { usePlayerStore } from './store/playerStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePlayer } from './hooks/usePlayer';
import { JamendoAPI } from './services/jamendoAPI';

import './styles/variables.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/player.css';
import './styles/animations.css';

function App() {
  const [showPlaylistActions, setShowPlaylistActions] = useState<string | null>(null);
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [editPlaylistName, setEditPlaylistName] = useState('');

  const {
    currentView,
    isSidebarOpen,
    results,
    isLoading,
    error,
    trending,
    playlists,
    favorites,
    clearFavorites,
    setTrending,
    setLoading,
    setError,
    toggleSidebar,
    deletePlaylist,
    renamePlaylist
  } = usePlayerStore();

  const {
    togglePlayPause,
    changeVolume,
    volume
  } = usePlayer();

  useKeyboardShortcuts({
    ' ': togglePlayPause,
    'ArrowLeft': () => {
    },
    'ArrowRight': () => {
    },
    'ArrowUp': () => changeVolume(Math.min(100, volume + 5)),
    'ArrowDown': () => changeVolume(Math.max(0, volume - 5))
  });

  const handleEditPlaylist = (playlistId: string, currentName: string) => {
    setEditingPlaylist(playlistId);
    setEditPlaylistName(currentName);
    setShowPlaylistActions(null);
  };

  const handleSavePlaylistName = () => {
    if (editingPlaylist && editPlaylistName.trim()) {
      renamePlaylist(editingPlaylist, editPlaylistName.trim());
      setEditingPlaylist(null);
      setEditPlaylistName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingPlaylist(null);
    setEditPlaylistName('');
  };

  const handleDeletePlaylist = (playlistId: string, playlistName: string) => {
    if (window.confirm(`Are you sure you want to delete "${playlistName}"? This action cannot be undone.`)) {
      deletePlaylist(playlistId);
    }
    setShowPlaylistActions(null);
  };

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showPlaylistActions && !(event.target as Element).closest('.playlist-card-actions')) {
        setShowPlaylistActions(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPlaylistActions]);

  useEffect(() => {
    const loadTrending = async () => {
      if (trending.length === 0) {
        setLoading(true);
        setError(null);
        try {
          console.log('🎵 Loading trending rap tracks...');
          const tracks = await JamendoAPI.getTrendingTracks(25);
          setTrending(tracks);
          console.log('✅ Loaded trending tracks:', tracks.length);
        } catch (error) {
          console.error('❌ Failed to load trending tracks:', error);
          const errorMsg = error instanceof Error ? error.message : 
            '🎪 Trending tracks are temporarily unavailable. Try searching for specific genres like rap, electronic, or jazz.';
          setError(errorMsg);
        } finally {
          setLoading(false);
        }
      }
    };

    loadTrending();
  }, [trending.length, setTrending, setLoading, setError]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.style.setProperty('--bg', '#000000', 'important');
    document.documentElement.style.setProperty('--text', '#ffffff', 'important');
    document.body.style.backgroundColor = '#000000';
    document.body.style.color = '#ffffff';
  }, []);

  useEffect(() => {
    if (window.innerWidth <= 768) {
      const sidebar = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay') as HTMLElement;
      if (sidebar && overlay) {
        sidebar.classList.remove('sidebar-open');
        overlay.style.display = 'none';
      }
    }
  }, [currentView]);

  const renderMainContent = () => {
    switch (currentView) {
      case 'search':
        return (
          <div style={{ 
            maxWidth: '100%',
            width: '100%',
            margin: '0',
            padding: '0',
            position: 'relative',
            zIndex: 2,
          }}>
            <SearchBar />
            {results.length > 0 ? (
              <div style={{ marginTop: '0' }}>
                <TrackListModern
                  tracks={results}
                  title="Search Results"
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            ) : (
              <div style={{ marginTop: '0' }}>
                <TrackListModern
                  tracks={trending}
                  title="🎤 Trending Rap & Hip-Hop"
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            )}
          </div>
        );

      case 'favorites':
        return (
          <div style={{ 
            maxWidth: '100%',
            width: '100%',
            margin: '0',
            padding: '0',
            position: 'relative',
            zIndex: 2,
          }}>
            <div className="page-header" style={{ 
              margin: '0', 
              padding: '2rem 2rem 0 2rem', 
              marginBottom: '2rem' 
            }}>
              <div className="page-header-content">
                <div>
                  <h1 className="page-title">Your Favorites</h1>
                  <p className="page-subtitle">
                    {favorites.length} {favorites.length === 1 ? 'track' : 'tracks'}
                  </p>
                </div>
                {favorites.length > 0 && (
                  <button
                    className="clear-favorites-btn"
                    onClick={() => clearFavorites()}
                    title="Clear all favorites"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {favorites.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <h3>No favorites yet</h3>
                <p>Heart tracks to add them to your favorites</p>
              </div>
            ) : (
              <TrackListModern
                tracks={favorites}
                showAddToPlaylist={true}
              />
            )}
          </div>
        );

      case 'playlists':
        return (
          <div style={{ 
            maxWidth: '100%',
            width: '100%',
            margin: '0',
            padding: '0',
            position: 'relative',
            zIndex: 2,
          }}>
            <div className="page-header" style={{ 
              margin: '0', 
              padding: '2rem 2rem 0 2rem', 
              marginBottom: '2rem' 
            }}>
              <h1 className="page-title">Your Playlists</h1>
              <p className="page-subtitle">
                {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
              </p>
            </div>
            
            {playlists.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="13" y2="17" />
                </svg>
                <h3>No playlists yet</h3>
                <p>Create your first playlist to organize your music</p>
              </div>
            ) : (
              <div className="playlists-grid">
                {playlists.map((playlist) => (
                  <div key={playlist.id} className="playlist-card">
                    <div className="playlist-card-header">
                      <div className="playlist-card-info">
                        {editingPlaylist === playlist.id ? (
                          <div className="playlist-edit-form">
                            <input
                              type="text"
                              value={editPlaylistName}
                              onChange={(e) => setEditPlaylistName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSavePlaylistName();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              className="playlist-edit-input"
                              autoFocus
                            />
                            <div className="playlist-edit-actions">
                              <button
                                onClick={handleSavePlaylistName}
                                className="btn btn-primary btn-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="btn btn-ghost btn-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="playlist-card-title">{playlist.name}</h3>
                            <p className="playlist-card-subtitle">
                              {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                            </p>
                          </>
                        )}
                      </div>
                      
                      {editingPlaylist !== playlist.id && (
                        <div className="playlist-card-actions">
                          <button
                            onClick={() => setShowPlaylistActions(
                              showPlaylistActions === playlist.id ? null : playlist.id
                            )}
                            className="btn btn-ghost btn-icon btn-sm"
                            aria-label="More options"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="1" />
                              <circle cx="12" cy="5" r="1" />
                              <circle cx="12" cy="19" r="1" />
                            </svg>
                          </button>

                          {showPlaylistActions === playlist.id && (
                            <div className="playlist-actions-menu">
                              <button
                                onClick={() => handleEditPlaylist(playlist.id, playlist.name)}
                                className="playlist-action-item"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Edit Name
                              </button>
                              <button
                                onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                                className="playlist-action-item playlist-action-delete"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3,6 5,6 21,6"/>
                                  <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
                                  <line x1="10" y1="11" x2="10" y2="17"/>
                                  <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                                Delete Playlist
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {playlist.tracks.length > 0 && (
                      <div className="playlist-card-content">
                        <TrackListModern
                          tracks={playlist.tracks}
                          showAddToPlaylist={false}
                          playlistId={playlist.id}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="app">
      <Sidebar />
      
      <main className={`app-main ${isSidebarOpen ? 'app-main-with-sidebar' : 'app-main-full'}`}>
        <header className="app-header">
          <button
            onClick={toggleSidebar}
            className="btn btn-ghost btn-icon mobile-menu-toggle"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isSidebarOpen ? (
                <>
                  <path d="M18 6L6 18"/>
                  <path d="M6 6l12 12"/>
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
          
          <h1 className="app-title" style={{ color: '#ffffff !important' }}>Notify Music Player</h1>
          
          <div className="header-actions">
            <a
              href="https://github.com/Nishantnsut27"
              target="_blank"
              rel="noopener noreferrer"
              className="github-link"
              aria-label="Visit GitHub Profile"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </a>
          </div>
        </header>
        
        <div className="app-content">
          <div className="spotify-gradient-overlay"></div>
          {renderMainContent()}
        </div>
      </main>
      
      <PlayerControls />
    </div>
  );
}

export default App;
