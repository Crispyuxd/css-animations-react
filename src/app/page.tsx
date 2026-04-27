import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>Chat Widget Demos</h1>
      <Link href="/demos/escalation" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Escalation
      </Link>
      <Link href="/demos/calendar" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Calendar
      </Link>
    </div>
  );
}
