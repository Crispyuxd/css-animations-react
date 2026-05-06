'use client';

import { ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, ConnectedDivider, MessagesStack } from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function EscalationDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        {/* Inner div is the scroll target. Tighter flex gap (20 vs the
            stack default 32) brings the user↔bot spacing closer to a
            modern messaging UI without going as tight as the forms demo
            (which uses 10 to fit a tall form-card). UserMessage's
            default 12/12 margins are preserved. */}
        <div
          id="escalation-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" />} />

          <UserMessage id="user-1">
            I&apos;m having trouble with my recent order
          </UserMessage>

          <BotMessage
            id="bot-2"
            lines={[
              'I understand. Let me connect you with someone who can',
              'help directly.',
            ]}
            meta={<MetaRow id="meta-1" />}
          />

          {/* marginTop 24 makes the gap above the divider (meta-1's bottom
              → divider top, ~20px visually) match the gap below it
              (divider bottom → bot-3 top = flex gap 20). meta-1 is
              absolutely positioned and extends ~24px below bot-2's
              botBlock bottom, so 20 (flex gap) + 24 (marginTop) − 24
              (meta-1 extension) = 20 visual top gap. */}
          <ConnectedDivider id="divider-1" name="Mark Kent Connected" style={{ marginTop: 24 }} />

          <BotMessage id="bot-3" lines={['Thanks for waiting. How can I help?']} meta={<MetaRow id="meta-2" author="Mark Kent" />} />

          <UserMessage id="user-2" wrap>
            My order was marked delivered but I never received it
          </UserMessage>

          <BotMessage id="bot-4" lines={['Let me pull up your order. Give me just a moment.']} meta={<MetaRow id="meta-3" author="Mark Kent" />} />
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
