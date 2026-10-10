import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1757356657991-c3fd6e2e812e?w=2400&q=80&auto=format&fit=crop';

const HERO_VIDEO_URL =
  '/assets/videos/vid-v2.mp4';

export default function HeroSection(): JSX.Element {
  const { t } = useLanguage();

  const cardRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start start', 'end start'] });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.9], [0, -36]);

  return (
    <section className="relative">
      <div ref={cardRef} className="hero-height relative flex flex-col overflow-hidden bg-slate-900">
        <video
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_IMAGE_URL}
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/30 to-transparent"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"
          aria-hidden="true"
        />

        <motion.div
          className="relative z-10 flex flex-1 flex-col justify-center gap-6 p-6 pb-[5.5rem] sm:p-10 sm:pb-24 md:pb-[7.5rem] desktop:gap-8 desktop:pb-10 desktop:pl-[120px] desktop:pr-16 desktop:pt-9"
          style={{ opacity: contentOpacity, y: contentY }}
        >
          {/* Headline */}
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/85 md:text-base">
              {t('hero.welcome')}
            </p>
            <motion.h1
              className="mt-4 font-extrabold uppercase leading-[0.93] tracking-tight text-white"
              style={{ fontSize: 'clamp(2rem, 5.5vw, 5rem)' }}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } } }}
            >
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 34 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                }}
                className="block"
              >
                {t('hero.line1')}
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 34 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                }}
                className="block"
              >
                {t('hero.line2')}
              </motion.span>
              <motion.span
                variants={{
                  hidden: { opacity: 0, y: 34 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
                }}
                className="block"
              >
                {t('hero.line3')}
              </motion.span>
            </motion.h1>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
