'use client';

// Dashboard prototype — three states in the Stripe integration flow.
// All three states render inside a single 1440x900 frame (Figma states 2 & 3
// are exactly that; state 1 is 1440x1000 in Figma but cropped to 900 here so
// every state shares the same outer chrome and there are no jarring frame-
// size swaps when toggling state).
//
//   1. Templates       — Figma 1327:9765   — full dashboard, Templates tab.
//   2. Connect         — Figma 1327:10057  — Stripe connect modal overlay.
//   3. AvailableActions — Figma 1327:10160 — Stripe action list modal overlay.
//
// Backdrop is a 2x export of node 1327:9765 (`explore-bg.png`) — pixel-exact.
// The frame scales uniformly to fit the viewport; a fixed full-viewport
// container clips any layout overflow so no body-background bleeds through.

import { useEffect, useState } from 'react';
import { StripeDemo } from '@chatbase/widget-demos';

type DashState = 'templates' | 'connect' | 'actions';

const FRAME_W = 1440;
const FRAME_H = 900;

export default function DashboardPage() {
  const [state, setState] = useState<DashState>('templates');

  useEffect(() => {
    const updateScale = () => {
      const scale = Math.min(window.innerWidth / FRAME_W, window.innerHeight / FRAME_H);
      document.documentElement.style.setProperty('--dash-scale', String(scale));
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const showOverlay = state === 'connect' || state === 'actions';

  return (
    <div style={pageStyle}>
      <div style={frameStyle}>
        <img src="/dashboard/explore-bg.png" alt="" style={bgStyle} />

        {state === 'templates' && (
          <button
            type="button"
            onClick={() => setState('connect')}
            aria-label="Open Stripe template"
            style={templatesClickTargetStyle}
          />
        )}

        {showOverlay && <div style={backdropBlurStyle} aria-hidden="true" />}

        {state === 'connect' && (
          <ConnectModal
            onClose={() => setState('templates')}
            onConnect={() => setState('actions')}
          />
        )}

        {state === 'actions' && (
          <AvailableActionsModal onClose={() => setState('templates')} />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Connect modal — Figma 1327:10057
// ============================================================================

function ConnectModal({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  onConnect: () => void;
}) {
  return (
    <div style={modalStyle}>
      {/* Left: live StripeDemo widget preview */}
      <div style={previewStyle}>
        <div style={previewSlotStyle}>
          <StripeDemo />
        </div>
      </div>

      {/* Right: Connect Stripe content */}
      <div style={connectContentStyle}>
        <button type="button" style={closeStyle} onClick={onClose} aria-label="Close">
          <img src="/dashboard/close-x.svg" alt="" width={16} height={16} />
        </button>

        <div style={connectHeaderStyle}>
          <div style={logosRowStyle}>
            <img src="/dashboard/logo-chatbase.svg" alt="Chatbase" width={40} height={40} />
            <img src="/dashboard/dots.svg" alt="" width={44} height={4} />
            <img src="/dashboard/logo-stripe.svg" alt="Stripe" width={40} height={40} />
          </div>
          <div style={titleStackStyle}>
            <p style={connectTitleStyle}>Connect Stripe</p>
            <p style={connectDescStyle}>
              You&apos;ll be redirected to Stripe to authorize access. Once
              connected, your agent can handle payments and billing.
            </p>
          </div>
        </div>

        <div style={infoRowStyle}>
          <img src="/dashboard/info-circle.svg" alt="" width={16} height={16} />
          <span style={infoTextStyle}>
            Requires identity verification for certain actions.
          </span>
        </div>

        <button type="button" style={ctaStyle} onClick={onConnect}>
          <span style={ctaLabelStyle}>Connect now</span>
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Available-actions modal — Figma 1327:10160
// ============================================================================

const ACTIONS = [
  { title: 'Get invoices', desc: 'Retrieve and display invoices.' },
  { title: 'Get subscription info', desc: 'Retrieve and display subscription info.' },
  { title: 'Change billing address', desc: 'Change the billing address and other info.' },
  { title: 'Manage subscription', desc: 'Manage subscriptions for your customers.' },
];

function AvailableActionsModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={modalStyle}>
      {/* Left: same live StripeDemo widget as the Connect modal */}
      <div style={previewStyle}>
        <div style={previewSlotStyle}>
          <StripeDemo />
        </div>
      </div>

      {/* Right: Stripe header + 4 expandable action items */}
      <div style={actionsContentStyle}>
        <button type="button" style={closeStyle} onClick={onClose} aria-label="Close">
          <img src="/dashboard/close-x.svg" alt="" width={16} height={16} />
        </button>

        <div style={actionsHeaderStyle}>
          <div style={stripeLogoStyle}>
            <StripeSIcon />
          </div>
          <div style={actionsTitleStackStyle}>
            <p style={actionsTitleStyle}>Stripe</p>
            <p style={actionsSubtitleStyle}>{ACTIONS.length} available actions</p>
          </div>
        </div>

        <div style={actionsListStyle}>
          <div style={dividerStyle} />
          {ACTIONS.map((a) => (
            <div key={a.title}>
              <div style={actionItemStyle}>
                <div style={actionItemTextStyle}>
                  <p style={actionItemTitleStyle}>{a.title}</p>
                  <p style={actionItemDescStyle}>{a.desc}</p>
                </div>
                <ChevronDown />
              </div>
              <div style={dividerStyle} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- inline SVGs (exported from Figma) -----

function StripeSIcon() {
  // Stripe glyph — Figma node 1327:10246, 14x20 in #5F57FA
  return (
    <svg width="14" height="20" viewBox="0 0 14 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M5.385 5.59c0-.84.69-1.166 1.83-1.166 1.638 0 3.704.495 5.342 1.379V.681A14.196 14.196 0 0 0 7.214 0C2.578 0 0 2.43 0 6.49c0 6.337 8.71 5.32 8.71 8.05 0 .99-.86 1.314-2.066 1.314-1.785 0-4.069-.733-5.875-1.722v5.218A14.91 14.91 0 0 0 6.642 20C11.39 20 14 17.7 14 13.594 14 6.752 5.385 7.97 5.385 5.59z"
        fill="#5F57FA"
      />
    </svg>
  );
}

function ChevronDown() {
  // arrow-down-01 — Figma node 1327:10260 instance, 16x16
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <path
        d="M4 6l4 4 4-4"
        stroke="#71717A"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ============================================================================
// Styles — pixel-exact per Figma extracts
// ============================================================================

// Fixed full-viewport container — clips any layout overflow caused by the
// scale transform (which doesn't shrink an element's flow-size, only its
// rendered pixels). overflow:hidden + position:fixed prevents body bg from
// bleeding through and kills the residual scrollbars.
const pageStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: '#0a0a0a',
  display: 'grid',
  placeItems: 'center',
  overflow: 'hidden',
  fontFamily: 'Inter, sans-serif',
};

const frameStyle: React.CSSProperties = {
  position: 'relative',
  width: FRAME_W,
  height: FRAME_H,
  flexShrink: 0,
  transform: 'scale(var(--dash-scale, 1))',
  transformOrigin: 'center center',
};

const bgStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'top',
  pointerEvents: 'none',
};

// Templates state — invisible click target across the templates grid area.
// Approximated to the main content region (right of sidebar, below header).
const templatesClickTargetStyle: React.CSSProperties = {
  position: 'absolute',
  top: 168,
  left: 304,
  width: 1088,
  height: 800,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
};

const backdropBlurStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.12)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  pointerEvents: 'none',
};

// Shared modal shell (Connect + Actions both use this)
const modalStyle: React.CSSProperties = {
  position: 'absolute',
  top: 150,
  left: 200,
  width: 1040,
  height: 600,
  display: 'flex',
  borderRadius: 16,
  overflow: 'hidden',
  boxShadow: '0 30px 80px rgba(0, 0, 0, 0.18), 0 12px 24px rgba(0, 0, 0, 0.06)',
  background: '#fff',
};

const previewStyle: React.CSSProperties = {
  width: 520,
  height: 600,
  background: '#f4f4f5',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const previewSlotStyle: React.CSSProperties = {
  display: 'flex',
};

const closeStyle: React.CSSProperties = {
  position: 'absolute',
  top: 32,
  right: 32,
  width: 16,
  height: 16,
  border: 'none',
  background: 'transparent',
  padding: 0,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// ----- Connect modal right side -----

const connectContentStyle: React.CSSProperties = {
  position: 'relative',
  width: 520,
  height: 600,
  background: '#fff',
  padding: 32,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 20,
};

const connectHeaderStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 20,
};

const logosRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const titleStackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  width: '100%',
};

const connectTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Inter, sans-serif',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: -0.4,
  color: '#09090b',
};

const connectDescStyle: React.CSSProperties = {
  margin: 0,
  width: 380,
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: 1.4,
  letterSpacing: -0.28,
  color: '#71717a',
  textAlign: 'center',
};

const infoRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const infoTextStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: -0.28,
  color: '#b45309',
};

const ctaStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 16px',
  background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.048) 100%), #09090b',
  border: '1px solid rgba(255, 255, 255, 0.24)',
  borderRadius: 8,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  cursor: 'pointer',
};

const ctaLabelStyle: React.CSSProperties = {
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '20px',
  color: '#fff',
};

// ----- Available-actions modal right side -----

const actionsContentStyle: React.CSSProperties = {
  position: 'relative',
  width: 520,
  height: 600,
  background: '#fff',
  padding: 32,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  justifyContent: 'flex-start',
  gap: 24,
};

const actionsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
};

const stripeLogoStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  background: '#fff',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
};

const actionsTitleStackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 4,
};

const actionsTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Inter, sans-serif',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: 1.4,
  letterSpacing: -0.4,
  color: '#09090b',
};

const actionsSubtitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: -0.28,
  color: '#71717a',
};

const actionsListStyle: React.CSSProperties = {
  width: 456,
  display: 'flex',
  flexDirection: 'column',
};

const dividerStyle: React.CSSProperties = {
  width: '100%',
  height: 1,
  background: '#f4f4f5',
};

const actionItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 0',
  gap: 16,
};

const actionItemTextStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  flex: 1,
};

const actionItemTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Inter, sans-serif',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: -0.28,
  color: '#27272a',
};

const actionItemDescStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Inter, sans-serif',
  fontSize: 12,
  fontWeight: 400,
  lineHeight: 1.3,
  letterSpacing: -0.12,
  color: '#71717a',
};
