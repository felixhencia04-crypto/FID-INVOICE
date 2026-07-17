sed -i 's/onAddProduct={handleAddProduct}//' src/App.tsx
sed -i '/onAddClient={handleAddClient}/a\            onAddProduct={handleAddProduct}' src/App.tsx
