import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
	Play,
	Pause,
	SkipBack,
	SkipForward,
	Volume2,
	ShoppingCart,
	ChevronLeft,
	ChevronRight,
	Calendar,
	Music,
	Clock,
} from 'lucide-react';
import {
	getPresignedUrl,
	scanMusicLibrary,
	Album,
	Song,
	getPresignedCoverUrl,
	cacheEntireAlbum,
	getLatestRelease,
	getUpcomingRelease,
	Release,
} from '../service/presignedUrlService';
import { audioCache } from '../service/cacheService';

// Define keys for localStorage
const STORAGE_KEYS = {
	CURRENT_ALBUM_ID: 'music_player_current_album_id',
	CURRENT_SONG_ID: 'music_player_current_song_id',
	CURRENT_TIME: 'music_player_current_time',
	VOLUME: 'music_player_volume',
	CURRENT_ALBUM_INDEX: 'music_player_album_index',
};

const MusicPlayer = () => {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentAlbumIndex, setCurrentAlbumIndex] = useState(0);
	const [currentSongIndex, setCurrentSongIndex] = useState(0);
	const [progress, setProgress] = useState(0);
	const [volume, setVolume] = useState(0.7);
	const [duration, setDuration] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [albums, setAlbums] = useState<Album[]>([]);
	const [songs, setSongs] = useState<Song[]>([]);
	const [currentSong, setCurrentSong] = useState<Song | null>(null);
	const [audioUrl, setAudioUrl] = useState<string | null>(null);
	const [coverUrl, setCoverUrl] = useState<string | null>(null);
	const [albumCovers, setAlbumCovers] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState(true);
	const [stateRestored, setStateRestored] = useState(false);
	const [latestRelease, setLatestRelease] = useState<Release | null>(null);
	const [upcomingRelease, setUpcomingRelease] = useState<Release | null>(null);
	const [latestCoverUrl, setLatestCoverUrl] = useState<string | null>(null);
	const [upcomingCoverUrl, setUpcomingCoverUrl] = useState<string | null>(null);

	const audioRef = useRef<HTMLAudioElement>(null);
	console.log(latestCoverUrl, '??');
	// Calculate visible albums here, before any useEffect that depends on it
	const getVisibleAlbums = () => {
		return albums.slice(currentAlbumIndex, currentAlbumIndex + 3);
	};

	// Save state to localStorage
	const saveStateToStorage = () => {
		if (currentSong) {
			localStorage.setItem(STORAGE_KEYS.CURRENT_SONG_ID, currentSong.id);
			const album = albums.find((a) => a.title === currentSong.album);
			if (album) {
				localStorage.setItem(STORAGE_KEYS.CURRENT_ALBUM_ID, album.id);
			}
		}

		if (audioRef.current) {
			localStorage.setItem(
				STORAGE_KEYS.CURRENT_TIME,
				audioRef.current.currentTime.toString()
			);
		}

		localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
		localStorage.setItem(
			STORAGE_KEYS.CURRENT_ALBUM_INDEX,
			currentAlbumIndex.toString()
		);
	};

	// Save state when component unmounts or page refreshes
	useEffect(() => {
		const handleBeforeUnload = () => {
			saveStateToStorage();
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		};
	}, [currentSong, volume, currentAlbumIndex, currentTime]);

	// Also save state periodically during playback
	useEffect(() => {
		const saveInterval = setInterval(() => {
			if (isPlaying && audioRef.current) {
				localStorage.setItem(
					STORAGE_KEYS.CURRENT_TIME,
					audioRef.current.currentTime.toString()
				);
			}
		}, 5000); // Save every 5 seconds during playback

		return () => clearInterval(saveInterval);
	}, [isPlaying]);

	// Load data by scanning S3 bucket
	useEffect(() => {
		// Initialize audio cache
		audioCache
			.init()
			.catch((err) => console.error('Failed to initialize audio cache:', err));

		// Load music library
		const loadData = async () => {
			setIsLoading(true);
			try {
				// Scan S3 to build music library
				const {
					albums: foundAlbums,
					songs: foundSongs,
				} = await scanMusicLibrary();

				setAlbums(foundAlbums);
				setSongs(foundSongs);

				// Restore saved state if available
				const savedAlbumId = localStorage.getItem(
					STORAGE_KEYS.CURRENT_ALBUM_ID
				);
				const savedSongId = localStorage.getItem(STORAGE_KEYS.CURRENT_SONG_ID);
				const savedTime = localStorage.getItem(STORAGE_KEYS.CURRENT_TIME);
				const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
				const savedAlbumIndex = localStorage.getItem(
					STORAGE_KEYS.CURRENT_ALBUM_INDEX
				);

				if (savedAlbumIndex) {
					const parsedIndex = parseInt(savedAlbumIndex, 10);
					if (
						!isNaN(parsedIndex) &&
						parsedIndex >= 0 &&
						parsedIndex < foundAlbums.length
					) {
						setCurrentAlbumIndex(parsedIndex);
					}
				} else if (savedAlbumId) {
					// If we have a saved album ID but no index, find the correct index
					const albumIndex = foundAlbums.findIndex(
						(a) => a.id === savedAlbumId
					);
					if (albumIndex >= 0) {
						// Set the album index to show the correct album in the carousel
						const carouselIndex = Math.floor(albumIndex / 3) * 3; // Align to groups of 3
						setCurrentAlbumIndex(carouselIndex);
					}
				}

				// Restore volume
				if (savedVolume) {
					const parsedVolume = parseFloat(savedVolume);
					if (!isNaN(parsedVolume)) {
						setVolume(parsedVolume);
						if (audioRef.current) {
							audioRef.current.volume = parsedVolume;
						}
					}
				}

				// Restore album index
				if (savedAlbumIndex) {
					const parsedIndex = parseInt(savedAlbumIndex, 10);
					if (
						!isNaN(parsedIndex) &&
						parsedIndex >= 0 &&
						parsedIndex < foundAlbums.length
					) {
						setCurrentAlbumIndex(parsedIndex);
					}
				}

				// Restore current song and playback position
				if (savedSongId) {
					const songIndex = foundSongs.findIndex((s) => s.id === savedSongId);
					if (songIndex >= 0) {
						setCurrentSongIndex(songIndex);
						setCurrentSong(foundSongs[songIndex]);

						// Restore playback time
						if (savedTime) {
							const parsedTime = parseFloat(savedTime);
							if (!isNaN(parsedTime)) {
								setCurrentTime(parsedTime);
								// We'll set the actual time on the audio element later
								// after the audio source is loaded
							}
						}
					} else if (foundSongs.length > 0) {
						// Fallback if saved song not found
						setCurrentSong(foundSongs[0]);
					}
				} else if (foundSongs.length > 0) {
					// No saved state, start with first song
					setCurrentSong(foundSongs[0]);
				}

				setStateRestored(true);
			} catch (error) {
				console.error('Error loading music library:', error);
				if (songs.length > 0) {
					setCurrentSong(songs[0]);
				}
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, []);

	// Get cover image URL for current song
	useEffect(() => {
		const loadCoverUrl = async () => {
			if (!currentSong) return;

			const album = albums.find((a) => a.title === currentSong.album);
			if (!album?.coverKey) return;

			try {
				// Get pre-signed URL for the cover
				const url = await getPresignedCoverUrl(album);
				setCoverUrl(url);

				// Save state when current song changes
				saveStateToStorage();
			} catch (error) {
				console.error('Error getting cover URL:', error);
			}
		};

		loadCoverUrl();
	}, [currentSong, albums]);

	// Load cover images for visible albums in carousel
	useEffect(() => {
		const loadAlbumCovers = async () => {
			const visibleAlbums = getVisibleAlbums();
			if (visibleAlbums.length === 0) return;

			const newAlbumCovers = { ...albumCovers };
			let updated = false;

			for (const album of visibleAlbums) {
				// Skip if we already have the cover URL
				if (newAlbumCovers[album.id]) continue;

				try {
					// Use the same method as the main cover loading
					const url = await getPresignedCoverUrl(album);
					newAlbumCovers[album.id] = url;
					updated = true;
				} catch (error) {
					console.error(`Error loading cover for album ${album.title}:`, error);
				}
			}

			if (updated) {
				setAlbumCovers(newAlbumCovers);
			}
		};

		loadAlbumCovers();
	}, [currentAlbumIndex, albums, albumCovers]);

	// Load audio URL when song changes
	useEffect(() => {
		const loadAudioUrl = async () => {
			if (!currentSong) return;

			const album = albums.find((a) => a.title === currentSong.album);
			if (!album) return;

			try {
				// Get pre-signed URL for the audio
				const url = await getPresignedUrl(currentSong.key, album.id);
				setAudioUrl(url);
			} catch (error) {
				console.error('Error getting audio URL:', error);
			}
		};

		loadAudioUrl();
	}, [currentSong, albums]);

	useEffect(() => {
		const initiateAlbumCaching = async () => {
			if (!currentSong) return;

			const album = albums.find((a) => a.title === currentSong.album);
			if (!album) return;

			// Cache the entire album when a song from it is played
			cacheEntireAlbum(album).catch((err) =>
				console.error(`Failed to cache album ${album.title}:`, err)
			);
		};

		initiateAlbumCaching();
	}, [currentSong, albums]);

	// Update audio source when URL changes (but only when URL actually changes)
	useEffect(() => {
		if (audioRef.current && audioUrl) {
			// Only set src and reload if the URL has changed
			if (audioRef.current.src !== audioUrl) {
				// Remember current play position and state
				const wasPlaying = !audioRef.current.paused;

				// Set new source
				audioRef.current.src = audioUrl;

				// Load audio to get duration
				audioRef.current.load();

				// Resume playback if it was playing before
				if (wasPlaying || isPlaying) {
					audioRef.current.play().catch((err) => console.error(err));
				}
			}
		}
	}, [audioUrl]);

	useEffect(() => {
		// Load latest and upcoming releases
		const loadReleases = async () => {
			try {
				// Get latest release
				const latest = await getLatestRelease();
				if (latest) {
					setLatestRelease(latest);

					// Try to get cover URL from cache first
					const cachedCoverUrl = await audioCache.getReleaseCoverUrl(latest.id);
					if (cachedCoverUrl) {
						setLatestCoverUrl(cachedCoverUrl);
					} else {
						// If not in cache, get a fresh pre-signed URL
						try {
							const url = await getPresignedCoverUrl({
								id: latest.id,
								title: latest.title,
								artist: latest.artist,
								coverKey: latest.coverKey,
								songs: [],
							});
							setLatestCoverUrl(url);
						} catch (err) {
							console.error('Error getting latest release cover:', err);
						}
					}
				}

				// Get upcoming release
				const upcoming = await getUpcomingRelease();
				if (upcoming) {
					setUpcomingRelease(upcoming);

					// Try to get cover URL from cache first
					const cachedCoverUrl = await audioCache.getReleaseCoverUrl(
						upcoming.id
					);
					if (cachedCoverUrl) {
						setUpcomingCoverUrl(cachedCoverUrl);
					} else {
						// If not in cache, get a fresh pre-signed URL
						try {
							const url = await getPresignedCoverUrl({
								id: upcoming.id,
								title: upcoming.title,
								artist: upcoming.artist,
								coverKey: upcoming.coverKey,
								songs: [],
							});
							setUpcomingCoverUrl(url);
						} catch (err) {
							console.error('Error getting upcoming release cover:', err);
						}
					}
				}
			} catch (error) {
				console.error('Error loading releases:', error);
			}
		};

		loadReleases();
	}, []);

	const playLatestRelease = async () => {
		if (!latestRelease || !latestRelease.key) return;

		// Try to get the audio from cache first
		const cachedAudioUrl = await audioCache.getReleaseAudioUrl(
			latestRelease.id
		);

		// Create a temporary song object
		const latestSong = {
			id: 'latest-song',
			title: latestRelease.title,
			artist: latestRelease.artist,
			key: latestRelease.key,
			duration: 0,
			album: 'Latest Release',
		};

		// Set as current song
		setCurrentSongIndex(-1); // -1 to indicate it's not from the regular songs array
		setCurrentSong(latestSong);

		// If we have a cached audio URL, use it directly
		if (cachedAudioUrl) {
			if (audioRef.current) {
				audioRef.current.src = cachedAudioUrl;
				audioRef.current.load();
				audioRef.current.play().catch((err) => console.error(err));
				setIsPlaying(true);
			}
		} else {
			// Otherwise, the audio element will load from S3 via getPresignedUrl
			setIsPlaying(true);
		}
	};

	// Add a function for playing upcoming release previews
	const playUpcomingPreview = async () => {
		if (!upcomingRelease || !upcomingRelease.key) return;

		// Try to get the audio from cache first
		const cachedAudioUrl = await audioCache.getReleaseAudioUrl(
			upcomingRelease.id
		);

		// Create a temporary song object
		const previewSong = {
			id: 'upcoming-preview',
			title: `${upcomingRelease.title} (Preview)`,
			artist: upcomingRelease.artist,
			key: upcomingRelease.key,
			duration: 0,
			album: 'Coming Soon',
		};

		// Set as current song
		setCurrentSongIndex(-1); // -1 to indicate it's not from the regular songs array
		setCurrentSong(previewSong);

		// If we have a cached audio URL, use it directly
		if (cachedAudioUrl) {
			if (audioRef.current) {
				audioRef.current.src = cachedAudioUrl;
				audioRef.current.load();
				audioRef.current.play().catch((err) => console.error(err));
				setIsPlaying(true);
			}
		} else {
			// Otherwise, the audio element will load from S3 via getPresignedUrl
			setIsPlaying(true);
		}
	};
	// Update song duration when metadata is loaded
	const handleMetadataLoaded = () => {
		if (audioRef.current) {
			setDuration(audioRef.current.duration);

			// Update the duration in the currentSong
			if (currentSong) {
				const updatedSong = {
					...currentSong,
					duration: audioRef.current.duration,
				};
				setCurrentSong(updatedSong);

				// This is the best place to restore the playback position
				// because the audio is fully loaded at this point
				if (stateRestored) {
					const savedTime = localStorage.getItem(STORAGE_KEYS.CURRENT_TIME);
					if (savedTime) {
						const parsedTime = parseFloat(savedTime);
						if (!isNaN(parsedTime) && parsedTime > 0) {
							audioRef.current.currentTime = parsedTime;
							setCurrentTime(parsedTime);
						}
					}
					setStateRestored(false); // Reset so we don't do this again
				}
			}
		}
	};

	// Handle play/pause
	const togglePlay = () => {
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause();
			} else {
				audioRef.current.play().catch((err) => console.error(err));
			}
			setIsPlaying(!isPlaying);
		}
	};

	// Handle next track
	const nextTrack = () => {
		if (songs.length === 0) return;

		const newIndex = (currentSongIndex + 1) % songs.length;
		setCurrentSongIndex(newIndex);
		setCurrentSong(songs[newIndex]);
		setProgress(0);
		setCurrentTime(0);
	};

	// Handle previous track
	const prevTrack = () => {
		if (songs.length === 0) return;

		// If we're more than 3 seconds into the song, restart it
		if (currentTime > 3) {
			if (audioRef.current) {
				audioRef.current.currentTime = 0;
				setCurrentTime(0);
				setProgress(0);
			}
			return;
		}

		const newIndex = (currentSongIndex - 1 + songs.length) % songs.length;
		setCurrentSongIndex(newIndex);
		setCurrentSong(songs[newIndex]);
		setProgress(0);
		setCurrentTime(0);
	};

	// Handle time update
	const handleTimeUpdate = () => {
		if (audioRef.current) {
			const current = audioRef.current.currentTime;
			const duration = audioRef.current.duration || 0;
			setCurrentTime(current);
			setProgress(duration > 0 ? (current / duration) * 100 : 0);
		}
	};

	// Handle manual seek in progress bar
	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!audioRef.current || !duration) return;

		const progressBar = e.currentTarget;
		const bounds = progressBar.getBoundingClientRect();
		const x = e.clientX - bounds.left;
		const width = bounds.width;
		const percentage = x / width;

		const newTime = percentage * duration;
		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
		setProgress(percentage * 100);
	};

	// Handle volume change
	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = parseFloat(e.target.value);
		setVolume(newVolume);
		if (audioRef.current) {
			audioRef.current.volume = newVolume;
		}

		// Save volume to localStorage
		localStorage.setItem(STORAGE_KEYS.VOLUME, newVolume.toString());
	};

	// Album carousel navigation
	const nextSlide = () => {
		const newIndex =
			currentAlbumIndex + 3 >= albums.length ? 0 : currentAlbumIndex + 3;
		setCurrentAlbumIndex(newIndex);
		localStorage.setItem(STORAGE_KEYS.CURRENT_ALBUM_INDEX, newIndex.toString());
	};

	const prevSlide = () => {
		const newIndex =
			currentAlbumIndex - 3 < 0
				? Math.max(0, albums.length - 3)
				: currentAlbumIndex - 3;
		setCurrentAlbumIndex(newIndex);
		localStorage.setItem(STORAGE_KEYS.CURRENT_ALBUM_INDEX, newIndex.toString());
	};

	// Handle album selection from the carousel
	const selectAlbum = (album: Album) => {
		if (album.songs.length > 0) {
			const firstSong = album.songs[0];
			const songIndex = songs.findIndex((s) => s.id === firstSong.id);
			if (songIndex >= 0) {
				setCurrentSongIndex(songIndex);
				setCurrentSong(songs[songIndex]);
				setIsPlaying(true);

				// Cache the entire album when it's selected
				cacheEntireAlbum(album).catch((err) =>
					console.error(`Failed to cache album ${album.title}:`, err)
				);

				// Save selected album to localStorage
				localStorage.setItem(STORAGE_KEYS.CURRENT_ALBUM_ID, album.id);
				localStorage.setItem(STORAGE_KEYS.CURRENT_SONG_ID, firstSong.id);
			}
		}
	};

	// Format time (seconds to MM:SS)
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
	};

	if (isLoading) {
		return (
			<div className='w-full max-w-3xl mx-auto bg-opacity-20 backdrop-blur-lg rounded-xl neon-border p-6 flex items-center justify-center'>
				<p className='text-[#00f3ff] text-xl'>Loading your music...</p>
			</div>
		);
	}

	// Calculate visible albums for rendering
	const visibleAlbums = getVisibleAlbums();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			className='w-full max-w-6xl mx-auto flex gap-6'
		>
			{/* Latest Release Box - Left Side */}
			<motion.div
				initial={{ opacity: 0, x: -20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: 0.2 }}
				className='w-1/4 self-start bg-opacity-20 backdrop-blur-lg rounded-xl neon-border p-4 flex flex-col'
			>
				<h3 className='text-[#00f3ff] text-lg font-bold mb-3'>
					Latest Release
				</h3>

				{latestRelease && (
					<>
						<div className='aspect-square rounded-lg neon-border overflow-hidden mb-3'>
							{latestCoverUrl ? (
								<img
									src={latestCoverUrl} // Make sure we're using the state variable here
									alt='Latest Release'
									className='w-full h-full object-cover'
								/>
							) : (
								<div className='w-full h-full bg-[#001530] flex items-center justify-center'>
									<Music className='text-[#00f3ff]' />
								</div>
							)}
						</div>

						<h4 className='text-white text-sm font-semibold truncate'>
							{latestRelease.title}
						</h4>
						<p className='text-[#00f3ff] text-xs mb-2'>
							{latestRelease.artist}
						</p>

						<div className='flex items-center text-xs text-[#00f3ff] mb-2'>
							<Calendar size={12} className='mr-1' />
							<span>
								Released:{' '}
								{new Date(latestRelease.releaseDate).toLocaleDateString()}
							</span>
						</div>

						{latestRelease.key && (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className='mt-auto bg-[#00f3ff33] text-[#00f3ff] px-2 py-1 rounded-full text-xs hover-glow'
								onClick={playLatestRelease}
							>
								<Play size={12} className='inline mr-1' />
								Listen Now
							</motion.button>
						)}
					</>
				)}

				{!latestRelease && (
					<div className='flex-1 flex items-center justify-center text-[#00f3ff] text-sm'>
						No latest release found
					</div>
				)}
			</motion.div>

			{/* Main Player - Center */}
			<motion.div className='w-1/2 bg-opacity-20 backdrop-blur-lg rounded-xl neon-border p-6'>
				{/* Hidden audio element */}
				<audio
					ref={audioRef}
					onTimeUpdate={handleTimeUpdate}
					onEnded={nextTrack}
					onPlay={() => setIsPlaying(true)}
					onPause={() => setIsPlaying(false)}
					onLoadedMetadata={handleMetadataLoaded}
				/>

				<div className='flex flex-col items-center'>
					{/* Album Art */}
					<motion.div
						className='w-64 h-64 rounded-lg neon-border overflow-hidden mb-8'
						whileHover={{ scale: 1.02 }}
					>
						{coverUrl ? (
							<img
								src={coverUrl}
								alt='Album Cover'
								className='w-full h-full object-cover'
							/>
						) : (
							<div className='w-full h-full bg-[#001530] flex items-center justify-center'>
								<p className='text-[#00f3ff]'>No Cover</p>
							</div>
						)}
					</motion.div>

					{/* Track Info */}
					<div className='text-center mb-8'>
						<h2 className='text-2xl font-bold neon-text mb-2'>
							{currentSong?.title || 'No track selected'}
						</h2>
						<p className='text-[#00f3ff] opacity-80'>
							{currentSong?.artist || ''}
						</p>
					</div>

					{/* Controls */}
					<div className='flex items-center justify-center space-x-6 mb-8'>
						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							className='text-[#00f3ff] hover-glow'
							onClick={prevTrack}
						>
							<SkipBack size={24} />
						</motion.button>

						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							className='bg-[#00f3ff] text-black p-4 rounded-full hover-glow'
							onClick={togglePlay}
							disabled={!currentSong}
						>
							{isPlaying ? <Pause size={24} /> : <Play size={24} />}
						</motion.button>

						<motion.button
							whileHover={{ scale: 1.1 }}
							whileTap={{ scale: 0.95 }}
							className='text-[#00f3ff] hover-glow'
							onClick={nextTrack}
						>
							<SkipForward size={24} />
						</motion.button>
					</div>

					{/* Progress Bar */}
					<div className='w-full mb-2'>
						<div className='flex justify-between text-xs text-[#00f3ff] mb-1'>
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(duration)}</span>
						</div>
						<div
							className='w-full h-1 bg-[#00f3ff33] rounded-full mb-8 cursor-pointer'
							onClick={handleSeek}
						>
							<motion.div
								className='h-full bg-[#00f3ff] rounded-full'
								style={{ width: `${progress}%` }}
								whileHover={{ scale: 1.5, translateY: -2 }}
							/>
						</div>
					</div>

					{/* Volume and Purchase */}
					<div className='flex items-center justify-between w-full mb-8'>
						<div className='flex items-center'>
							<Volume2 className='text-[#00f3ff] mr-2' />
							<input
								type='range'
								min='0'
								max='1'
								step='0.01'
								value={volume}
								onChange={handleVolumeChange}
								className='w-24 accent-[#00f3ff]'
							/>
						</div>

						<motion.button
							whileHover={{ scale: 1.05, color: '#ff9000' }}
							whileTap={{ scale: 0.95 }}
							className='flex items-center bg-[#00f3ff33] text-[#00f3ff] px-4 py-2 rounded-full hover-glow'
						>
							<ShoppingCart className='mr-2' />
							Purchase Track
						</motion.button>
					</div>

					{/* Album Carousel */}
					{albums.length > 0 && (
						<div className='w-full'>
							<div className='flex items-center justify-between mb-4'>
								<h3 className='text-[#00f3ff] text-lg'>More Albums</h3>
								<div className='flex gap-2'>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={prevSlide}
										className='text-[#00f3ff] hover-glow p-1'
									>
										<ChevronLeft size={20} />
									</motion.button>
									<motion.button
										whileHover={{ scale: 1.1 }}
										whileTap={{ scale: 0.95 }}
										onClick={nextSlide}
										className='text-[#00f3ff] hover-glow p-1'
									>
										<ChevronRight size={20} />
									</motion.button>
								</div>
							</div>

							<div className='flex justify-between gap-4'>
								{visibleAlbums.map((album) => (
									<motion.div
										key={album.id}
										className='relative w-1/3 aspect-square rounded-lg overflow-hidden neon-border cursor-pointer'
										whileHover={{ scale: 1.05 }}
										transition={{ type: 'spring', stiffness: 300 }}
										onClick={() => selectAlbum(album)}
									>
										<img
											src={albumCovers[album.id] || ''}
											alt={album.title}
											className='w-full h-full object-cover'
										/>
										<div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 backdrop-blur-sm p-2'>
											<p className='text-white text-sm font-semibold truncate'>
												{album.title}
											</p>
											<p className='text-[#00f3ff] text-xs truncate'>
												{album.artist}
											</p>
										</div>
									</motion.div>
								))}
							</div>
						</div>
					)}

					{albums.length === 0 && (
						<div className='text-center text-[#00f3ff] mt-4'>
							<p>No albums found. Upload some music to your S3 bucket.</p>
						</div>
					)}
				</div>
			</motion.div>

			{/* Upcoming Release Box - Right Side */}
			<motion.div
				initial={{ opacity: 0, x: 20 }}
				animate={{ opacity: 1, x: 0 }}
				transition={{ delay: 0.4 }}
				className='w-1/4 self-start bg-opacity-20 backdrop-blur-lg rounded-xl neon-border p-4 flex flex-col'
			>
				<h3 className='text-[#00f3ff] text-lg font-bold mb-3'>Coming Soon</h3>

				{upcomingRelease && (
					<>
						<div className='aspect-square rounded-lg neon-border overflow-hidden mb-3'>
							{upcomingCoverUrl ? (
								<img
									src={upcomingCoverUrl} // Use the state variable here
									alt='Upcoming Release'
									className='w-full h-full object-cover'
								/>
							) : (
								<div className='w-full h-full bg-[#001530] flex items-center justify-center'>
									<Music className='text-[#00f3ff]' />
								</div>
							)}
						</div>

						<h4 className='text-white text-sm font-semibold truncate'>
							{upcomingRelease.title}
						</h4>
						<p className='text-[#00f3ff] text-xs mb-2'>
							{upcomingRelease.artist}
						</p>

						<div className='flex items-center text-xs text-[#00f3ff] mb-2'>
							<Clock size={12} className='mr-1' />
							<span>
								Drops:{' '}
								{new Date(upcomingRelease.releaseDate).toLocaleDateString()}
							</span>
						</div>

						{upcomingRelease.key ? (
							<motion.button
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								className='mt-auto bg-[#00f3ff33] text-[#00f3ff] px-2 py-1 rounded-full text-xs hover-glow'
								onClick={playUpcomingPreview}
							>
								<Play size={12} className='inline mr-1' />
								Preview
							</motion.button>
						) : (
							<motion.button
								className='mt-auto bg-[#00f3ff19] text-[#00f3ff88] px-2 py-1 rounded-full text-xs cursor-not-allowed'
								disabled
							>
								Music Coming Soon
							</motion.button>
						)}
					</>
				)}

				{!upcomingRelease && (
					<div className='flex-1 flex items-center justify-center text-[#00f3ff] text-sm'>
						No upcoming releases
					</div>
				)}
			</motion.div>
		</motion.div>
	);
};

export default MusicPlayer;
