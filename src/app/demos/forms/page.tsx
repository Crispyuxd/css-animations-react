'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  FormCard, FormInputRow, FormTextareaRow, AttachButton, AttachmentItem, CaseCreatedCard,
  CTAButton, DemoCursor, DemoState,
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
            style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', width: 366 }}
          >
            <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" />} />

            {/* marginTop 26 + marginBottom 0 — the marginTop preserves user-1's
                offsetTop at 56 (so the 8-12px header gap math still holds with
                a -67 anchor scroll), while marginBottom 0 plus the smaller
                forms-scroll flex gap (10 instead of 20) tightens the user-1
                ↔ bot-2 visible gap to ~10px. The compounded gap reduction
                shifts the form-card up by ~13px in the layout, which is what
                makes meta-1 fit within the visible area at the SAME scroll
                value used for the user-1 turn anchor. */}
            <UserMessage id="user-1" style={{ marginTop: 26, marginBottom: 0 }}>I want to submit a support case</UserMessage>

            {/* Bot text — bot-2 cross-fades to bot-3 in the same position so
                the message "updates in place". Wrapper sizes to bot-2 (1 line)
                so the form-card sits flush; bot-3 line 2 (~19.6px at lh 1.4 ×
                14px) fits into the 20px flex gap below before the card area. */}
            <div style={{ position: 'relative', width: '100%' }}>
              <div id="state-form-bot">
                <BotMessage id="bot-2" lines={["No problem! Let's create one."]} />
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
                marginTop: -2 keeps the visible bot-2 → card gap at ~8px now
                that the forms-scroll flex gap is 10 (instead of 20). */}
            <div style={{ position: 'relative', width: '100%', marginTop: -2 }}>
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
                {/* 20px top spacer: bot-3's 2nd line (lh 1.4 × 14px ≈ 20px)
                    extends down into the 20px flex gap above this wrapper —
                    this margin restores the visual gap between the bot text
                    and the success card so the spacing matches the form state. */}
                <div style={{ marginTop: 20 }}>
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
