'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  SuggestionChips, SuggestionChip, DemoCursor,
} from '@/components';
import { PhoneIcon, InvoiceIcon } from '@/icons';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function SuggestedMessagesDemo() {
  useTimeline(timeline);

  return (
    <>
      <ChatCard>
        <ChatHeader />
        <MessagesStack gap={20}>
          <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" />} />

          <UserMessage id="user-1">What plans do you offer?</UserMessage>

          <BotMessage
            id="bot-2"
            lines={[
              'We offer four plans:',
              { bullet: 'Free ($0/mo) with 50 message credits and 1 agent to' },
              { indent: 'get started.' },
              { bullet: 'Hobby ($40/mo) with 1,500 credits, advanced AI' },
              { indent: 'models, and integrations.' },
              { bullet: 'Standard ($150/mo) with 10,000 credits, 2 agents,' },
              { indent: 'and advanced analytics.' },
              { bullet: 'Pro ($500/mo) with 40,000 credits, 5 agents, and' },
              { indent: 'priority support.' },
              'All paid plans save 20% with yearly billing. We also offer',
              'custom Enterprise plans for larger teams. Would you like',
              'help choosing the right one?',
            ]}
            meta={<MetaRow id="meta-1" />}
          />
        </MessagesStack>

        <SuggestionChips id="chips-1">
          <SuggestionChip id="chip-call" icon={<PhoneIcon />}>Book a call</SuggestionChip>
          <SuggestionChip id="chip-bill" icon={<InvoiceIcon />}>Billing</SuggestionChip>
          <SuggestionChip id="chip-plans">What plans do you offer?</SuggestionChip>
          <SuggestionChip id="chip-api">What is API?</SuggestionChip>
          <SuggestionChip id="chip-impl">How easy is it to implement?</SuggestionChip>
          <DemoCursor id="cursor-1" />
        </SuggestionChips>

        <SuggestionChips id="chips-2" overlay>
          <SuggestionChip icon={<PhoneIcon />}>Book a call</SuggestionChip>
          <SuggestionChip icon={<InvoiceIcon />}>Billing</SuggestionChip>
          <SuggestionChip>What plans do you offer?</SuggestionChip>
          <SuggestionChip>What is API?</SuggestionChip>
          <SuggestionChip>How easy is it to implement?</SuggestionChip>
        </SuggestionChips>

        <ChatInput />
      </ChatCard>
    </>
  );
}
