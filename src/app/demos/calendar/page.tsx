'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  CalendarWidget, CallBooked, DemoCursor, DemoState,
  ThinkingTrace,
} from '@/components';
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
      <MessagesStack>
        <div
          id="calendar-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

          <UserMessage id="user-1">
            I&apos;d like to book a demo
          </UserMessage>

          {/* Bot text wrapper — bot-2 cross-fades to bot-2-booked */}
          <div style={{ position: 'relative', width: '100%' }}>
            <div id="state-calendar-bot">
              <BotMessage id="bot-2" trace={<ThinkingTrace id="trace-1" />} lines={['Sure, pick a time that works for you.']} />
            </div>
            <div id="state-booked-bot" style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}>
              <BotMessage id="bot-2-booked" lines={["Done! Here's what you scheduled."]} />
            </div>
          </div>

          {/* Card area — calendar morphs into call-booked. Cards sit 12px
              below the bot text (internal-to-turn). */}
          <div style={{ position: 'relative', width: '100%', marginTop: -8 }}>
            <DemoState id="state-calendar">
              <CalendarWidget id="calendar-widget" days={days} timeRows={timeRows}>
                <DemoCursor id="cursor" />
              </CalendarWidget>
              <MetaRow id="meta-cal" positioned={false} gap={12} />
            </DemoState>

            <DemoState id="state-booked" overlay>
              <CallBooked id="call-booked" date="26th March, 2026 at 3:30 PM" />
              <MetaRow id="meta-1" positioned={false} gap={12} />
            </DemoState>
          </div>
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
