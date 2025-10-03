import React, { useState, useRef, useCallback } from 'react';
import { usePlayer } from '../hooks/usePlayer';
import { usePlayerStore } from '../store/playerStore';
import { formatDuration } from '../services/jamendoAPI';

export function PlayerControls() {
  const [showVolume, setShowVolume] = useState(false);
  const [hoverProgress, setHoverProgress] = useState(0);
  const [hoverVolume, setHoverVolume] = useState(0);
  const [volumeChangeIndicator, setVolumeChangeIndicator] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const lastSeekTime = useRef<number>(0);
  
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    changeVolume,
    mute
  } = usePlayer();

  const {
    currentTime,
    duration,
    addToFavorites,
    removeFromFavorites,
    favorites
  } = usePlayerStore();

  const progress = duration > 0 && !isNaN(duration) && !isNaN(currentTime) ? 
    Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
  const volumePercent = volume;

  const isFavorite = currentTrack ? favorites.some(f => f.id === currentTrack.id) : false;

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!progressRef.current || duration === 0 || !currentTrack) return;
    
    const currentTime = Date.now();
    if (currentTime - lastSeekTime.current < 100) {
      return;
    }
    lastSeekTime.current = currentTime;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percent * duration;
    
    console.log('🎯 Progress clicked:', { 
      clickX, 
      percent: (percent * 100).toFixed(1) + '%', 
      newTime: newTime.toFixed(1) + 's', 
      duration: duration.toFixed(1) + 's' 
    });
    
    seek(newTime);
  }, [duration, seek, currentTrack]);

  const handleProgressMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || duration === 0) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const hoverX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (hoverX / rect.width) * 100));
    setHoverProgress(percent);
  }, [duration]);

  const handleProgressMouseLeave = useCallback(() => {
    setHoverProgress(0);
  }, []);

  const handleVolumeClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    changeVolume(percent);
    
    setVolumeChangeIndicator(true);
    setTimeout(() => setVolumeChangeIndicator(false), 1000);
  }, [changeVolume]);

  const handleVolumeMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    
    const rect = volumeRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setHoverVolume(percent);
  }, []);

  const handleToggleFavorite = () => {
    if (!currentTrack) return;
    
    if (isFavorite) {
      removeFromFavorites(currentTrack.id);
    } else {
      addToFavorites(currentTrack);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
          <line x1="23" y1="9" x2="17" y2="15"/>
          <line x1="17" y1="9" x2="23" y2="15"/>
        </svg>
      );
    } else if (volume < 50) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
      );
    } else {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      );
    }
  };

  if (!currentTrack) {
    return (
      <div className="spotify-player-card">
        <div className="player-empty">
          <div className="pfp">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ background: 'transparent' }}>
              <circle cx="12" cy="12" r="2"/>
              <path d="M12 1v6m0 6v6"/>
              <path d="m21 12-6-6-6 6-6-6"/>
            </svg>
          </div>
          <div className="track-info-empty">
            <div className="title-1">No track selected</div>
            <div className="title-2">Choose a song to start playing</div>
          </div>
        </div>
        <div className="progress-bar-container empty-progress">
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: '0%' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="spotify-player-card">
      <div className="top">
        <div className="pfp">
          {currentTrack.image && currentTrack.image !== '/placeholder-album.svg' ? (
            <img src={currentTrack.image} alt={currentTrack.name} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ background: 'transparent' }}>
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          )}
        </div>
        
        <div className="track-info">
          <div className="title-1">{currentTrack.name}</div>
          <div className="title-2">{currentTrack.artist_name}</div>
        </div>

        {isPlaying && (
          <div className="playing">
            <div className="greenline line-1"></div>
            <div className="greenline line-2"></div>
            <div className="greenline line-3"></div>
            <div className="greenline line-4"></div>
            <div className="greenline line-5"></div>
          </div>
        )}
      </div>

      {currentTrack && (
        <div 
          className="progress-bar-container"
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
        >
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${progress}%` }}
            />
            <div 
              className="progress-bar-thumb"
              style={{ left: `${progress}%` }}
            />
          </div>
          {hoverProgress > 0 && duration > 0 && (
            <div className="progress-tooltip" style={{ left: `${hoverProgress}%` }}>
              {formatDuration(Math.max(0, (hoverProgress / 100) * duration))}
            </div>
          )}
        </div>
      )}

      <div className="controls">
        <button
          className="control-btn"
          onClick={handleToggleFavorite}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? '#1db954' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        <button
          className="control-btn"
          onClick={previousTrack}
          title="Previous track"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="19,20 9,12 19,4"/>
            <line x1="5" y1="19" x2="5" y2="5"/>
          </svg>
        </button>

        <button
          className="control-btn play-btn"
          onClick={togglePlayPause}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5,3 19,12 5,21"/>
            </svg>
          )}
        </button>

        <button
          className="control-btn"
          onClick={nextTrack}
          title="Next track"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5,4 15,12 5,20"/>
            <line x1="19" y1="5" x2="19" y2="19"/>
          </svg>
        </button>

        <button
          className="control-btn volume_button"
          onClick={mute}
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {getVolumeIcon()}
        </button>

        <div 
          className={`volume ${showVolume ? 'show' : ''} ${volumeChangeIndicator ? 'volume-changing' : ''}`}
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <div 
            className="slider volume-slider"
            ref={volumeRef}
            onClick={handleVolumeClick}
            onMouseMove={handleVolumeMouseMove}
          >
            <div className="volume-track">
              <div 
                className="volume-hover"
                style={{ width: `${hoverVolume}%` }}
              />
              <div 
                className="green volume-fill" 
                style={{ width: `${volumePercent}%` }}
              />
              <div 
                className="circle volume-thumb"
                style={{ left: `${volumePercent}%` }}
              />
            </div>
          </div>
          <div className="volume-indicator">
            <span className="volume-text">{Math.round(volumePercent)}%</span>
            {volumeChangeIndicator && (
              <div className="volume-change-animation">
                <div className="volume-pulse"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="timetext time_now">{formatDuration(currentTime)}</div>
      <div className="timetext time_full">{formatDuration(duration)}</div>
    </div>
  );
}
