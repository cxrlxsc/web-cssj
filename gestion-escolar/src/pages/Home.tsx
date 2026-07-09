
// Ahora CASI TODOS llevan llaves porque usamos "export const" en los archivos:
import { Navbar } from '../components/layout/Navbar';
import { Stats } from '../components/home/Stats';
import { VideoInstitucional } from '../components/home/VideoInstitucional';
import { Features } from '../components/home/Features';
import { EducationLevels } from '../components/home/EducationLevels';
import { NewsPreview } from '../components/home/NewsPreview';

// Solo estos dos se quedaron con "export default":
import Footer from '../components/layout/Footer';
import Hero from '../components/home/Hero';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <Stats />
      <VideoInstitucional />
      <Features />
      <EducationLevels />
      <NewsPreview />
      <Footer />
    </div>
  );
}