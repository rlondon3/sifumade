import { motion } from 'framer-motion';
import {
	ArrowDown,
	FileText,
	Music2,
	Download,
	DollarSign,
	AlertCircle,
} from 'lucide-react';
import { useState } from 'react';

const FAQ = () => {
	const [openIndex, setOpenIndex] = useState<string | null>(null);

	const toggleFAQ = (index: string) => {
		setOpenIndex(openIndex === index ? null : index);
	};

	const faqCategories = [
		{
			title: 'Beat Licensing',
			icon: <FileText size={24} className='text-[#00f3ff]' />,
			questions: [
				{
					question: 'What types of licenses do you offer?',
					answer:
						'I offer three license types: Basic ($29.99, MP3 file, personal use only), Premium ($99.99, WAV files with trackouts, limited commercial use), and Exclusive ($299.99, full ownership transfer, unlimited commercial use). Each includes different rights and file formats.',
				},
				{
					question:
						"What's the difference between non-exclusive and exclusive licenses?",
					answer:
						'Non-exclusive licenses (Basic & Premium) allow me to continue selling the beat to others. An Exclusive license means I transfer ownership to you, remove it from my catalog, and you become the sole owner.',
				},
				{
					question: 'Do I need to credit you when using your beats?',
					answer:
						'Yes, all non-exclusive licenses require producer credit as "Prod. by Drip Sifu" in your title/description. Exclusive licenses recommend credit but don\'t require it.',
				},
			],
		},
		{
			title: 'Technical Questions',
			icon: <Download size={24} className='text-[#00f3ff]' />,
			questions: [
				{
					question: 'What file formats do your beats come in?',
					answer:
						'Basic licenses include 320kbps MP3 files. Premium licenses include WAV files and separated track stems. Exclusive licenses include all raw files in their highest quality.',
				},
				{
					question: 'How do I download my beats after purchase?',
					answer:
						"After completing your purchase, you'll receive an email with download links. Premium and Exclusive customers also get access to a private download area with all their purchased content.",
				},
				{
					question: 'Can I preview the full beat before purchasing?',
					answer:
						'All beats feature a preview with a producer tag. The full, untagged version is available after purchase according to your chosen license type.',
				},
			],
		},
		{
			title: 'Business Questions',
			icon: <DollarSign size={24} className='text-[#00f3ff]' />,
			questions: [
				{
					question: 'How do I request a custom beat?',
					answer:
						'Click the "Request Custom Beat" button to email me your requirements. Include your style preferences, reference tracks, and deadline.',
				},
				{
					question: 'Do you offer discounts for purchasing multiple beats?',
					answer:
						'Yes! Buy 2 beats and get 10% off, buy 5 beats and get 20% off, or buy 10+ beats and get 30% off your total order.',
				},
				{
					question: 'What payment methods do you accept?',
					answer: 'I accept Zelle, Venmo, & CashApp.',
				},
			],
		},
		{
			title: 'Rights & Usage',
			icon: <AlertCircle size={24} className='text-[#00f3ff]' />,
			questions: [
				{
					question: 'Can I use your beats on streaming platforms like Spotify?',
					answer:
						'Premium licenses allow for commercial streaming up to 100,000 streams. Exclusive licenses have unlimited streaming rights.',
				},
				{
					question: 'Can I use your beats in videos/content?',
					answer:
						'Basic licenses allow for non-monetized videos. Premium licenses allow for monetized videos with up to 50,000 views. Exclusive licenses have unlimited video usage rights.',
				},
				{
					question:
						'What happens if my song with your beat becomes successful?',
					answer:
						"With Basic and Premium licenses, we'll need to negotiate an upgrade if you exceed the stream/view limits. With an Exclusive license, you're covered regardless of success level.",
				},
			],
		},
	];

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
						Frequently Asked Questions
					</h1>
					<div className='h-1 w-24 bg-[#00f3ff33] mx-auto rounded-full'>
						<motion.div
							className='h-full w-1/2 bg-[#00f3ff] rounded-full'
							animate={{ x: [0, 24, 0] }}
							transition={{ repeat: Infinity, duration: 2 }}
						/>
					</div>
					<p className='text-[#00f3ff99] mt-6 max-w-2xl mx-auto'>
						Find answers to common questions about beat licensing, usage rights,
						and more. Can't find what you're looking for? Contact me directly at
						dripsifu@gmail.com
					</p>
				</motion.div>

				<motion.div
					variants={containerVariants}
					initial='hidden'
					animate='visible'
					className='grid grid-cols-1 md:grid-cols-2 gap-8 mb-16'
				>
					{faqCategories.map((category, categoryIndex) => (
						<motion.div
							key={categoryIndex}
							variants={itemVariants}
							className='bg-[#00f3ff10] p-6 rounded-lg border border-[#00f3ff33]'
						>
							<div className='flex items-center mb-6'>
								<div className='mr-4 p-2 bg-[#00f3ff10] rounded-lg'>
									{category.icon}
								</div>
								<h2 className='text-2xl font-bold text-[#00f3ff]'>
									{category.title}
								</h2>
							</div>

							<div className='space-y-4'>
								{category.questions.map((faq, faqIndex) => {
									const index = `${categoryIndex}-${faqIndex}`;
									return (
										<motion.div
											key={faqIndex}
											className='border border-[#00f3ff33] rounded-lg overflow-hidden bg-[#00f3ff10]'
											whileHover={{ scale: 1.01 }}
										>
											<motion.button
												className='w-full p-4 flex justify-between items-center text-left text-[#00f3ff]'
												onClick={() => toggleFAQ(index)}
												whileTap={{ scale: 0.98 }}
											>
												<span className='font-medium'>{faq.question}</span>
												<motion.div
													animate={{ rotate: openIndex === index ? 180 : 0 }}
													transition={{ duration: 0.3 }}
												>
													<ArrowDown size={20} className='text-[#00f3ff]' />
												</motion.div>
											</motion.button>

											<motion.div
												initial={{ height: 0, opacity: 0 }}
												animate={{
													height: openIndex === index ? 'auto' : 0,
													opacity: openIndex === index ? 1 : 0,
												}}
												transition={{
													duration: 0.3,
													opacity: { duration: 0.2 },
												}}
												className='overflow-hidden'
											>
												<div className='p-4 pt-0 text-[#00f3ff99] border-t border-[#00f3ff33]'>
													{faq.answer}
												</div>
											</motion.div>
										</motion.div>
									);
								})}
							</div>
						</motion.div>
					))}
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className='text-center'
				>
					<h3 className='text-2xl font-bold text-[#00f3ff] mb-6'>
						Still Have Questions?
					</h3>
					<motion.a
						href='mailto:dripsifu@gmail.com'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						className='inline-flex items-center justify-center px-8 py-3 bg-[#00f3ff33] text-[#00f3ff] rounded-lg hover-glow'
					>
						<Music2 size={20} className='mr-2' />
						Contact Me Directly
					</motion.a>
					<p className='text-[#00f3ff66] mt-8'>
						© {new Date().getFullYear()} SIFU MADE BEATS. All rights reserved.
					</p>
				</motion.div>
			</div>
		</div>
	);
};

export default FAQ;
