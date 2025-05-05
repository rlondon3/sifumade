// src/services/musicService.ts
import {
	S3Client,
	GetObjectCommand,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

const s3Client = new S3Client({
	region: import.meta.env.VITE_AWS_REGION,
	credentials: {
		accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
		secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
	},
});

// Generate pre-signed URL
export async function getPresignedUrl(key: string): Promise<string> {
	const command = new GetObjectCommand({
		Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
		Key: key,
	});

	return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Scan S3 bucket to build music library
export async function scanMusicLibrary(): Promise<{
	albums: Album[];
	songs: Song[];
}> {
	try {
		// List all objects in the bucket
		const command = new ListObjectsV2Command({
			Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
			Delimiter: '/',
		});

		const response = await s3Client.send(command);

		// Get all album folders (assuming S3 structure: albums/album-name/...)
		const albumPrefixes = response.CommonPrefixes || [];

		// Storage for our found albums and songs
		const foundAlbums: Album[] = [];
		const foundSongs: Song[] = [];

		// Process each album folder
		for (const prefix of albumPrefixes) {
			if (!prefix.Prefix) continue;

			const albumPrefix = prefix.Prefix;
			const albumName = albumPrefix.replace('albums/', '').replace('/', '');

			// Get all files in this album folder
			const albumCommand = new ListObjectsV2Command({
				Bucket: import.meta.env.VITE_S3_BUCKET_NAME,
				Prefix: albumPrefix,
			});

			const albumResponse = await s3Client.send(albumCommand);
			const albumFiles = albumResponse.Contents || [];

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

		return { albums: foundAlbums, songs: foundSongs };
	} catch (error) {
		console.error('Error scanning music library:', error);
		return { albums: [], songs: [] };
	}
}
