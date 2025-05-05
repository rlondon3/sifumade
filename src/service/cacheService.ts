// src/service/cacheService.ts
import { Album } from './presignedUrlService';

export interface CachedAlbum {
	album: Album;
	audioUrls: Record<string, string>; // Maps song keys to cached URLs
	coverUrl: string;
	timestamp: number;
	expiresAt: number;
}

import { Release } from './presignedUrlService';

export interface CachedRelease {
	release: Release;
	coverUrl: string;
	audioUrl?: string; // Optional since upcoming might not have audio
	timestamp: number;
	expiresAt: number;
}

export class AudioCache {
	// Cache names
	private readonly AUDIO_CACHE = 'audio-files';
	private readonly METADATA_CACHE = 'audio-metadata';

	// Cache expiration time (7 days in milliseconds)
	private readonly CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

	// Track which albums are currently being cached
	private cachingInProgress: Record<string, boolean> = {};

	// Check if the browser supports the Cache API
	private isSupported(): boolean {
		return 'caches' in window;
	}

	// Initialize the cache
	public async init(): Promise<void> {
		if (!this.isSupported()) {
			console.warn('Cache API is not supported in this browser');
			return;
		}

		try {
			await caches.open(this.AUDIO_CACHE);
			await caches.open(this.METADATA_CACHE);
			// console.log('Album cache initialized successfully');
		} catch (error) {
			console.error('Failed to initialize album cache:', error);
		}
	}

	public async cacheRelease(
		release: Release,
		coverUrl: string,
		audioUrl?: string
	): Promise<void> {
		if (!this.isSupported()) return;

		try {
			// console.log(`Caching release: ${release.title}`);

			// Cache the cover image
			const cache = await caches.open(this.AUDIO_CACHE);

			try {
				const coverResponse = await fetch(coverUrl, {
					mode: 'cors',
					credentials: 'omit',
				});

				if (coverResponse.ok) {
					await cache.put(coverUrl, coverResponse.clone());
					// console.log(`Cached cover for release: ${release.title}`);
				} else {
					console.warn(
						`Failed to cache release cover image: ${coverResponse.status}`
					);
				}
			} catch (err) {
				console.error(`CORS issue caching release cover: ${err}`);
			}

			// Cache the audio file if available
			if (audioUrl && release.key) {
				try {
					const audioResponse = await fetch(audioUrl, {
						mode: 'cors',
						credentials: 'omit',
					});

					if (audioResponse.ok) {
						await cache.put(audioUrl, audioResponse.clone());
						// console.log(`Cached audio for release: ${release.title}`);
					} else {
						console.warn(
							`Failed to cache release audio: ${audioResponse.status}`
						);
					}
				} catch (err) {
					console.error(`CORS issue caching release audio: ${err}`);
				}
			}

			// Store release metadata
			const expiresAt = Date.now() + this.CACHE_EXPIRATION;
			const cachedRelease: CachedRelease = {
				release,
				coverUrl,
				audioUrl,
				timestamp: Date.now(),
				expiresAt,
			};

			// Store in metadata cache
			const metaCache = await caches.open(this.METADATA_CACHE);
			await metaCache.put(
				release.id,
				new Response(JSON.stringify(cachedRelease))
			);

			// console.log(`Release ${release.title} cached successfully`);
		} catch (error) {
			console.error(`Failed to cache release ${release.title}:`, error);
		}
	}

	// Track created release cover object URLs
	private releaseCoverObjectUrls: Record<string, string> = {};

	// Get cached cover URL for a release
	public async getReleaseCoverUrl(releaseId: string): Promise<string | null> {
		if (!this.isSupported()) return null;

		// Check if we already have an object URL for this cover
		if (this.releaseCoverObjectUrls[releaseId]) {
			return this.releaseCoverObjectUrls[releaseId];
		}

		try {
			const metaCache = await caches.open(this.METADATA_CACHE);
			const metaResponse = await metaCache.match(releaseId);

			if (!metaResponse) return null;

			const cachedRelease: CachedRelease = await metaResponse.json();

			// Check if cache has expired
			if (Date.now() > cachedRelease.expiresAt) {
				await this.clearRelease(releaseId);
				return null;
			}

			// Get the cover image
			const cache = await caches.open(this.AUDIO_CACHE);
			const response = await cache.match(cachedRelease.coverUrl);

			if (!response) return null;

			// Create an object URL for the cover
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);

			// Store it in our tracking map
			this.releaseCoverObjectUrls[releaseId] = objectUrl;

			return objectUrl;
		} catch (error) {
			console.error(
				`Failed to retrieve cover for release ${releaseId}:`,
				error
			);
			return null;
		}
	}

	// Track created release audio object URLs
	private releaseAudioObjectUrls: Record<string, string> = {};

	// Get cached audio URL for a release
	public async getReleaseAudioUrl(releaseId: string): Promise<string | null> {
		if (!this.isSupported()) return null;

		// Check if we already have an object URL for this audio
		if (this.releaseAudioObjectUrls[releaseId]) {
			return this.releaseAudioObjectUrls[releaseId];
		}

		try {
			const metaCache = await caches.open(this.METADATA_CACHE);
			const metaResponse = await metaCache.match(releaseId);

			if (!metaResponse) return null;

			const cachedRelease: CachedRelease = await metaResponse.json();

			// Check if cache has expired
			if (Date.now() > cachedRelease.expiresAt) {
				await this.clearRelease(releaseId);
				return null;
			}

			// Check if audio exists in cache
			if (!cachedRelease.audioUrl) return null;

			// Get the audio file
			const cache = await caches.open(this.AUDIO_CACHE);
			const response = await cache.match(cachedRelease.audioUrl);

			if (!response) return null;

			// Create an object URL for the audio
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);

			// Store it in our tracking map
			this.releaseAudioObjectUrls[releaseId] = objectUrl;

			return objectUrl;
		} catch (error) {
			console.error(
				`Failed to retrieve audio for release ${releaseId}:`,
				error
			);
			return null;
		}
	}

	// Clear a specific release from the cache
	public async clearRelease(releaseId: string): Promise<void> {
		if (!this.isSupported()) return;

		try {
			// Get metadata to find the URLs
			const metaCache = await caches.open(this.METADATA_CACHE);
			const metaResponse = await metaCache.match(releaseId);

			if (metaResponse) {
				const cachedRelease: CachedRelease = await metaResponse.json();

				// Delete from audio cache
				const cache = await caches.open(this.AUDIO_CACHE);

				// Delete cover and revoke its object URL if it exists
				await cache.delete(cachedRelease.coverUrl);
				if (this.releaseCoverObjectUrls[releaseId]) {
					URL.revokeObjectURL(this.releaseCoverObjectUrls[releaseId]);
					delete this.releaseCoverObjectUrls[releaseId];
				}

				// Delete audio and revoke its object URL if it exists
				if (cachedRelease.audioUrl) {
					await cache.delete(cachedRelease.audioUrl);
					if (this.releaseAudioObjectUrls[releaseId]) {
						URL.revokeObjectURL(this.releaseAudioObjectUrls[releaseId]);
						delete this.releaseAudioObjectUrls[releaseId];
					}
				}

				// Delete metadata
				await metaCache.delete(releaseId);

				// console.log(`Cleared release ${releaseId} from cache`);
			}
		} catch (error) {
			console.error(`Failed to clear release ${releaseId} from cache:`, error);
		}
	}

	// Cache an entire album (cover and all songs)
	public async cacheAlbum(
		album: Album,
		coverUrl: string,
		songUrls: Record<string, string>
	): Promise<void> {
		if (!this.isSupported()) return;

		// Check if we're already caching this album
		if (this.cachingInProgress[album.id]) {
			// console.log(`Caching already in progress for album: ${album.title}`);
			return;
		}

		try {
			// Mark this album as being cached
			this.cachingInProgress[album.id] = true;

			// Double-check if already cached
			const isAlreadyCached = await this.isAlbumCached(album.id);
			if (isAlreadyCached) {
				// console.log(`Album ${album.title} is already cached (confirmed)`);
				return;
			}

			// console.log(`Caching entire album: ${album.title}`);

			// Cache the cover image
			const cache = await caches.open(this.AUDIO_CACHE);

			try {
				const coverResponse = await fetch(coverUrl, {
					mode: 'cors',
					credentials: 'omit',
				});

				if (coverResponse.ok) {
					await cache.put(coverUrl, coverResponse.clone());
					// console.log(`Cached cover for ${album.title}`);
				} else {
					console.warn(`Failed to cache cover image: ${coverResponse.status}`);
				}
			} catch (err) {
				console.error(`CORS issue caching cover: ${err}`);
				// Continue even if cover caching fails
			}

			// Cache all song files
			const audioUrls: Record<string, string> = {};
			for (const song of album.songs) {
				if (!songUrls[song.key]) continue;

				const url = songUrls[song.key];
				try {
					const response = await fetch(url, {
						mode: 'cors',
						credentials: 'omit',
					});

					if (response.ok) {
						await cache.put(url, response.clone());
						audioUrls[song.key] = url;
						// console.log(`Cached song: ${song.title}`);
					} else {
						console.warn(
							`Failed to cache song ${song.title}: ${response.status}`
						);
					}
				} catch (err) {
					console.error(`CORS issue caching song ${song.title}: ${err}`);
					// Continue with next song
				}
			}

			// Even if some songs failed to cache, store what we got
			// Store album metadata
			const expiresAt = Date.now() + this.CACHE_EXPIRATION;
			const cachedAlbum: CachedAlbum = {
				album,
				audioUrls,
				coverUrl,
				timestamp: Date.now(),
				expiresAt,
			};

			// Store in metadata cache
			const metaCache = await caches.open(this.METADATA_CACHE);
			await metaCache.put(album.id, new Response(JSON.stringify(cachedAlbum)));

			// console.log(
			// 	`Album ${album.title} cached with ${Object.keys(audioUrls).length}/${
			// 		album.songs.length
			// 	} songs`
			// );
		} catch (error) {
			console.error(`Failed to cache album ${album.title}:`, error);
		} finally {
			// Always reset the in-progress flag when done
			this.cachingInProgress[album.id] = false;
		}
	}

	// Check if an album is cached
	public async isAlbumCached(albumId: string): Promise<boolean> {
		if (!this.isSupported()) return false;

		try {
			const metaCache = await caches.open(this.METADATA_CACHE);
			const metaResponse = await metaCache.match(albumId);

			if (!metaResponse) {
				// console.log(`Album ${albumId} not found in metadata cache`);
				return false;
			}

			const cachedAlbum: CachedAlbum = await metaResponse.json();

			// Check if cache has expired
			if (Date.now() > cachedAlbum.expiresAt) {
				// console.log(`Album ${albumId} cache has expired`);
				await this.clearAlbum(albumId);
				return false;
			}

			// Verify that at least some songs are actually cached
			if (Object.keys(cachedAlbum.audioUrls).length === 0) {
				// console.log(`Album ${albumId} has no songs cached`);
				return false;
			}

			// console.log(`Album ${albumId} is already properly cached`);
			return true;
		} catch (error) {
			console.error(`Error checking if album ${albumId} is cached:`, error);
			return false;
		}
	}

	// Track created cover object URLs
	private coverObjectUrls: Record<string, string> = {};

	// Get cached cover URL for an album
	public async getCoverUrl(albumId: string): Promise<string | null> {
		if (!this.isSupported()) return null;

		// Check if we already have an object URL for this cover
		if (this.coverObjectUrls[albumId]) {
			return this.coverObjectUrls[albumId];
		}

		try {
			const metaCache = await caches.open(this.METADATA_CACHE);
			const metaResponse = await metaCache.match(albumId);

			if (!metaResponse) return null;

			const cachedAlbum: CachedAlbum = await metaResponse.json();

			// Check if cache has expired
			if (Date.now() > cachedAlbum.expiresAt) {
				await this.clearAlbum(albumId);
				return null;
			}

			// Get the cover image
			const cache = await caches.open(this.AUDIO_CACHE);
			const response = await cache.match(cachedAlbum.coverUrl);

			if (!response) return null;

			// Create an object URL for the cover (only once)
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);

			// Store it in our tracking map
			this.coverObjectUrls[albumId] = objectUrl;

			return objectUrl;
		} catch (error) {
			console.error(`Failed to retrieve cover for album ${albumId}:`, error);
			return null;
		}
	}

	// Track created object URLs to prevent duplicate creation
	private audioObjectUrls: Record<string, string> = {};

	// Get cached audio URL for a song
	public async getSongUrl(
		albumId: string,
		songKey: string
	): Promise<string | null> {
		if (!this.isSupported()) return null;

		// Create a unique key for this song
		const cacheKey = `${albumId}:${songKey}`;

		// Check if we already have an object URL for this song
		if (this.audioObjectUrls[cacheKey]) {
			return this.audioObjectUrls[cacheKey];
		}

		try {
			const metaCache = await caches.open(this.METADATA_CACHE);
			const metaResponse = await metaCache.match(albumId);

			if (!metaResponse) return null;

			const cachedAlbum: CachedAlbum = await metaResponse.json();

			// Check if cache has expired
			if (Date.now() > cachedAlbum.expiresAt) {
				await this.clearAlbum(albumId);
				return null;
			}

			// Check if song exists in cache
			if (!cachedAlbum.audioUrls[songKey]) return null;

			// Get the audio file
			const cache = await caches.open(this.AUDIO_CACHE);
			const response = await cache.match(cachedAlbum.audioUrls[songKey]);

			if (!response) return null;

			// Create an object URL for the audio (only once)
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);

			// Store it in our tracking map
			this.audioObjectUrls[cacheKey] = objectUrl;

			return objectUrl;
		} catch (error) {
			console.error(
				`Failed to retrieve song ${songKey} from album ${albumId}:`,
				error
			);
			return null;
		}
	}

	// Clear a specific album from the cache
	public async clearAlbum(albumId: string): Promise<void> {
		if (!this.isSupported()) return;

		try {
			// Get metadata to find the URLs
			const metaCache = await caches.open(this.METADATA_CACHE);
			const metaResponse = await metaCache.match(albumId);

			if (metaResponse) {
				const cachedAlbum: CachedAlbum = await metaResponse.json();

				// Delete from audio cache
				const cache = await caches.open(this.AUDIO_CACHE);

				// Delete cover and revoke its object URL if it exists
				await cache.delete(cachedAlbum.coverUrl);
				if (this.coverObjectUrls[albumId]) {
					URL.revokeObjectURL(this.coverObjectUrls[albumId]);
					delete this.coverObjectUrls[albumId];
				}

				// Delete all songs and revoke their object URLs
				for (const songKey of Object.keys(cachedAlbum.audioUrls)) {
					const url = cachedAlbum.audioUrls[songKey];
					await cache.delete(url);

					// Revoke object URLs for this album's songs
					const cacheKey = `${albumId}:${songKey}`;
					if (this.audioObjectUrls[cacheKey]) {
						URL.revokeObjectURL(this.audioObjectUrls[cacheKey]);
						delete this.audioObjectUrls[cacheKey];
					}
				}

				// Delete metadata
				await metaCache.delete(albumId);

				// console.log(`Cleared album ${albumId} from cache`);
			}
		} catch (error) {
			console.error(`Failed to clear album ${albumId} from cache:`, error);
		}
	}

	// Clear all cached albums
	public async clearAll(): Promise<void> {
		if (!this.isSupported()) return;

		try {
			// Revoke all audio object URLs
			for (const url of Object.values(this.audioObjectUrls)) {
				URL.revokeObjectURL(url);
			}
			this.audioObjectUrls = {};

			// Revoke all cover object URLs
			for (const url of Object.values(this.coverObjectUrls)) {
				URL.revokeObjectURL(url);
			}
			this.coverObjectUrls = {};

			// Revoke all release cover object URLs
			for (const url of Object.values(this.releaseCoverObjectUrls)) {
				URL.revokeObjectURL(url);
			}
			this.releaseCoverObjectUrls = {};

			// Revoke all release audio object URLs
			for (const url of Object.values(this.releaseAudioObjectUrls)) {
				URL.revokeObjectURL(url);
			}
			this.releaseAudioObjectUrls = {};

			await caches.delete(this.AUDIO_CACHE);
			await caches.delete(this.METADATA_CACHE);
			await this.init();
			// console.log('Cleared all cached albums and releases');
		} catch (error) {
			console.error('Failed to clear audio cache:', error);
		}
	}
}

// Create a singleton instance
export const audioCache = new AudioCache();
