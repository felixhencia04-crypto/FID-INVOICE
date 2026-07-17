sed -i 's/  onFeatureBlocked?: (featureName: string) => void;/  onAddClient: (client: Client) => void;\n  onAddProduct: (product: Product) => void;\n  onFeatureBlocked?: (featureName: string) => void;/' src/components/QuotationManagement.tsx

sed -i 's/  onAddQuotation, onEditQuotation, onDeleteQuotation, onConvertQuotationToInvoice, onNavigate, onFeatureBlocked/  onAddQuotation, onEditQuotation, onDeleteQuotation, onConvertQuotationToInvoice, onNavigate, onAddClient, onAddProduct, onFeatureBlocked/' src/components/QuotationManagement.tsx

sed -i 's/clients.push(newClient); \/\/ local push for instant state sync/onAddClient(newClient);/' src/components/QuotationManagement.tsx

sed -i 's/products.push(newProduct);/onAddProduct(newProduct);/' src/components/QuotationManagement.tsx
