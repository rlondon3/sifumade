// src/service/presignedUrlService.ts
import {
	S3Client,
	GetObjectCommand,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { audioCache } from './cacheService';

// Define interfaces
export interface Album {
	id: string;
	title: string;
	artist: string;
	coverKey: string;
	songs: Song[];
}

export interface Song {
	id: string;
	title: string;
	artist: string;
	key: string;
	duration: number;
	album: string;
}

export interface Release {
	id: string;
	title: string;
	artist: string;
	coverKey: string;
	releaseDate: string; // Format: YYYY-MM-DD
	key: string; // For the audio file
}

// Create S3 client with credentials from environment variables
const s3Client = new S3Client({
	region: import.meta.env.VITE_AWS_REGION,
	credentials: {
		accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
		secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
	},
});

export async function getPresignedCoverUrl(album: Album): Promise<string> {
	try {
		// Try to get from cache first
		const cachedUrl = await audioCache.getCoverUrl(album.id);
		if (cachedUrl) {
			console.log(`Using cached cover for album ${album.title}`);
			return cachedUrl;
		}

		// If not in cache, get from S3
		console.log(`Fetching cover from S3: ${album.coverKey}`);
		const command = new GetObjectCommand({
			Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
			Key: album.coverKey,
		});

		const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

		// Cache the cover URL separately if not part of a full album cache operation
		try {
			const coverResponse = await fetch(url, {
				mode: 'cors',
				credentials: 'omit',
			});

			if (coverResponse.ok) {
				const cache = await caches.open('audio-files');
				await cache.put(url, coverResponse.clone());

				// Store in metadata cache to track this cover URL
				const metaCache = await caches.open('audio-metadata');
				const metaResponse = await metaCache.match(album.id);

				if (metaResponse) {
					// Update existing metadata
					const cachedAlbum = await metaResponse.json();
					cachedAlbum.coverUrl = url;
					await metaCache.put(
						album.id,
						new Response(JSON.stringify(cachedAlbum))
					);
				} else {
					// Create new minimal metadata entry just for the cover
					const minimalCache = {
						album: album,
						audioUrls: {},
						coverUrl: url,
						timestamp: Date.now(),
						expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
					};
					await metaCache.put(
						album.id,
						new Response(JSON.stringify(minimalCache))
					);
				}

				console.log(`Cover for ${album.title} cached successfully`);
			}
		} catch (err) {
			console.error(`Failed to cache cover image: ${err}`);
			// Continue even if caching fails - return the URL anyway
		}

		return url;
	} catch (error) {
		console.error(`Error getting cover URL for album ${album.title}:`, error);
		throw error;
	}
}

// Generate pre-signed URL for a song
export async function getPresignedUrl(
	key: string,
	albumId: string
): Promise<string> {
	try {
		// Try to get from cache first
		const cachedUrl = await audioCache.getSongUrl(albumId, key);
		if (cachedUrl) {
			console.log(`Using cached audio for ${key}`);
			return cachedUrl;
		}

		// If not in cache, get from S3
		console.log(`Fetching from S3: ${key}`);
		const command = new GetObjectCommand({
			Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
			Key: key,
		});

		return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
	} catch (error) {
		console.error(`Error getting pre-signed URL for ${key}:`, error);
		throw error;
	}
}

// Cache an entire album
export async function cacheEntireAlbum(album: Album): Promise<void> {
	try {
		// Check if already cached
		const isAlreadyCached = await audioCache.isAlbumCached(album.id);
		if (isAlreadyCached) {
			console.log(`Album ${album.title} is already cached`);
			return;
		}

		console.log(`Starting to cache entire album: ${album.title}`);

		// Get cover URL
		const coverCommand = new GetObjectCommand({
			Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
			Key: album.coverKey,
		});
		const coverUrl = await getSignedUrl(s3Client, coverCommand, {
			expiresIn: 3600,
		});

		// Get all song URLs
		const songUrls: Record<string, string> = {};
		for (const song of album.songs) {
			const songCommand = new GetObjectCommand({
				Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
				Key: song.key,
			});
			songUrls[song.key] = await getSignedUrl(s3Client, songCommand, {
				expiresIn: 3600,
			});
		}

		// Cache the entire album at once
		await audioCache.cacheAlbum(album, coverUrl, songUrls);

		console.log(`Successfully initiated caching for album ${album.title}`);
	} catch (error) {
		console.error(`Error caching album ${album.title}:`, error);
	}
}

// Scan S3 bucket to build music library - fixed for nested album structure
export async function scanMusicLibrary(): Promise<{
	albums: Album[];
	songs: Song[];
}> {
	try {
		// List all objects in the bucket
		const command = new ListObjectsV2Command({
			Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
		});

		const response = await s3Client.send(command);
		const allFiles = response.Contents || [];

		console.log(`Found ${allFiles.length} total files in bucket`);

		// Extract album folders from file paths - looking at second level folders
		const albumFolders = new Set<string>();

		// First pass: identify all album folders that are inside the "albums" directory
		for (const file of allFiles) {
			if (!file.Key) continue;

			const pathParts = file.Key.split('/');
			if (pathParts.length > 2 && pathParts[0] === 'albums') {
				// Take the second folder as the album name (albums/album-name/...)
				albumFolders.add(pathParts[1]);
			}
		}

		console.log(
			`Found ${albumFolders.size} album folders: ${Array.from(
				albumFolders
			).join(', ')}`
		);

		// Storage for our found albums and songs
		const foundAlbums: Album[] = [];
		const foundSongs: Song[] = [];

		// Process each album folder
		for (const albumName of albumFolders) {
			// Get all files for this album
			const albumFiles = allFiles.filter((file) =>
				file.Key?.startsWith(`albums/${albumName}/`)
			);

			console.log(`Album "${albumName}" has ${albumFiles.length} files`);

			// Find cover image
			const coverFile = albumFiles.find(
				(file) =>
					file.Key?.endsWith('.jpg') ||
					file.Key?.endsWith('.png') ||
					file.Key?.endsWith('.jpeg')
			);

			// Find all audio files
			const songFiles = albumFiles.filter(
				(file) =>
					file.Key?.endsWith('.mp3') ||
					file.Key?.endsWith('.wav') ||
					file.Key?.endsWith('.m4a')
			);

			console.log(
				`Album "${albumName}" has ${
					songFiles.length
				} songs and cover: ${!!coverFile}`
			);

			// Create album object
			if (coverFile?.Key) {
				const album: Album = {
					id: albumName.replace(/\s+/g, '-').toLowerCase(),
					title: albumName.replace(/-/g, ' '),
					artist: 'DRIP SIFU',
					coverKey: coverFile.Key,
					songs: [],
				};

				// Create song objects
				for (const songFile of songFiles) {
					if (!songFile.Key) continue;

					const songName =
						songFile.Key.split('/')
							.pop()
							?.replace(/\.(mp3|wav|m4a)$/, '') || '';

					const song: Song = {
						id: `${album.id}-${songName.replace(/\s+/g, '-').toLowerCase()}`,
						title: songName.replace(/-/g, ' '),
						artist: 'DRIP SIFU',
						key: songFile.Key,
						duration: 0, // Will be set when audio is loaded
						album: album.title,
					};

					foundSongs.push(song);
					album.songs.push(song);
				}

				foundAlbums.push(album);
			}
		}

		console.log(
			`Processed ${foundAlbums.length} albums with ${foundSongs.length} total songs`
		);

		return { albums: foundAlbums, songs: foundSongs };
	} catch (error) {
		console.error('Error scanning music library:', error);
		return { albums: [], songs: [] };
	}
}

export async function getLatestRelease(): Promise<Release | null> {
	try {
		// List objects in the latest release directory
		const command = new ListObjectsV2Command({
			Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
			Prefix: 'latest/',
		});

		const response = await s3Client.send(command);
		const files = response.Contents || [];

		if (files.length === 0) return null;

		// Find cover image and audio file
		const coverFile = files.find(
			(file) =>
				file.Key?.endsWith('.jpg') ||
				file.Key?.endsWith('.png') ||
				file.Key?.endsWith('.jpeg')
		);

		const audioFile = files.find(
			(file) =>
				file.Key?.endsWith('.mp3') ||
				file.Key?.endsWith('.wav') ||
				file.Key?.endsWith('.m4a')
		);

		if (!coverFile?.Key || !audioFile?.Key) return null;

		// Parse metadata from filenames or use default values
		const title =
			audioFile.Key.split('/')
				.pop()
				?.replace(/\.(mp3|wav|m4a)$/, '') || 'Latest Release';

		const release = {
			id: 'latest-release',
			title: title.replace(/-/g, ' '),
			artist: 'DRIP SIFU',
			coverKey: coverFile.Key,
			releaseDate: new Date().toISOString().split('T')[0], // Today's date as default
			key: audioFile.Key,
		};

		// Get pre-signed URLs and cache the release
		const coverUrl = await getSignedUrl(
			s3Client,
			new GetObjectCommand({
				Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
				Key: coverFile.Key,
			}),
			{ expiresIn: 3600 }
		);

		const audioUrl = await getSignedUrl(
			s3Client,
			new GetObjectCommand({
				Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
				Key: audioFile.Key,
			}),
			{ expiresIn: 3600 }
		);

		// Cache the release
		audioCache
			.cacheRelease(release, coverUrl, audioUrl)
			.catch((err) => console.error(`Failed to cache latest release: ${err}`));

		return release;
	} catch (error) {
		console.error('Error getting latest release:', error);
		return null;
	}
}

export async function getUpcomingRelease(): Promise<Release | null> {
	try {
		// List objects in the upcoming release directory
		const command = new ListObjectsV2Command({
			Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
			Prefix: 'upcoming/',
		});

		const response = await s3Client.send(command);
		const files = response.Contents || [];

		if (files.length === 0) return null;

		// Find cover image
		const coverFile = files.find(
			(file) =>
				file.Key?.endsWith('.jpg') ||
				file.Key?.endsWith('.png') ||
				file.Key?.endsWith('.jpeg')
		);

		// For upcoming, we might or might not have an audio preview
		const audioFile = files.find(
			(file) =>
				file.Key?.endsWith('.mp3') ||
				file.Key?.endsWith('.wav') ||
				file.Key?.endsWith('.m4a')
		);

		if (!coverFile?.Key) return null;

		// Try to find a text file with metadata
		const metaFile = files.find((file) => file.Key?.endsWith('.txt'));
		let releaseDate = '';
		let title = 'Coming Soon';

		if (metaFile?.Key) {
			try {
				// Get the metadata file content
				const metaCommand = new GetObjectCommand({
					Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
					Key: metaFile.Key,
				});

				const { Body } = await s3Client.send(metaCommand);
				const metaContent = await Body?.transformToString();

				if (metaContent) {
					// Parse simple metadata - example format: "Release Date: 2024-12-31\nTitle: My New Album"
					const dateMatch = metaContent.match(
						/Release Date:\s*(\d{4}-\d{2}-\d{2})/i
					);
					if (dateMatch && dateMatch[1]) releaseDate = dateMatch[1];

					const titleMatch = metaContent.match(/Title:\s*([^\n]+)/i);
					if (titleMatch && titleMatch[1]) title = titleMatch[1].trim();
				}
			} catch (err) {
				console.error('Error parsing metadata file:', err);
			}
		}

		if (!releaseDate) {
			// Default to 30 days in the future if no date provided
			const futureDate = new Date();
			futureDate.setDate(futureDate.getDate() + 30);
			releaseDate = futureDate.toISOString().split('T')[0];
		}

		const release = {
			id: 'upcoming-release',
			title: title,
			artist: 'DRIP SIFU',
			coverKey: coverFile.Key,
			releaseDate: releaseDate,
			key: audioFile?.Key || '', // May be empty if no audio preview
		};

		// Get pre-signed URLs and cache the release
		const coverUrl = await getSignedUrl(
			s3Client,
			new GetObjectCommand({
				Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
				Key: coverFile.Key,
			}),
			{ expiresIn: 3600 }
		);

		let audioUrl;
		if (audioFile?.Key) {
			audioUrl = await getSignedUrl(
				s3Client,
				new GetObjectCommand({
					Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
					Key: audioFile.Key,
				}),
				{ expiresIn: 3600 }
			);
		}

		// Cache the release
		audioCache
			.cacheRelease(release, coverUrl, audioUrl)
			.catch((err) =>
				console.error(`Failed to cache upcoming release: ${err}`)
			);

		return release;
	} catch (error) {
		console.error('Error getting upcoming release:', error);
		return null;
	}
}
