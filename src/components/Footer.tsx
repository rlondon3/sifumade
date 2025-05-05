import { motion } from 'framer-motion';
import {
	Instagram,
	Youtube,
	Music2,
	ChevronRight,
	AlertCircle,
	FileText,
	Facebook,
} from 'lucide-react';

const Footer = () => {
	// const [email, setEmail] = useState('');
	const currentYear = new Date().getFullYear();
	const socialLinks = [
		{
			icon: <Instagram size={24} />,
			href: 'https://www.instagram.com/dripsifu/',
			label: 'Instagram',
		},
		{
			icon: <Facebook size={24} />,
			href: 'https://www.facebook.com/dripsifuofficial/',
			label: 'Facebook',
		},
		{
			icon: <Youtube size={24} />,
			href: 'https://www.youtube.com/channel/UCI6FyzuUZrrYtUwYuExjZgA',
			label: 'YouTube',
		},
	];

	const licenseTypes = [
		{
			type: 'Basic',
			price: '$29.99',
			features: ['MP3 Format', 'Personal Use', 'No Commercial Rights'],
		},
		{
			type: 'Premium',
			price: '$99.99',
			features: ['WAV + MP3', 'Commercial Use'],
		},
		{
			type: 'Exclusive',
			price: '$299.99',
			features: ['All Formats', 'Full Rights'],
		},
	];

	const testimonials = [
		{
			name: 'Keez',
			text: 'These beats took my tracks to the next level! 🔥',
			image:
				'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
		},
		{
			name: 'Allen Wave',
			text: 'Best producer in the game!',
			image:
				'https://images.pexels.com/photos/2531553/pexels-photo-2531553.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
		},
	];

	// const handleSubmit = (e: React.FormEvent) => {
	// 	e.preventDefault();
	// 	// Handle newsletter signup
	// 	setEmail('');
	// };

	return (
		<footer className='bg-[#000919] border-t border-[#00f3ff33] pt-16 pb-8'>
			<div className='container mx-auto px-4'>
				{/* Main Footer Content */}
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12'>
					{/* Contact & Social */}
					<div>
						<h3 className='text-[#00f3ff] text-xl font-bold mb-6'>
							Connect With Us
						</h3>
						<div className='flex space-x-4 mb-6'>
							{socialLinks.map((social, index) => (
								<motion.a
									key={index}
									href={social.href}
									whileHover={{ scale: 1.2, color: '#ff9000' }}
									className='text-[#00f3ff] hover-glow'
									aria-label={social.label}
									target='_blank'
									rel='noopener noreferrer'
								>
									{social.icon}
								</motion.a>
							))}
						</div>
						<p className='text-[#00f3ff99] mb-4'>Contact: dripsifu@gmail.com</p>
					</div>

					{/* Licensing Options */}
					<div className='lg:col-span-2'>
						<h3 className='text-[#00f3ff] text-xl font-bold mb-6'>
							Licensing Options Available
						</h3>
						<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
							{licenseTypes.map((license, index) => (
								<motion.div
									key={index}
									className='bg-[#00f3ff10] p-4 rounded-lg neon-border'
									whileHover={{ scale: 1.02 }}
								>
									<h4 className='text-[#00f3ff] font-bold mb-2'>
										{license.type}
									</h4>
									<p className='text-2xl font-bold mb-4 neon-text'>
										{license.price}
									</p>
									<ul className='text-[#00f3ff99] text-sm'>
										{license.features.map((feature, i) => (
											<li key={i} className='flex items-center mb-2'>
												<ChevronRight size={16} className='mr-2' />
												{feature}
											</li>
										))}
									</ul>
								</motion.div>
							))}
						</div>
					</div>

					{/* Newsletter Signup */}
					<div>
						<h3 className='text-[#00f3ff] text-xl font-bold mb-6'>
							Beat Inquire
						</h3>
						{/* <form onSubmit={handleSubmit} className='mb-6'>
							<div className='relative'>
								<input
									type='email'
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder='Enter your email'
									className='w-full bg-[#00f3ff10] border border-[#00f3ff33] rounded-lg px-4 py-2 text-white placeholder-[#00f3ff66] focus:outline-none focus:border-[#00f3ff] focus:ring-1 focus:ring-[#00f3ff]'
								/>
								<motion.button
									type='submit'
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
									className='absolute right-2 top-1/2 -translate-y-1/2 text-[#00f3ff] hover-glow'
								>
									<Send size={20} />
								</motion.button>
							</div>
						</form> */}

						{/* Custom Beat Request */}
						<motion.a
							href='mailto:dripsifu@gmail.com'
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className='w-full bg-[#00f3ff33] text-[#00f3ff] py-2 px-4 rounded-lg hover-glow flex items-center justify-center mb-6'
						>
							<Music2 size={20} className='mr-2' />
							Request Custom Beat
						</motion.a>
					</div>
				</div>

				{/* Testimonials */}
				<div className='mb-12'>
					<h3 className='text-[#00f3ff] text-xl font-bold mb-6'>
						Artist Testimonials
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
						{testimonials.map((testimonial, index) => (
							<motion.div
								key={index}
								className='bg-[#00f3ff10] p-6 rounded-lg flex items-center space-x-4'
								whileHover={{ scale: 1.02 }}
							>
								<img
									src={testimonial.image}
									alt={testimonial.name}
									className='w-12 h-12 rounded-full object-cover'
								/>
								<div>
									<p className='text-[#00f3ff] font-bold'>{testimonial.name}</p>
									<p className='text-[#00f3ff99]'>{testimonial.text}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>

				{/* Quick Links */}
				<div className='flex flex-wrap justify-between items-center py-6 border-t border-[#00f3ff33]'>
					<div className='flex space-x-6 text-sm text-[#00f3ff99]'>
						<motion.a
							href='/terms'
							whileHover={{ color: '#00f3ff' }}
							className='flex items-center'
						>
							<FileText size={16} className='mr-2' />
							Terms of Service
						</motion.a>
						<motion.a
							href='/faq'
							whileHover={{ color: '#00f3ff' }}
							className='flex items-center'
						>
							<AlertCircle size={16} className='mr-2' />
							FAQ
						</motion.a>
					</div>
					<p className='text-[#00f3ff99] text-sm'>
						© {currentYear} SIFU MADE BEATS. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
