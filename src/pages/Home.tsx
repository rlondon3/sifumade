import { motion } from 'framer-motion';
import MusicPlayer from '../components/MusicPlayer';

const Home = () => {
	return (
		<main className='container mx-auto px-4 pt-32 pb-16'>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 1 }}
				className='text-center mb-16'
			>
				<h1 className='text-4xl md:text-6xl font-bold neon-text mb-4'>
					You Have Entered Outer SpAsia
				</h1>
				<p className='text-[#00f3ff] text-xl opacity-80'>
					Where Hip Hop Enters 3rd Space
				</p>
				<p className='text-[#00f3ff] text-md neon-text italic opacity-80'>
					Music Produced by Drip Sifu
				</p>
			</motion.div>
			<MusicPlayer />
		</main>
	);
};

export default Home;
