import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Star } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1757356657991-c3fd6e2e812e?w=2400&q=80&auto=format&fit=crop';

const HERO_VIDEO_URL =
  '/assets/videos/vid.mp4';

const AGENT_AVATARS = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
];

export default function HeroSection(): JSX.Element {
  const { t } = useLanguage();

  const cardRef = useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start start', 'end start'] });
  const contentOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 0.9], [0, -36]);

  return (
    <section className="container-page pt-5 desktop:pt-[38px]">
      <div ref={cardRef} className="hero-height relative flex flex-col overflow-hidden rounded-[40px] bg-slate-900">
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

        {/* Notch: the page background (white) cut out of the hero's
            bottom-right corner, so the photo reads as one L-shaped
            card with continuous 40px curves around the badge. */}
        <div
          className="absolute bottom-0 right-0 z-20 flex h-[76px] w-[260px] items-center rounded-tl-lg sm:h-[100px] sm:w-[340px] md:h-[110px] md:w-[480px] desktop:h-[clamp(90px,15vh,120px)] desktop:w-[640px]"
          style={{ background: 'rgb(var(--immo-bg))' }}
          aria-hidden="true"
        >
          {/* Rounded photo corner where the notch's top edge meets the right edge */}
          <div
            className="absolute bottom-full right-0 h-2 w-2"
            style={{ background: 'radial-gradient(circle at 100% 100%, transparent 8px, rgb(var(--immo-bg)) 8.5px)' }}
          />
          {/* Rounded photo corner where the notch's left edge meets the bottom edge */}
          <div
            className="absolute bottom-0 right-full h-2 w-2"
            style={{ background: 'radial-gradient(circle at 100% 100%, transparent 8px, rgb(var(--immo-bg)) 8.5px)' }}
          />

          <div className="flex w-full items-center gap-3 px-4">
            <div className="flex shrink-0 -space-x-3">
              {AGENT_AVATARS.map((src) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 rounded-full object-cover ring-2 ring-white sm:h-11 sm:w-11"
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="hidden text-sm font-bold leading-tight text-gray-900 sm:block md:text-[15px]">
                {t('hero.agentsLabel')}
              </p>
              <div className="mt-0.5 flex items-center gap-2 sm:mt-1.5">
                <div className="flex gap-0.5" aria-hidden="true">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#F5B400] text-[#F5B400]" />
                  ))}
                </div>
                <span className="text-xs font-bold text-gray-800">5/5</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}