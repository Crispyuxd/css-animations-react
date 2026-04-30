'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack, CalendarWidget, CallBooked, DemoCursor } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

const days = [
  { num: 25, name: 'Sun' },
  { num: 26, name: 'Mon', id: 'day-26' },
  { num: 27, name: 'Tue' },
  { num: 28, name: 'Wed' },
];

const timeRows = [
  { slots: [{ label: '3:00 PM' }, { label: '3:30 PM', id: 'time-330' }, { label: '4:00 PM' }] },
  { slots: [{ label: '5:00 PM' }, { label: '6:00 PM' }, { label: '6:15 PM' }] },
];

export default function CalendarDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack gap={20}>
        <BotMessage id="bot-1" meta={<MetaRow id="meta-0" />}>
          Hey, how can I help?
        </BotMessage>

        <UserMessage id="user-1">
          I&apos;d like to book a demo
        </UserMessage>

        {/* Bot-2 block: contains both calendar state and booked state */}
        <div style={{ position: 'relative' }}>
          {/* State 1: bot text + calendar (visible first, hides on transition) */}
          <div id="state-calendar" style={{ paddingRight: 32 }}>
            <p id="bot-2" className="msg bot-msg" style={{
              margin: 0, fontSize: 14, lineHeight: 1.4, letterSpacing: '-0.28px',
              color: 'var(--text-heading)', fontWeight: 400,
              clipPath: 'inset(0 100% 0 0)',
            }}>
              Sure, pick a time that works for you.
            </p>
            <div style={{ marginTop: 12 }}>
              <CalendarWidget id="calendar-widget" days={days} timeRows={timeRows}>
                <DemoCursor id="cursor" />
              </CalendarWidget>
            </div>
            <div style={{ marginTop: 12 }}>
              <MetaRow id="meta-cal" positioned={false} />
            </div>
          </div>

          {/* State 2: bot text + call booked (overlays state-calendar) */}
          <div id="state-booked" style={{
            opacity: 0, paddingRight: 32,
            position: 'absolute', top: 0, left: 0, right: 0,
          }}>
            <p id="bot-2-booked" style={{
              margin: 0, fontSize: 14, lineHeight: 1.4, letterSpacing: '-0.28px',
              color: 'var(--text-heading)', fontWeight: 400,
              clipPath: 'inset(0 100% 0 0)',
            }}>
              Done! Here&apos;s what you scheduled.
            </p>
            <div style={{ marginTop: 12 }}>
              <CallBooked id="call-booked" date="26th March, 2026 at 3:30 PM" />
            </div>
            <div style={{ marginTop: 12 }}>
              <MetaRow id="meta-1" positioned={false} />
            </div>
          </div>
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
