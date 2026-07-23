import React, { useEffect, useRef } from 'react';
import type { Playlist } from '../types/types';

interface PlaylistMenuProps {
  playlist: Playlist;
  isOpen: boolean;
  onClose: () => void;
  onRename: (playlist: Playlist) => void;
  onExport: (playlistId: string) => void;
  onDelete: (playlist: Playlist) => void;
  align?: 'left' | 'right';
}

export const PlaylistMenu: React.FC<PlaylistMenuProps> = ({
  playlist,
  isOpen,
  onClose,
  onRename,
  onExport,
  onDelete,
  align = 'right',
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`playlist-actions-menu ${align === 'left' ? 'align-left' : 'align-right'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRename(playlist);
          onClose();
        }}
        className="playlist-action-item"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Edit Name
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExport(playlist.id);
          onClose();
        }}
        className="playlist-action-item"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Export Playlist
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(playlist);
          onClose();
        }}
        className="playlist-action-item playlist-action-delete"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3,6 5,6 21,6" />
          <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
        Delete Playlist
      </button>
    </div>
  );
};
