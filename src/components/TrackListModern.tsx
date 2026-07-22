import { useState, useEffect, useRef } from 'react';
import type { Track } from '../types/types';
import { usePlayerStore } from '../store/playerStore';
import { formatDuration, getArtistUrl } from '../services/musicApi';

interface TrackListProps {
  tracks: Track[];
  title?: string;
  showAddToPlaylist?: boolean;
  isLoading?: boolean;
  error?: string | null;
  playlistId?: string;
}

export function TrackListModern({ 
  tracks, 
  title, 
  showAddToPlaylist = true, 
  isLoading = false, 
  error = null,
  playlistId 
}: TrackListProps) {
  const [showPlaylistMenu, setShowPlaylistMenu] = useState<string | null>(null);
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [removingFromPlaylist, setRemovingFromPlaylist] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { 
    playTrack, 
    currentTrack, 
    isPlaying,
    playlists,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    createPlaylist,
    addToFavorites,
    removeFromFavorites,
    favorites
  } = usePlayerStore();

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPlaylistMenu(null);
        setShowCreatePlaylist(false);
      }
    };

    if (showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPlaylistMenu]);

  const handlePlayTrack = (track: Track, index: number) => {
    playTrack(track, tracks, index);
  };

  const handleAddToPlaylist = async (playlistId: string, track: Track) => {
    setAddingToPlaylist(playlistId);
    addTrackToPlaylist(playlistId, track);
    
    
    setTimeout(() => {
      setAddingToPlaylist(null);
      setShowPlaylistMenu(null);
    }, 500);
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const handleRemoveFromPlaylist = async (track: Track) => {
    if (playlistId) {
      const playlist = playlists.find(p => p.id === playlistId);
      const confirmMessage = `Remove "${track.name}" from "${playlist?.name}" playlist?`;
      
      if (window.confirm(confirmMessage)) {
        setRemovingFromPlaylist(track.id);
        removeTrackFromPlaylist(playlistId, track.id);
        
       
        setTimeout(() => {
          setRemovingFromPlaylist(null);
        }, 300);
      }
    }
  };

  const isTrackInPlaylist = (track: Track, playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    return playlist?.tracks.some(t => t.id === track.id) || false;
  };

  const handleToggleFavorite = (track: Track) => {
    const isFavorite = favorites.some(f => f.id === track.id);
    if (isFavorite) {
      removeFromFavorites(track.id);
    } else {
      addToFavorites(track);
    }
  };

  const isCurrentTrack = (track: Track) => currentTrack?.id === track.id;
  const isFavorite = (track: Track) => favorites.some(f => f.id === track.id);

  if (isLoading) {
    return (
      <div className="modern-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading tracks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-error">
        <h3 className="error-title">🎵 Music Temporarily Unavailable</h3>
        <p className="error-message">{error}</p>
        <button 
          className="modern-button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="modern-empty">
        <div className="empty-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="1" r="1" />
            <circle cx="12" cy="23" r="1" />
            <circle cx="20" cy="12" r="1" />
            <circle cx="4" cy="12" r="1" />
          </svg>
        </div>
        <h3 className="empty-title">No tracks found</h3>
        <p className="empty-description">Try searching for something else or check out our trending tracks!</p>
        <button 
          className="modern-button"
          onClick={() => {
            const { setCurrentView } = usePlayerStore.getState();
            setCurrentView('search');
          }}
        >
          Browse Trending
        </button>
      </div>
    );
  }

  return (
    <div className="modern-track-list" style={{ 
      width: '100%', 
      margin: '0', 
      padding: '0 2rem' 
    }}>
      {title && <h2 className="track-list-title-modern">{title}</h2>}
      
      <div 
        className={`track-list-container-modern ${hoveredTrack ? 'has-hovered-track' : ''}`}
        onMouseLeave={() => setHoveredTrack(null)}
      >
        {tracks.map((track, index) => (
          <div 
            key={track.id} 
            className={`track-item-modern ${isCurrentTrack(track) ? 'active' : ''} ${hoveredTrack === track.id ? 'hovered' : ''} ${hoveredTrack && hoveredTrack !== track.id ? 'blurred' : ''} ${removingFromPlaylist === track.id ? 'removing' : ''}`}
            onMouseEnter={() => setHoveredTrack(track.id)}
            style={{
              opacity: removingFromPlaylist === track.id ? 0.5 : 1,
              transform: removingFromPlaylist === track.id ? 'translateX(-10px) scale(0.98)' : 'translateX(0) scale(1)',
              transition: 'all 0.3s ease',
              pointerEvents: removingFromPlaylist === track.id ? 'none' : 'auto'
            }}
          >
            <div className="track-artwork-modern">
              <img 
                src={track.image || track.album_image} 
                alt={`${track.name} by ${track.artist_name}`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-album.svg';
                }}
              />
              <div className="play-overlay-modern">
                <button
                  onClick={() => handlePlayTrack(track, index)}
                  className="play-button-modern"
                  aria-label={isCurrentTrack(track) && isPlaying ? 'Currently playing' : 'Play track'}
                >
                  {isCurrentTrack(track) && isPlaying ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="2"/>
                      <rect x="14" y="4" width="4" height="16" rx="2"/>
                    </svg>
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="8,5 19,12 8,19" rx="1"/>
                    </svg>
                  )}
                </button>
              </div>
              
              {isCurrentTrack(track) && isPlaying && (
                <div className="sound-waves">
                  <div className="wave wave-1"></div>
                  <div className="wave wave-2"></div>
                  <div className="wave wave-3"></div>
                  <div className="wave wave-4"></div>
                </div>
              )}
            </div>

            <div className="track-info-modern">
              <h4 className="track-title-modern">{track.name}</h4>
              <p className="track-artist-modern">
                <a 
                  href={getArtistUrl(track.artist_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="artist-link-modern"
                >
                  {track.artist_name}
                </a>
              </p>
              {track.album_name && (
                <p className="track-album-modern">{track.album_name}</p>
              )}
              <div className="track-metadata-modern">
                <span className="track-duration-modern">{formatDuration(track.duration)}</span>
                {track.musicinfo?.tags?.genres && track.musicinfo.tags.genres.length > 0 && (
                  <span className="track-genre-modern">
                    {track.musicinfo.tags.genres[0]}
                  </span>
                )}
              </div>
            </div>

            <div className="track-actions-modern">
              <button
                onClick={() => handleToggleFavorite(track)}
                className={`icon-button ${isFavorite(track) ? 'active' : ''}`}
                aria-label={isFavorite(track) ? 'Remove from favorites' : 'Add to favorites'}
                style={{
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  transform: isFavorite(track) ? 'scale(1.1)' : 'scale(1)'
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill={isFavorite(track) ? '#e22134' : 'none'} 
                  stroke={isFavorite(track) ? '#e22134' : 'currentColor'} 
                  strokeWidth="2"
                  style={{
                    filter: isFavorite(track) ? 'drop-shadow(0 0 8px rgba(226, 33, 52, 0.6))' : 'none'
                  }}
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>

              {playlistId && (
                <button
                  onClick={() => handleRemoveFromPlaylist(track)}
                  className="icon-button remove-button"
                  aria-label="Remove from playlist"
                  disabled={removingFromPlaylist === track.id}
                  style={{
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    background: removingFromPlaylist === track.id 
                      ? 'rgba(226, 33, 52, 0.2)' 
                      : 'rgba(255, 255, 255, 0.05)',
                    borderColor: removingFromPlaylist === track.id 
                      ? 'rgba(226, 33, 52, 0.5)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    color: removingFromPlaylist === track.id 
                      ? '#e22134' 
                      : '#ff6b6b',
                    cursor: removingFromPlaylist === track.id ? 'not-allowed' : 'pointer',
                    opacity: removingFromPlaylist === track.id ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (removingFromPlaylist !== track.id) {
                      e.currentTarget.style.background = 'rgba(226, 33, 52, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(226, 33, 52, 0.4)';
                      e.currentTarget.style.color = '#e22134';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (removingFromPlaylist !== track.id) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#ff6b6b';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {removingFromPlaylist === track.id ? (
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                      style={{ animation: 'spin 1s linear infinite' }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                  ) : (
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5"
                      style={{
                        filter: 'drop-shadow(0 0 6px rgba(255, 107, 107, 0.4))'
                      }}
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  )}
                </button>
              )}

              {showAddToPlaylist && (
                <div className="playlist-menu-container-modern">
                  <button
                    onClick={() => setShowPlaylistMenu(showPlaylistMenu === track.id ? null : track.id)}
                    className="icon-button"
                    aria-label="Add to playlist"
                    style={{
                      position: 'relative',
                      background: showPlaylistMenu === track.id ? 'rgba(29, 185, 84, 0.2)' : 'transparent',
                      color: showPlaylistMenu === track.id ? '#1ed760' : 'currentColor',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <svg 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      style={{
                        transform: showPlaylistMenu === track.id ? 'rotate(45deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                      }}
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              )}


            </div>
          </div>
        ))}
      </div>
      
      { }
      {showPlaylistMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            pointerEvents: 'auto'
          }}
        >
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px) saturate(180%)',
              cursor: 'pointer',
              animation: 'fadeIn 0.3s ease-out'
            }}
            onClick={() => {
              setShowPlaylistMenu(null);
              setShowCreatePlaylist(false);
              setNewPlaylistName('');
            }}
          />
          
          { }
          <div 
            ref={menuRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(135deg, rgba(20, 20, 20, 0.98) 0%, rgba(10, 10, 10, 0.98) 100%)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(29, 185, 84, 0.4)',
              borderRadius: '16px',
              boxShadow: '0 16px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              width: '85%',
              maxWidth: '400px',
              maxHeight: '75vh',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(32, 32, 32, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 600,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flex: '1',
                paddingLeft: '8px',
                paddingRight: '40px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(64, 64, 64, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
                Add to Playlist
              </h4>
              <button
                onClick={() => {
                  setShowPlaylistMenu(null);
                  setShowCreatePlaylist(false);
                  setNewPlaylistName('');
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#b3b3b3',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  width: '28px',
                  height: '28px',
                  zIndex: 2
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#b3b3b3';
                  e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div style={{ 
              padding: '12px 16px 16px',
              maxHeight: 'calc(75vh - 80px)',
              overflowY: 'hidden',
              flex: 1,
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {playlists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                  <div 
                    style={{
                      width: '80px',
                      height: '80px',
                      background: 'rgba(64, 64, 64, 0.8)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(29, 185, 84, 0.25), rgba(29, 185, 84, 0.12))';
                      e.currentTarget.style.borderColor = 'rgba(29, 185, 84, 0.4)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(64, 64, 64, 0.8)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2"
                      style={{ transition: 'stroke 0.3s ease' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.stroke = '#1db954';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.stroke = '#ffffff';
                      }}
                    >
                      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                    </svg>
                  </div>
                  <h5 style={{
                    margin: '0 0 8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#ffffff'
                  }}>
                    No playlists yet
                  </h5>
                  <p style={{
                    margin: '0 0 16px',
                    fontSize: '13px',
                    color: '#b3b3b3',
                    lineHeight: 1.6
                  }}>
                    Create your first playlist to organize your favorite tracks and build your music collection
                  </p>
                  <button 
                    onClick={() => setShowCreatePlaylist(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(64, 64, 64, 0.8)',
                      color: '#ffffff',
                      border: '2px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(80, 80, 80, 0.9)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(64, 64, 64, 0.8)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.background = 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
                      e.currentTarget.style.color = '#000000';
                      e.currentTarget.style.borderColor = '#1ed760';
                      e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.background = 'rgba(80, 80, 80, 0.9)';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    CREATE NEW PLAYLIST
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{
                    marginBottom: '12px'
                  }}>
                    <h6 style={{
                      margin: '0 0 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#1ed760',
                      textTransform: 'uppercase',
                      letterSpacing: '1.2px'
                    }}>
                      YOUR PLAYLISTS ({playlists.length})
                    </h6>
                    <div style={{
                      maxHeight: '200px',
                      overflowY: 'hidden',
                      paddingRight: '0px'
                    }}>
                      {playlists.map(playlist => {
                        const isInPlaylist = isTrackInPlaylist(tracks.find(t => showPlaylistMenu === t.id)!, playlist.id);
                        const isAdding = addingToPlaylist === playlist.id;
                        
                        return (
                          <button
                            key={playlist.id}
                            onClick={() => !isInPlaylist && !isAdding && handleAddToPlaylist(playlist.id, tracks.find(t => showPlaylistMenu === t.id)!)}
                            disabled={isInPlaylist || isAdding}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              width: '100%',
                              padding: '6px 8px',
                              background: isInPlaylist 
                                ? 'linear-gradient(135deg, rgba(29, 185, 84, 0.25), rgba(29, 185, 84, 0.15))' 
                                : isAdding 
                                  ? 'linear-gradient(135deg, rgba(29, 185, 84, 0.35), rgba(29, 185, 84, 0.2))' 
                                  : 'rgba(255, 255, 255, 0.04)',
                              border: isInPlaylist || isAdding 
                                ? '1px solid rgba(29, 185, 84, 0.5)' 
                                : '1px solid rgba(255, 255, 255, 0.12)',
                              borderRadius: '8px',
                              color: isInPlaylist || isAdding ? '#1ed760' : '#ffffff',
                              fontSize: '14px',
                              cursor: isInPlaylist || isAdding ? 'default' : 'pointer',
                              transition: 'all 0.3s ease',
                              marginBottom: '4px',
                              position: 'relative',
                              overflow: 'hidden',
                              textAlign: 'left'
                            }}
                            onMouseEnter={(e) => {
                              if (!isInPlaylist && !isAdding) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.color = '#ffffff';
                                e.currentTarget.style.transform = 'translateX(0px)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isInPlaylist && !isAdding) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                                e.currentTarget.style.color = '#ffffff';
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                          >
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '18px',
                              height: '18px',
                              flexShrink: 0
                            }}>
                              {isAdding ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                </svg>
                              ) : isInPlaylist ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20,6 9,17 4,12"/>
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                                </svg>
                              )}
                            </div>
                            <div style={{ 
                              flex: 1, 
                              textAlign: 'left',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              minWidth: 0
                            }}>
                              <div style={{ 
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '12px'
                              }}>{playlist.name}</div>
                              <div style={{ 
                                fontSize: '10px', 
                                opacity: 0.7,
                                marginTop: '1px'
                              }}>
                                {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                            {isInPlaylist && (
                              <span style={{ 
                                fontSize: '10px', 
                                opacity: 0.9,
                                fontWeight: 600,
                                background: 'rgba(29, 185, 84, 0.25)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                flexShrink: 0,
                                marginLeft: '4px'
                              }}>
                                Added ✓
                              </span>
                            )}
                            {isAdding && (
                              <span style={{ 
                                fontSize: '0.85rem', 
                                opacity: 0.9,
                                fontWeight: 600,
                                background: 'rgba(29, 185, 84, 0.35)',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                flexShrink: 0,
                                marginLeft: '10px'
                              }}>
                                Adding...
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div style={{
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingTop: '12px',
                    position: 'sticky',
                    bottom: 0,
                    background: 'linear-gradient(180deg, rgba(10, 10, 10, 0) 0%, rgba(10, 10, 10, 0.95) 25%, rgba(10, 10, 10, 1) 100%)',
                    marginTop: '8px',
                    marginBottom: '-16px',
                    marginLeft: '-16px',
                    marginRight: '-20px',
                    padding: '16px 20px 12px'
                  }}>
                    <button 
                      onClick={() => setShowCreatePlaylist(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(29, 185, 84, 0.12)',
                        color: '#1ed760',
                        border: '1px solid rgba(29, 185, 84, 0.4)',
                        borderRadius: '16px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.25)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(29, 185, 84, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(29, 185, 84, 0.6)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(29, 185, 84, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(29, 185, 84, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(29, 185, 84, 0.4)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.25)';
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Create New Playlist
                    </button>
                  </div>
                </div>
              )}
              
              {showCreatePlaylist && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(15, 15, 15, 0.98), rgba(8, 8, 8, 0.98))',
                  padding: '16px',
                  zIndex: 10,
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px'
                  }}>
                    <h5 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        background: 'linear-gradient(135deg, #1db954, #1ed760)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 6px 20px rgba(29, 185, 84, 0.5)'
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </div>
                      Create New Playlist
                    </h5>
                    <button 
                      onClick={() => {
                        setShowCreatePlaylist(false);
                        setNewPlaylistName('');
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.12)',
                        border: 'none',
                        color: '#b3b3b3',
                        cursor: 'pointer',
                        padding: '6px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s ease',
                        width: '24px',
                        height: '24px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#b3b3b3';
                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}>
                    <p style={{
                      fontSize: '14px',
                      color: '#b3b3b3',
                      lineHeight: 1.6,
                      marginBottom: '16px'
                    }}>
                      Create a new playlist to organize your favorite tracks. Once created, you can add this track and more to your collection.
                    </p>
                  
                    <input
                      type="text"
                      placeholder="Enter playlist name"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreatePlaylist();
                        } else if (e.key === 'Escape') {
                          setShowCreatePlaylist(false);
                          setNewPlaylistName('');
                        }
                      }}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '8px',
                        color: '#ffffff',
                        fontSize: '14px',
                        marginBottom: '16px',
                        transition: 'all 0.3s ease',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#1db954';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.boxShadow = '0 0 0 4px rgba(29, 185, 84, 0.25)';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    justifyContent: 'flex-end',
                    marginTop: '8px'
                  }}>
                    <button 
                      onClick={() => {
                        setShowCreatePlaylist(false);
                        setNewPlaylistName('');
                      }}
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: '#b3b3b3',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.color = '#b3b3b3';
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                      style={{
                        padding: '8px 12px',
                        background: newPlaylistName.trim() 
                          ? 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)' 
                          : 'rgba(29, 185, 84, 0.3)',
                        color: newPlaylistName.trim() ? '#000' : 'rgba(0, 0, 0, 0.5)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease',
                        boxShadow: newPlaylistName.trim() 
                          ? '0 4px 15px rgba(29, 185, 84, 0.5)' 
                          : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (newPlaylistName.trim()) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #1ed760 0%, #22c55e 100%)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(29, 185, 84, 0.6)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newPlaylistName.trim()) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(29, 185, 84, 0.5)';
                        }
                      }}
                    >
                      Create Playlist
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
