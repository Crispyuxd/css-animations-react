'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  CTAButton,
} from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function ButtonDemo() {
  useTimeline(timeline);

  return (
    <>
      <ChatCard>
        <ChatHeader />
        <MessagesStack>
          <div
            id="button-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

            <UserMessage id="user-1">Can you redirect me to pricing page?</UserMessage>

            <BotMessage
              id="bot-2"
              lines={['Sure, please click on this button:']}
              slot={<CTAButton id="btn-pricing">Visit our pricing page</CTAButton>}
              meta={<MetaRow id="meta-1" positioned={false} gap={12} />}
            />
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
