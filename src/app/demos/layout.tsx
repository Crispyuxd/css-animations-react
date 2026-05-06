import { DebugScrubber } from '@/components';

export default function DemosLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* WCAG 2.2.2: pause control on every demo (compact by default; ?debug shows full scrubber) */}
      <DebugScrubber />
    </>
  );
}
