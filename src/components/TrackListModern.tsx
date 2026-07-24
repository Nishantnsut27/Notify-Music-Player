import { useState, useEffect, useRef } from 'react';
import type { Track } from '../types/types';
import { usePlayerStore } from '../store/playerStore';
import { useToastStore } from '../store/toastStore';
import { formatDuration, getArtistUrl } from '../services/musicApi';
import { ConfirmModal } from './ConfirmModal';
import { AudioVisualizer } from './AudioVisualizer';
import { SkeletonTrackList } from './Skeletons';
import { EmptySearchResults, EmptyState } from './EmptyState';
import { ErrorDisplay } from './ErrorDisplay';

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
  const [trackToRemove, setTrackToRemove] = useState<Track | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const addToast = useToastStore(state => state.addToast);
  
  const { 
    playTrack, 
    pauseTrack,
    setIsPlaying,
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

  const handlePlayTrack = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        pauseTrack();
      } else {
        setIsPlaying(true);
      }
    } else {
      playTrack(track, tracks, index);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowPlaylistMenu(null);
        setShowCreatePlaylist(false);
        setNewPlaylistName('');
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowPlaylistMenu(null);
        setShowCreatePlaylist(false);
        setNewPlaylistName('');
      }
    };

    if (showPlaylistMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showPlaylistMenu]);

  const handleAddToPlaylist = async (pId: string, track: Track) => {
    setAddingToPlaylist(pId);
    addTrackToPlaylist(pId, track);
    const targetPlaylist = playlists.find(p => p.id === pId);

    addToast({
      type: 'success',
      title: 'Added to Playlist',
      message: `"${track.name}" added to ${targetPlaylist?.name || 'playlist'}`,
    });
    
    setTimeout(() => {
      setAddingToPlaylist(null);
      setShowPlaylistMenu(null);
    }, 500);
  };

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      createPlaylist(newPlaylistName.trim());
      addToast({
        type: 'success',
        title: 'Playlist Created',
        message: `Created "${newPlaylistName.trim()}"`,
      });
      setNewPlaylistName('');
      setShowCreatePlaylist(false);
    }
  };

  const handleRemoveFromPlaylist = (track: Track) => {
    if (playlistId) {
      setTrackToRemove(track);
    }
  };

  const confirmRemoveTrack = () => {
    if (trackToRemove && playlistId) {
      const trackId = trackToRemove.id;
      const trackName = trackToRemove.name;
      setRemovingFromPlaylist(trackId);
      removeTrackFromPlaylist(playlistId, trackId);
      addToast({
        type: 'info',
        title: 'Removed from Playlist',
        message: `"${trackName}" removed`,
      });
      setTrackToRemove(null);
      setTimeout(() => {
        setRemovingFromPlaylist(null);
      }, 300);
    }
  };

  const isTrackInPlaylist = (track: Track, pId: string) => {
    const playlist = playlists.find(p => p.id === pId);
    return playlist?.tracks.some(t => t.id === track.id) || false;
  };

  const handleToggleFavorite = (track: Track) => {
    const isFav = favorites.some(f => f.id === track.id);
    if (isFav) {
      removeFromFavorites(track.id);
      addToast({
        type: 'info',
        title: 'Removed from Favorites',
        message: `"${track.name}" removed from favorites`,
      });
    } else {
      addToFavorites(track);
      addToast({
        type: 'success',
        title: 'Added to Favorites',
        message: `"${track.name}" saved to favorites`,
      });
    }
  };

  const isCurrentTrack = (track: Track) => currentTrack?.id === track.id;
  const isFavorite = (track: Track) => favorites.some(f => f.id === track.id);

  if (isLoading) {
    return (
      <div className="modern-track-list">
        {title && <h2 className="track-list-title-modern">{title}</h2>}
        <SkeletonTrackList count={8} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorDisplay
        title="Music Temporarily Unavailable"
        message={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (tracks.length === 0) {
    const isSearching = usePlayerStore.getState().query.length > 0;
    return (
      <div className="modern-track-list">
        {title && <h2 className="track-list-title-modern">{title}</h2>}
        {isSearching ? (
          <EmptySearchResults
            onClear={() => {
              const store = usePlayerStore.getState();
              store.clearResults();
            }}
          />
        ) : (
          <EmptyState
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v3m0 16v3M1 12h3m16 0h3" />
              </svg>
            }
            title="No songs available"
            description="Explore our trending tracks or search for your favorite artists and genres."
            actionText="Browse Trending"
            onAction={() => {
              const { setCurrentView } = usePlayerStore.getState();
              setCurrentView('search');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="modern-track-list">
      {title && <h2 className="track-list-title-modern">{title}</h2>}
      
      <div 
        className={`track-list-container-modern ${hoveredTrack ? 'has-hovered-track' : ''}`}
        onMouseLeave={() => setHoveredTrack(null)}
      >
        {tracks.map((track, index) => (
          <div 
            key={track.id} 
            className={`track-item-modern ${isCurrentTrack(track) ? 'active' : ''} ${hoveredTrack === track.id ? 'hovered' : ''} ${hoveredTrack && hoveredTrack !== track.id ? 'blurred' : ''} ${removingFromPlaylist === track.id ? 'removing' : ''}`}
            onClick={() => handlePlayTrack(track, index)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handlePlayTrack(track, index);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={`Play ${track.name} by ${track.artist_name}`}
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
              
              {isCurrentTrack(track) && (
                <div className="track-visualizer-overlay">
                  <AudioVisualizer isPlaying={isPlaying} size="medium" barCount={5} />
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
                  onClick={(e) => e.stopPropagation()}
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(track);
                }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromPlaylist(track);
                  }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPlaylistMenu(showPlaylistMenu === track.id ? null : track.id);
                    }}
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
          
          <div 
            ref={menuRef}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'linear-gradient(145deg, rgba(22, 22, 22, 0.98) 0%, rgba(12, 12, 12, 0.98) 100%)',
              backdropFilter: 'blur(30px) saturate(180%)',
              border: '1px solid rgba(29, 185, 84, 0.4)',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.08)',
              width: '90%',
              maxWidth: '420px',
              maxHeight: '80vh',
              overflow: 'hidden',
              animation: 'modalSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)',
              cursor: 'default',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'rgba(30, 30, 30, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h4 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: 700,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  background: 'linear-gradient(135deg, rgba(29, 185, 84, 0.2), rgba(29, 185, 84, 0.08))',
                  border: '1px solid rgba(29, 185, 84, 0.3)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1ed760'
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: '#b3b3b3',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  width: '32px',
                  height: '32px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#b3b3b3';
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div style={{ 
              padding: '16px 20px',
              overflowY: 'auto',
              flex: 1,
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {playlists.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 8px' }}>
                  <div 
                    style={{
                      width: '72px',
                      height: '72px',
                      background: 'rgba(29, 185, 84, 0.12)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px',
                      border: '1px solid rgba(29, 185, 84, 0.3)',
                      color: '#1ed760'
                    }}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                    margin: '0 0 20px',
                    fontSize: '13px',
                    color: '#b3b3b3',
                    lineHeight: 1.5
                  }}>
                    Create your first playlist to organize your music collection
                  </p>
                </div>
              ) : (
                <div>
                  <h6 style={{
                    margin: '0 0 12px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#1ed760',
                    textTransform: 'uppercase',
                    letterSpacing: '1.2px'
                  }}>
                    YOUR PLAYLISTS ({playlists.length})
                  </h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                            gap: '12px',
                            width: '100%',
                            padding: '12px 14px',
                            background: isInPlaylist 
                              ? 'linear-gradient(135deg, rgba(29, 185, 84, 0.2), rgba(29, 185, 84, 0.1))' 
                              : 'rgba(255, 255, 255, 0.04)',
                            border: isInPlaylist 
                              ? '1px solid rgba(29, 185, 84, 0.4)' 
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            color: isInPlaylist ? '#1ed760' : '#ffffff',
                            cursor: isInPlaylist || isAdding ? 'default' : 'pointer',
                            transition: 'all 0.25s ease',
                            marginBottom: '4px',
                            textAlign: 'left',
                            boxSizing: 'border-box'
                          }}
                          onMouseEnter={(e) => {
                            if (!isInPlaylist && !isAdding) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                              e.currentTarget.style.borderColor = 'rgba(29, 185, 84, 0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isInPlaylist && !isAdding) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            background: isInPlaylist ? 'rgba(29, 185, 84, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            color: isInPlaylist ? '#1ed760' : '#b3b3b3',
                            flexShrink: 0
                          }}>
                            {isAdding ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                              </svg>
                            ) : isInPlaylist ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20,6 9,17 4,12"/>
                              </svg>
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                              </svg>
                            )}
                          </div>
                          <div style={{ 
                            flex: 1, 
                            textAlign: 'left',
                            overflow: 'hidden',
                            minWidth: 0
                          }}>
                            <div style={{ 
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '14px',
                              color: '#ffffff'
                            }}>{playlist.name}</div>
                            <div style={{ 
                              fontSize: '12px', 
                              color: '#b3b3b3',
                              marginTop: '2px'
                            }}>
                              {playlist.tracks.length} track{playlist.tracks.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                          {isInPlaylist && (
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700,
                              background: 'rgba(29, 185, 84, 0.25)',
                              color: '#1ed760',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}>
                              Added ✓
                            </span>
                          )}
                          {isAdding && (
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: 700,
                              background: 'rgba(29, 185, 84, 0.35)',
                              color: '#1ed760',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              flexShrink: 0
                            }}>
                              Adding...
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '16px 20px',
              background: 'rgba(15, 15, 15, 0.95)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              boxSizing: 'border-box'
            }}>
              <button 
                onClick={() => setShowCreatePlaylist(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                  color: '#000000',
                  border: 'none',
                  borderRadius: '50px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(29, 185, 84, 0.35)',
                  boxSizing: 'border-box'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(29, 185, 84, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(29, 185, 84, 0.35)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Create New Playlist
              </button>
            </div>
            
            {showCreatePlaylist && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(145deg, rgba(20, 20, 20, 0.99), rgba(10, 10, 10, 0.99))',
                padding: '20px',
                zIndex: 10,
                borderRadius: '20px',
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
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      background: 'linear-gradient(135deg, #1db954, #1ed760)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(29, 185, 84, 0.4)'
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
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: 'none',
                      color: '#b3b3b3',
                      cursor: 'pointer',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      width: '32px',
                      height: '32px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#b3b3b3';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
                    lineHeight: 1.5,
                    marginBottom: '16px'
                  }}>
                    Create a new playlist to organize your favorite tracks and build your personal collection.
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
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '10px',
                      color: '#ffffff',
                      fontSize: '14px',
                      marginBottom: '20px',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#1db954';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29, 185, 84, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => {
                        setShowCreatePlaylist(false);
                        setNewPlaylistName('');
                      }}
                      style={{
                        padding: '10px 18px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#b3b3b3',
                        border: 'none',
                        borderRadius: '50px',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                        e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.color = '#b3b3b3';
                      }}
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                      style={{
                        padding: '10px 20px',
                        background: newPlaylistName.trim() 
                          ? 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)' 
                          : 'rgba(255, 255, 255, 0.1)',
                        color: newPlaylistName.trim() ? '#000000' : '#666666',
                        border: 'none',
                        borderRadius: '50px',
                        cursor: newPlaylistName.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        boxShadow: newPlaylistName.trim() ? '0 4px 15px rgba(29, 185, 84, 0.35)' : 'none'
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
                          e.currentTarget.style.boxShadow = '0 4px 15px rgba(29, 185, 84, 0.35)';
                        }
                      }}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {trackToRemove && (
        <ConfirmModal
          isOpen={!!trackToRemove}
          title="Remove Track"
          message={`Are you sure you want to remove "${trackToRemove.name}" from this playlist?`}
          confirmText="Remove"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmRemoveTrack}
          onCancel={() => setTrackToRemove(null)}
        />
      )}
    </div>
  );
}
