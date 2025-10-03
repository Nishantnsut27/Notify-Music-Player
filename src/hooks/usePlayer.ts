import { useEffect, useRef, useCallback } from 'react';
import type { Track } from '../types/types';
import { usePlayerStore } from '../store/playerStore';

export function usePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    queue,
    currentIndex,
    isShuffling,
    repeatMode,
    setCurrentTime,
    setDuration,
    setIsPlaying,
    playTrack,
    pauseTrack,
    nextTrack,
    previousTrack,
    setVolume,
    toggleMute,
    seekTo
  } = usePlayerStore();

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else {
        nextTrack();
      }
    };

    const handleError = () => {
      console.error('Audio playback error');
      setIsPlaying(false);
    };

    const handleCanPlay = () => {
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [isPlaying, repeatMode, setCurrentTime, setDuration, setIsPlaying, nextTrack]);

  useEffect(() => {
    if (audioRef.current && currentTrack) {


      
      audioRef.current.src = currentTrack.audio;
      audioRef.current.load();
      
      // Add additional error handling for the specific track
      const handleLoadError = () => {
        console.error('❌ Failed to load audio for track:', currentTrack.name);
        // Try to use audiodownload URL as fallback if available
        if (currentTrack.audiodownload && currentTrack.audiodownload !== currentTrack.audio) {

          audioRef.current!.src = currentTrack.audiodownload;
          audioRef.current!.load();
        }
      };

      const handleLoadSuccess = () => {


      };

      audioRef.current.addEventListener('error', handleLoadError, { once: true });
      audioRef.current.addEventListener('loadeddata', handleLoadSuccess, { once: true });
    }
  }, [currentTrack]);

  // Handle play/pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  const play = useCallback((track?: Track) => {
    if (track) {
      playTrack(track);
    } else {
      setIsPlaying(true);
    }
  }, [playTrack, setIsPlaying]);

  const pause = useCallback(() => {
    pauseTrack();
  }, [pauseTrack]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    seekTo(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, [seekTo]);

  const changeVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
  }, [setVolume]);

  const mute = useCallback(() => {
    toggleMute();
  }, [toggleMute]);

  return {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    queue,
    currentIndex,
    isShuffling,
    repeatMode,
    play,
    pause,
    togglePlayPause,
    nextTrack,
    previousTrack,
    seek,
    changeVolume,
    mute,
    audioRef
  };
}
