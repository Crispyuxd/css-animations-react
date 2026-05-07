'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  SubscriptionsCard, PlanPickerCard, BillSummaryCard, PaymentMethodsSheet, PaymentMethodsOverlay,
  CaseCreatedCard, DemoCursor, DemoState,
} from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function StripeDemo() {
  useTimeline(timeline);

  return (
    <ChatCard>
      <ChatHeader />
      <MessagesStack>
        <div
          id="stripe-scroll"
          style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'stretch', width: 366 }}
        >
          <BotMessage
            id="bot-1"
            lines={['Hey, how can I help?']}
            meta={<MetaRow id="meta-0" positioned={false} gap={8} />}
          />

          <UserMessage id="user-1" style={{ marginTop: 0, marginBottom: 0 }}>
            I want to manage my subscription plan
          </UserMessage>

          {/* Bot text — bot-2 (mgmt prompt) cross-fades to bot-3 (success). Wrapper
              sized to bot-2 (1 line); bot-3 also 1 line so no overflow concerns. */}
          <div style={{ position: 'relative', width: '100%' }}>
            <div id="state-mgmt-bot">
              <BotMessage id="bot-2" lines={['Select a subscription to manage its settings']} />
            </div>
            <div id="state-success-bot" style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}>
              <BotMessage id="bot-3" lines={[`You're all set, Sarah!`]} />
            </div>
          </div>

          {/* Card morph chain: subs → plan-picker → bill-summary → success.
              marginTop: -12 trims gap=32 to 20 internal-to-turn. */}
          <div style={{ position: 'relative', width: '100%', marginTop: -12 }}>
            <DemoState id="state-subscriptions">
              <SubscriptionsCard id="subs-card" updateButtonId="btn-update-plan" />
              <MetaRow id="meta-1" gap={12} />
            </DemoState>

            <DemoState id="state-planpicker" overlay>
              <PlanPickerCard id="picker-card" confirmId="btn-picker-confirm" plans={[
                { name: 'Free', price: '0.00 USD /m' },
                { name: 'Standard', price: '150.00 USD /m', selectId: 'btn-select-standard' },
                { name: 'Pro', price: '500.00 USD /m' },
              ]} />
              <MetaRow id="meta-2" gap={12} />
            </DemoState>

            <DemoState id="state-billsummary" overlay>
              <BillSummaryCard id="bill-card" payRowId="pay-row" payChevronId="pay-chevron" confirmId="btn-bill-confirm" />
              <MetaRow id="meta-3" gap={12} />
            </DemoState>

            <DemoState id="state-success" overlay>
              {/* marginTop:-8 cancels 8 of the 20px internal-to-turn gap so
                  the success-card sits 12px below bot-3 (matches Figma frame 6).
                  The forms/leads pattern uses +12 because bot-3 there has more
                  lines than bot-2 and the line overflow consumes the gap;
                  stripe's bot-3 is the same height as bot-2, so no overflow. */}
              <div style={{ marginTop: -8 }}>
                <CaseCreatedCard
                  id="success-card"
                  title="Plan successfully updated"
                  caseId={
                    <>
                      Hobby
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                        style={{ display: 'inline-block', verticalAlign: '-3px', margin: '0 6px' }}
                      >
                        <path
                          d="M3 8H13M13 8L9 4M13 8L9 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Standard
                    </>
                  }
                />
                <MetaRow id="meta-4" gap={12} />
              </div>
            </DemoState>
          </div>
        </div>
      </MessagesStack>
      <ChatInput />

      {/* Sheet + dimmed backdrop sit above everything; both animate via the timeline. */}
      <PaymentMethodsOverlay id="sheet-overlay" />
      <PaymentMethodsSheet id="payment-sheet" confirmId="btn-sheet-confirm" />

      {/* Single cursor for the whole demo at chat-card level so its
          offsetParent is ChatCard — waypoints resolve targets across every
          state AND inside the sheet. Same pattern as shopify. */}
      <DemoCursor id="cursor-stripe" />
    </ChatCard>
  );
}
