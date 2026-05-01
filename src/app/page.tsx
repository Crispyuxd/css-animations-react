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
      <Link href="/demos/shopify" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Shopify
      </Link>
      <Link href="/demos/slack" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Slack
      </Link>
      <Link href="/demos/tavily" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Tavily
      </Link>
      <Link href="/demos/custom-actions" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Custom actions
      </Link>
      <Link href="/demos/suggested-messages" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Suggested messages
      </Link>
      <Link href="/demos/button" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Button
      </Link>
      <Link href="/demos/forms" style={{ fontSize: 16, color: '#09090b', textDecoration: 'underline' }}>
        Forms
      </Link>
    </div>
  );
}
