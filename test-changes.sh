# Check if QrisPaymentBox correctly implements onClose
grep "onClose?:" src/components/QrisPaymentBox.tsx
grep "onClose={() => setCheckout(null)}" src/components/SubscriptionPage.tsx
grep "onClose={() => setQrisStep(false)}" src/App.tsx
