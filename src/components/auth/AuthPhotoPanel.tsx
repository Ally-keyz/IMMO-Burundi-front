const VIDEO_URL =
  '/assets/videos/vid.mp4';

export default function AuthPhotoPanel(): JSX.Element {
  return (
    <div className="hidden w-1/2 shrink-0 p-3 md:block">
      <div className="relative h-full min-h-0 overflow-hidden rounded-[20px]">
        <video
          src={VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          controlsList="nodownload"
          disablePictureInPicture
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}