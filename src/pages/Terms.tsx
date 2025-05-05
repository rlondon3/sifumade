import { motion } from 'framer-motion';
import { FileText, Shield, Music, Info, User, Copy } from 'lucide-react';

const TermsOfServicePage = () => {
	const currentYear = new Date().getFullYear();

	// Animation variants
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: {
			y: 0,
			opacity: 1,
			transition: {
				type: 'spring',
				stiffness: 100,
			},
		},
	};

	const sections = [
		{
			icon: <Info size={24} className='text-[#00f3ff]' />,
			title: 'Introduction',
			content:
				"Welcome to SIFU MADE BEATS. By accessing this website, you accept and agree to be bound by these Terms of Service. This agreement constitutes a legally binding contract between you ('User,' 'you,' or 'your') and SIFU MADE BEATS ('we,' 'us,' or 'our'). If you do not agree with any part of these terms, please do not use our website.",
		},
		{
			icon: <Music size={24} className='text-[#00f3ff]' />,
			title: 'Website Usage',
			content:
				'Our website provides free streaming access to our music catalog that is also available on official platforms like Spotify and Apple Music. No account creation or subscription is required to access our content. All streaming is for personal, non-commercial use only. You may not download, reproduce, distribute, or create derivative works from our music without express written permission.',
		},
		{
			icon: <Copy size={24} className='text-[#00f3ff]' />,
			title: 'Intellectual Property',
			content:
				'All music, artwork, and content on this website are owned by SIFU MADE BEATS and are protected by copyright and other intellectual property laws. The use of our content on this website does not transfer any ownership rights to you. Any unauthorized use, reproduction, distribution, or modification of our content is strictly prohibited.',
		},
		{
			icon: <User size={24} className='text-[#00f3ff]' />,
			title: 'Custom Beat Inquiries',
			content:
				'Custom beat requests and pricing inquiries are handled via email at dripsifu@gmail.com. Any agreements made via email or phone constitute a separate contract between you and SIFU MADE BEATS. No purchases are processed directly through this website. We reserve the right to decline any request for custom beats at our sole discretion.',
		},
		{
			icon: <Shield size={24} className='text-[#00f3ff]' />,
			title: 'Limitation of Liability',
			content:
				"We provide the website and its content 'as is' without warranties of any kind, either express or implied. We do not guarantee that the website will be secure or free from errors or viruses. We will not be liable for any damages of any kind arising from the use of our website, including but not limited to direct, indirect, incidental, and consequential damages.",
		},
		{
			icon: <FileText size={24} className='text-[#00f3ff]' />,
			title: 'External Links',
			content:
				'Our website contains links to external platforms (Spotify, Apple Music, etc.). We are not responsible for the content, terms of service, or privacy policies on these external platforms. Users access third-party sites at their own risk and subject to the terms and conditions of those sites.',
		},
	];

	return (
		<div className='bg-[#000919] min-h-screen py-16'>
			<div className='container mx-auto px-4'>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className='text-center mb-16'
				>
					<h1 className='text-4xl md:text-5xl font-bold text-[#00f3ff] mb-4'>
						Terms of Service
					</h1>
					<div className='h-1 w-24 bg-[#00f3ff33] mx-auto rounded-full'>
						<motion.div
							className='h-full w-1/2 bg-[#00f3ff] rounded-full'
							animate={{ x: [0, 24, 0] }}
							transition={{ repeat: Infinity, duration: 2 }}
						/>
					</div>
					<p className='text-[#00f3ff99] mt-6 max-w-2xl mx-auto'>
						By accessing and using this website, you accept and agree to be
						bound by the terms and provisions of this agreement. Last updated:
						May 1, 2025
					</p>
				</motion.div>

				<motion.div
					variants={containerVariants}
					initial='hidden'
					animate='visible'
					className='max-w-4xl mx-auto space-y-8 mb-16'
				>
					{sections.map((section, index) => (
						<motion.div
							key={index}
							variants={itemVariants}
							className='bg-[#00f3ff10] p-6 rounded-lg border border-[#00f3ff33]'
						>
							<div className='flex items-center mb-4'>
								<div className='mr-4 p-2 bg-[#00f3ff10] rounded-lg'>
									{section.icon}
								</div>
								<h2 className='text-2xl font-bold text-[#00f3ff]'>
									{section.title}
								</h2>
							</div>
							<p className='text-[#00f3ff99] leading-relaxed'>
								{section.content}
							</p>
						</motion.div>
					))}

					<motion.div
						variants={itemVariants}
						className='bg-[#00f3ff10] p-6 rounded-lg border border-[#00f3ff33]'
					>
						<div className='flex items-center mb-4'>
							<div className='mr-4 p-2 bg-[#00f3ff10] rounded-lg'>
								<Info size={24} className='text-[#00f3ff]' />
							</div>
							<h2 className='text-2xl font-bold text-[#00f3ff]'>
								Contact Information
							</h2>
						</div>
						<p className='text-[#00f3ff99] leading-relaxed'>
							For questions regarding these Terms of Service or custom beat
							inquiries, please contact us at: dripsifu@gmail.com
						</p>
					</motion.div>

					<motion.div
						variants={itemVariants}
						className='bg-[#00f3ff10] p-6 rounded-lg border border-[#00f3ff33]'
					>
						<div className='flex items-center mb-4'>
							<div className='mr-4 p-2 bg-[#00f3ff10] rounded-lg'>
								<FileText size={24} className='text-[#00f3ff]' />
							</div>
							<h2 className='text-2xl font-bold text-[#00f3ff]'>
								Changes to Terms
							</h2>
						</div>
						<p className='text-[#00f3ff99] leading-relaxed'>
							We reserve the right to modify these Terms of Service at any time
							without prior notice. Your continued use of our website following
							any changes constitutes your acceptance of the revised terms.
						</p>
					</motion.div>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className='text-center'
				>
					<p className='text-[#00f3ff66] mt-8'>
						© {currentYear} SIFU MADE BEATS. All rights reserved.
					</p>
				</motion.div>
			</div>
		</div>
	);
};

export default TermsOfServicePage;
