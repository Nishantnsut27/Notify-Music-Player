import { Router } from 'express';
import { MusicController } from '../controllers/musicController.js';

export const musicRouter = Router();

// Expose clean, consistent API endpoints mapped to internal provider logic

musicRouter.get('/search', MusicController.search);
musicRouter.get('/trending', MusicController.getTrending);
musicRouter.get('/song/:id', MusicController.getSongById);
musicRouter.get('/album/:id', MusicController.getAlbumById);
musicRouter.get('/artist/:id', MusicController.getArtistById);
musicRouter.get('/playlist/:id', MusicController.getPlaylistById);
musicRouter.get('/suggestions/:id', MusicController.getSuggestions);
