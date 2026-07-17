sed -i '/<ReceiptManagement/,/onFeatureBlocked=/ {
  /onAddClient={handleAddClient}/d
  /onAddProduct={handleAddProduct}/d
}' src/App.tsx

sed -i '/<ClientManagement/,/onFeatureBlocked=/ {
  /onAddProduct={handleAddProduct}/d
}' src/App.tsx

sed -i '/<ProductsServices/,/onFeatureBlocked=/ {
  /onAddClient={handleAddClient}/d
}' src/App.tsx
