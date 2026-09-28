import { useEffect, useState } from 'react';

interface ProfilePerson {
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
}

interface ProfileAvatarProps {
  user?: ProfilePerson | null;
  src?: string;
  sizeClass?: string;
  textClass?: string;
  alt?: string;
  className?: string;
}

function getInitials(user: ProfilePerson | null | undefined): string {
  const firstName = user?.firstName?.trim() ?? '';
  const lastName = user?.lastName?.trim() ?? '';
  if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
  return `${firstName || lastName}`.slice(0, 2).toUpperCase() || 'U';
}

export default function ProfileAvatar({
  user,
  src,
  sizeClass = 'h-8 w-8',
  textClass = 'text-sm',
  alt = 'Profile photo',
  className = '',
}: ProfileAvatarProps): JSX.Element {
  const imageSrc = (src ?? user?.photoUrl ?? '').trim();
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [imageSrc]);

  if (imageSrc && !imageFailed) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        onError={() => setImageFailed(true)}
        className={`${sizeClass} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${user?.firstName ?? ''} ${user?.lastName ?? ''} profile`.trim()}
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-ink font-bold text-white dark:bg-gray-200 dark:text-gray-900 ${className}`}
    >
      <span className={textClass}>{getInitials(user)}</span>
    </span>
  );
}
