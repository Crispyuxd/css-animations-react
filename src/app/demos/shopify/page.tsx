'use client';

import {
  ChatCard, ChatHeader, ChatInput, BotMessage, UserMessage, MetaRow, MessagesStack,
  CategoriesWidget, PickerWidget, ProductSheet, SheetOverlay, CartWidget, OrderSuccessWidget, DemoCursor, DemoState,
} from '@/components';
import { useTimeline } from '@/hooks/useTimeline';
import { timeline } from './timeline';

export default function ShopifyDemo() {
  useTimeline(timeline);

  return (
    <>
    <ChatCard>
      <ChatHeader />
      <MessagesStack gap={20}>
        <BotMessage id="bot-1" lines={['Hey, how can I help?']} meta={<MetaRow id="meta-0" />} />

        <UserMessage id="user-1">
          Show me categories on sale
        </UserMessage>

        <div style={{ position: 'relative' }}>
          <p id="bot-2" style={{
            margin: 0, fontSize: 14, lineHeight: 1.4, letterSpacing: '-0.28px',
            color: 'var(--text-heading)', fontWeight: 400, paddingRight: 32,
            clipPath: 'inset(0 100% 0 0)',
          }}>
            Here&apos;s a list of categories currently on sale:
          </p>

          <div style={{ marginTop: 12, position: 'relative' }}>
            <DemoState id="state-categories" metaId="meta-cat">
              <CategoriesWidget
                id="categories-widget"
                items={[
                  { id: 'cat-mens', buttonId: 'btn-mens-view', title: ["Men’s Workout", 'Shoes'], height: 154, imageSrc: '/shopify/mens.png' },
                  { id: 'cat-womens', buttonId: 'btn-womens-view', title: ["Women’s Workout", 'Shoes'], height: 172, imageSrc: '/shopify/womens.png' },
                ]}
                scroller={{ top: 60 }}
              >
                <DemoCursor id="cursor-cat" />
              </CategoriesWidget>
            </DemoState>

            <DemoState id="state-picker" overlay metaId="meta-picker">
              <PickerWidget
                id="picker-widget"
                category="Men’s Workout Shoes"
                products={[
                  { id: 'prod-metcon', name: 'XY Metcon 64', price: '$16.00', imageSrc: '/shopify/airmax.png', buttonId: 'btn-metcon', qtyId: 'qty-metcon' },
                  { id: 'prod-v2run', name: 'XY V2 Run', price: '$24.90', imageSrc: '/shopify/airmax.png', buttonId: 'btn-v2run', qtyId: 'qty-v2run' },
                ]}
                scroller={{ top: 110 }}
              >
                <DemoCursor id="cursor-pick-1" />
                <DemoCursor id="cursor-pick-2" />
              </PickerWidget>
            </DemoState>

            <DemoState id="state-cart" overlay metaId="meta-cart">
              <CartWidget
                id="cart-widget"
                items={[
                  { id: 'cart-item-metcon', name: 'XY Metcon 64', price: '$16.00', imageSrc: '/shopify/airmax.png' },
                  { id: 'cart-item-v2run', name: 'XY V2 Run', price: '$24.90', imageSrc: '/shopify/airmax.png' },
                ]}
                total="$40.90"
                payment={{ label: 'Pay using', brand: 'Visa', last4: '2683' }}
                checkoutId="btn-checkout"
              >
                <DemoCursor id="cursor-cart" />
              </CartWidget>
            </DemoState>

            <DemoState id="state-success" overlay metaId="meta-success">
              <OrderSuccessWidget
                id="success-widget"
                subtitle="25th March, 2026 at 3:00 PM"
              />
            </DemoState>
          </div>
        </div>
      </MessagesStack>
      <ChatInput />

      {/* Sheet overlay + product detail sheets — siblings of MessagesStack so they overlay everything below the header */}
      <SheetOverlay id="sheet-overlay" />
      <ProductSheet
        id="sheet-metcon"
        title="XY Metcon 64"
        size="36"
        color="White on red"
        total="$16.00"
        buttonId="btn-add-metcon"
      >
        <DemoCursor id="cursor-sheet-1" />
      </ProductSheet>
      <ProductSheet
        id="sheet-v2run"
        title="XY V2 Run"
        size="36"
        color="White on blue"
        total="$24.90"
        buttonId="btn-add-v2run"
      >
        <DemoCursor id="cursor-sheet-2" />
      </ProductSheet>
    </ChatCard>
    </>
  );
}
