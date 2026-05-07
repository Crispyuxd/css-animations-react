'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  FormCard, FormInputRow, CaseCreatedCard, CTAButton, DemoCursor, DemoState,
} from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function LeadsDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        <div
          id="leads-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage
            id="bot-1"
            lines={['Hey, how can I help?']}
            meta={<MetaRow id="meta-0" positioned={false} gap={8} />}
          />

          <UserMessage id="user-1" style={{ marginTop: 0, marginBottom: 0 }}>
            I want to schedule a demo with your team
          </UserMessage>

          {/* Bot text — bot-2 cross-fades to bot-3 in the same wrapper.
              Wrapper sizes to bot-2 (2 lines); bot-3 has 3 lines so its
              third line overflows into the 20px internal-to-turn gap below
              before the form-card wrapper. */}
          <div style={{ position: 'relative', width: '100%' }}>
            <div id="state-form-bot">
              <BotMessage
                id="bot-2"
                lines={[
                  `I'd love to set that up for you. Just fill in your details`,
                  `and we'll reach out shortly.`,
                ]}
              />
            </div>
            <div id="state-success-bot" style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}>
              <BotMessage
                id="bot-3"
                lines={[
                  'Thanks Mark! Your demo request has been',
                  'submitted. A member of our team will reach out',
                  'within 24 hours to find a time that works.',
                ]}
              />
            </div>
          </div>

          {/* Form-card morphs into success-card. marginTop: -12 trims the
              inter-element gap (32) down to 20 — the form-card is the
              response widget for bot-2 and reads as part of the same turn. */}
          <div style={{ position: 'relative', width: '100%', marginTop: -12 }}>
            <DemoState id="state-form">
              <FormCard id="form-card">
                <FormInputRow
                  label="Email"
                  placeholder="Enter your email address"
                  placeholderId="email-placeholder"
                  valueId="email-value"
                  value="mark@rhytmbox.co"
                />
                <FormInputRow
                  label="Phone number"
                  placeholder="Enter your phone number"
                  placeholderId="phone-placeholder"
                  valueId="phone-value"
                  value="+1 (647) 532-9878"
                />
                <CTAButton id="btn-submit" block>Submit</CTAButton>
                <DemoCursor id="cursor-leads" />
              </FormCard>
              <MetaRow id="meta-1" gap={12} />
            </DemoState>

            <DemoState id="state-success" overlay>
              <div style={{ marginTop: 12 }}>
                <CaseCreatedCard
                  id="success-card"
                  title="Form submitted"
                  caseId="Demo request received"
                />
                <MetaRow id="meta-2" gap={12} />
              </div>
            </DemoState>
          </div>
        </div>
      </MessagesStack>
      <ChatInput />
    </ChatCard>
  );
}
