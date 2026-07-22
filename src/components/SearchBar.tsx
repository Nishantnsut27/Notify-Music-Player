import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { usePlayerStore } from '../store/playerStore';
import { MusicAPI } from '../services/musicApi';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedQuery = useDebounce(query, 500);
  const { 
    setResults, 
    setLoading, 
    setError, 
    clearResults,
    setQuery: setStoreQuery,
    currentView,
    setCurrentView 
  } = usePlayerStore();

  const performSearch = useCallback(async (searchQuery: string) => {
    setIsSearching(true);
    setLoading(true);
    setError(null);
    setStoreQuery(searchQuery);
    
    if (currentView !== 'search') {
      setCurrentView('search');
    }
    
    try {
      const tracks = await MusicAPI.searchTracks(searchQuery);
      setResults(tracks);
      setError(null);
    } catch (error) {
      console.error('🔍 Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 
        `Sorry, we couldn't find matches for "${searchQuery}". Try searching for popular songs, artists, or genres like rap, electronic, jazz, or pop.`;
      setError(errorMessage);
      setResults([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [setIsSearching, setLoading, setError, setStoreQuery, currentView, setCurrentView, setResults]);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else {
      clearResults();
      setIsSearching(false);
    }
  }, [debouncedQuery, clearResults, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleClear = () => {
    setQuery('');
    clearResults();
    setIsSearching(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (!value.trim()) {
      clearResults();
      setIsSearching(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      style={{ 
        width: '100%', 
        maxWidth: '100%', 
        margin: '0',
        padding: '2rem',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center'
      }}
    >
      <div 
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: isHovered || isFocused 
            ? 'linear-gradient(135deg, rgba(50, 50, 50, 0.8) 0%, rgba(30, 30, 30, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(40, 40, 40, 0.6) 0%, rgba(24, 24, 24, 0.8) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '50px',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
          padding: '0.5rem',
          transition: 'all 0.3s ease',
          width: '100%',
          maxWidth: '600px',
          transform: isHovered || isFocused ? 'translateY(-2px)' : 'translateY(0)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
            flexShrink: 0,
            marginRight: '0.75rem',
            boxShadow: isHovered || isFocused 
              ? '0 6px 20px rgba(29, 185, 84, 0.6)' 
              : '0 4px 15px rgba(29, 185, 84, 0.4)',
            transition: 'all 0.3s ease',
            transform: isHovered || isFocused ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {isSearching ? (
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none"
              stroke="white" 
              strokeWidth="2"
              style={{ transition: 'all 0.3s ease' }}
            >
              <circle cx="12" cy="12" r="3">
                <animate attributeName="r" values="3;6;3" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="12" cy="12" r="1"/>
            </svg>
          ) : (
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="white" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ 
                transition: 'all 0.3s ease',
                transform: isHovered || isFocused ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
          )}
        </div>
        
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search song, artist..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            boxShadow: 'none',
            padding: '0.75rem 1rem',
            fontSize: '1.125rem',
            color: '#ffffff',
            fontWeight: 500,
            minWidth: 0,
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-label="Search for music"
          autoComplete="off"
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(60, 60, 60, 0.8)',
              border: 'none',
              color: '#aaaaaa',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginLeft: '0.5rem',
              flexShrink: 0,
              transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(80, 80, 80, 0.9)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(60, 60, 60, 0.8)';
              e.currentTarget.style.color = '#aaaaaa';
            }}
            aria-label="Clear search"
          >
            <svg 
              width="18" 
              height="18" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6"/>
              <path d="M9 9l6 6"/>
            </svg>
          </button>
        )}
      </div>
    </form>
  );
}
