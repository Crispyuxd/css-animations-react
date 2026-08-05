'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack, ThinkingTrace } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function CollectDataDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        <div
          id="collect-data-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

          {/* Single nowrap line, so the bubble hugs its text: 291 of text + 32
              padding = 323, inside the 334 the row allows. Deliberately NOT
              `wrap` — that sets max-width 305 and the bubble is then sized by
              max-content clamped to 305, leaving ~150px of dead space to the
              right of the wrapped lines instead of hugging them. */}
          <UserMessage id="user-1">
            {'Hi, I\'d like to register my product for warranty'}
          </UserMessage>

          {/* The agent asks for the fields it was told to collect. No card, no
              form — the bubbles ARE the form. That's the whole point of this
              action, and what separates it from the leads/forms demos.
              trace-1 sits here because every demo in this repo puts the single
              pending indicator on the first reply that types out of the wait
              (docs/CHAT_LAYOUT.md). */}
          <BotMessage
            id="bot-2"
            trace={<ThinkingTrace id="trace-1" />}
            lines={[
              'Happy to help! Could you share the serial number and',
              'your purchase date?',
            ]}
            meta={<MetaRow id="meta-1" positioned={false} gap={8} />}
          />

          <UserMessage id="user-2">
            SN-88214, bought it March 12th
          </UserMessage>

          <BotMessage
            id="bot-3"
            lines={[
              `Perfect, I've saved both. Your warranty is registered`,
              'through March 12, 2027.',
            ]}
            meta={<MetaRow id="meta-2" positioned={false} gap={8} />}
          />
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
