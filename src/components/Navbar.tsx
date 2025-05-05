import React from 'react';
import { motion } from 'framer-motion';
import { Music, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
	return (
		<motion.nav
			initial={{ opacity: 0, y: -20 }}
			animate={{ opacity: 1, y: 0 }}
			className='fixed top-0 w-full bg-opacity-20 backdrop-blur-lg z-50 border-b border-[#00f3ff33]'
		>
			<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
				<div className='flex items-center justify-between h-16'>
					<motion.div
						className='flex items-center'
						whileHover={{ scale: 1.05 }}
					>
						<Link to='/' className='flex items-center'>
							<Radio className='h-8 w-8 text-[#00f3ff] mr-2' />
							<span className='text-[#00f3ff] font-bold text-xl'>
								SIFU MADE BEATS
							</span>
						</Link>
					</motion.div>

					<div className='flex space-x-8'>
						<motion.a
							href='https://music.apple.com/us/artist/drip-sifu/1690426896'
							className='hover-glow text-[#00f3ff] flex items-center'
							whileHover={{ scale: 1.1 }}
							target='_blank'
							rel='noopener noreferrer'
						>
							<Music className='mr-2' />
							Apple Music
						</motion.a>
						<motion.a
							href='https://open.spotify.com/artist/4fkq45bxU3yPRWqBaB9uVh'
							className='hover-glow text-[#00f3ff] flex items-center'
							whileHover={{ scale: 1.1 }}
							target='_blank'
							rel='noopener noreferrer'
						>
							<Music className='mr-2' />
							Spotify
						</motion.a>
					</div>
				</div>
			</div>
		</motion.nav>
	);
};

export default Navbar;
