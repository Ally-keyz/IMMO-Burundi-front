import { motion } from 'framer-motion';
import { Lottie } from 'lottie-react';
import homeAnimation from '../../assets/lottie/home.json';

export interface LoadingScreenProps {
  /** Optional preload progress 0–100. Omit for simple route transitions. */
  progress?: number;
}

export default function LoadingScreen({ progress }: LoadingScreenProps): JSX.Element {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-bg px-6 text-center"
      aria-label="Loading IMMO BURUNDI"
      role="status"
    >
      <Lottie src={homeAnimation} loop autoplay className="h-32 w-32 md:h-40 md:w-40" />
      <div>
        <p className="text-lg font-extrabold tracking-tight text-ink">IMMO BURUNDI</p>
        <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gray-400">Real Estate Marketplace</p>
      </div>
      {progress !== undefined ? (
        <div className="flex w-44 flex-col items-center gap-2">
          <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{progress}%</p>
        </div>
      ) : null}
    </motion.div>
  );
}