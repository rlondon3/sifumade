import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';

function App() {
	return (
		<div className='min-h-screen bg-[#000919] relative overflow-hidden'>
			{/* Grid Background */}
			<div className='fixed inset-0 grid-bg' />

			{/* Content */}
			<div className='relative z-10'>
				<Navbar />

				<Routes>
					<Route path='/' element={<Home />} />
					<Route path='/faq' element={<FAQ />} />
					<Route path='/terms' element={<Terms />} />
				</Routes>

				<Footer />
			</div>
		</div>
	);
}

export default App;
