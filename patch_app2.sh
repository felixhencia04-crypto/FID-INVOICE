sed -i '/onFeatureBlocked={(featureName) => setBlockedFeatureMessage(featureName)}/i \            onAddClient={handleAddClient}\n            onAddProduct={handleAddProduct}' src/App.tsx
sed -i '/<\/QuotationManagement>/d' src/App.tsx
sed -i '/onAddClient={handleAddClient}/,+1d' src/App.tsx
