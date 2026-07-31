'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  FormCard, FormInputRow, FormTextareaRow, AttachButton, AttachmentItem, CaseCreatedCard,
  CTAButton, DemoCursor, DemoState,
  ThinkingTrace,
} from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

const MESSAGE_LINES = [
  'I was billed twice for my March',
  'subscription. The charge of $150',
  'appeared on March 3rd and again on',
  'March 5th. Transaction IDs: TXN-8842',
  'and TXN-8845. Please investigate and',
  'process a refund for the duplicate charge.',
];

export default function FormsDemo() {
  useTimeline(timeline);

  return (
    <>
      <style>{`
        #field-msg-value { height: auto; }
        #msg-value { letter-spacing: -0.5px; }
      `}</style>
      <ChatCard>
        <ChatHeader />
        <MessagesStack gap={20}>
          <div
            id="forms-scroll"
            style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'stretch', width: 366 }}
          >
            <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" positioned={false} gap={8} />} />

            <UserMessage id="user-1" style={{ marginTop: 0, marginBottom: 0 }}>I want to submit a support case</UserMessage>

            {/* Bot text — bot-2 cross-fades to bot-3 in the same position so
                the message "updates in place". Wrapper sizes to bot-2 (1 line)
                so the form-card sits flush; bot-3 line 2 (~19.6px at lh 1.4 ×
                14px) fits into the 20px flex gap below before the card area. */}
            <div style={{ position: 'relative', width: '100%' }}>
              <div id="state-form-bot">
                <BotMessage id="bot-2" trace={<ThinkingTrace id="trace-1" />} lines={["No problem! Let's create one."]} />
              </div>
              <div id="state-success-bot" style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}>
                <BotMessage
                  id="bot-3"
                  lines={[
                    'Your case has been submitted successfully.',
                    'Our team will review it and get back to you shortly.',
                  ]}
                />
              </div>
            </div>

            {/* Card — form-card morphs into success-card in place. Meta rows
                live with the card so they sit below the active card visually.
                marginTop: -12 trims the inter-element gap (forms-scroll
                gap=32) down to 20 — the form-card is the response widget
                for bot-2 and reads as part of the same turn. */}
            <div style={{ position: 'relative', width: '100%', marginTop: -12 }}>
              <DemoState id="state-form">
                <FormCard id="form-card" title="Submit case">
                  <FormInputRow
                    label="Email"
                    placeholder="Enter your email address"
                    placeholderId="email-placeholder"
                    valueId="email-value"
                    value="mark@rhytmbox.co"
                  />
                  <FormTextareaRow
                    label="Message"
                    placeholder="Enter your message"
                    placeholderId="msg-placeholder"
                    valueId="msg-value"
                    valueLines={MESSAGE_LINES}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                    <AttachButton id="btn-attach" />
                    <AttachmentItem id="attach-1" filename="screenshot.png" type="image" />
                    <AttachmentItem id="attach-2" filename="Payment issue.pdf" type="file" />
                  </div>
                  <CTAButton id="btn-submit" block>Submit</CTAButton>
                  <DemoCursor id="cursor-form" />
                </FormCard>
                <MetaRow id="meta-1" gap={12} />
              </DemoState>

              <DemoState id="state-success" overlay>
                <div style={{ marginTop: 12 }}>
                  <CaseCreatedCard id="success-card" caseId="#4244-424" />
                  <MetaRow id="meta-2" gap={12} />
                </div>
              </DemoState>
            </div>
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
