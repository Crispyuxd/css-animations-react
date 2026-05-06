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
            style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'stretch', width: 366 }}
          >
            <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" />} />

            <UserMessage id="user-1">I want to submit a support case</UserMessage>

            <div style={{ position: 'relative', width: '100%' }}>
              <DemoState id="state-form">
                <BotMessage
                  id="bot-2"
                  lines={["No problem! Let's create one."]}
                  meta={<MetaRow id="meta-1" gap={12} />}
                  slot={
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
                  }
                />
              </DemoState>

              <DemoState id="state-success" overlay>
                <BotMessage
                  id="bot-3"
                  meta={<MetaRow id="meta-2" gap={12} />}
                  slot={<CaseCreatedCard id="success-card" caseId="#4244-424" />}
                  lines={[
                    'Your case has been submitted successfully.',
                    'Our team will review it and get back to you shortly.',
                  ]}
                />
              </DemoState>
            </div>
          </div>
        </MessagesStack>
        <ChatInput />
      </ChatCard>
    </>
  );
}
