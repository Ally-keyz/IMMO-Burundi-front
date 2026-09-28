import type { ReactNode } from 'react';

interface LegalLayoutProps {
  title: string;
  updated?: string;
  children: ReactNode;
}

export default function LegalLayout({ title, updated, children }: LegalLayoutProps): JSX.Element {
  return (
    <div>
      <section className="border-b border-gray-200 py-12">
        <div className="container-page">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h1>
          {updated ? <p className="mt-2 text-sm text-gray-500">Last updated: {updated}</p> : null}
        </div>
      </section>
      <article className="container-page max-w-3xl py-12">
        <div className="space-y-6 text-sm leading-relaxed text-gray-600 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
          {children}
        </div>
      </article>
    </div>
  );
}