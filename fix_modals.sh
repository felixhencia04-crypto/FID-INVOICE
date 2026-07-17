sed -i 's/onDeleteClient(confirmDeleteState.clientId);/onDeleteClient(confirmDeleteState.clientId);\n      showToast('\''Klien berhasil dihapus'\'', '\''success'\'');\n      setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));/' src/components/ClientManagement.tsx

sed -i 's/onDeleteProduct(confirmDeleteState.productId);/onDeleteProduct(confirmDeleteState.productId);\n      showToast('\''Item\/Jasa berhasil dihapus'\'', '\''success'\'');\n      setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));/' src/components/ProductsServices.tsx

sed -i 's/setSelectedInvoiceIds(prev => prev.filter(id => !visibleSelectedIds.includes(id)));/setSelectedInvoiceIds(prev => prev.filter(id => !visibleSelectedIds.includes(id)));\n    showToast('\''Invoice terpilih berhasil dihapus'\'', '\''success'\'');\n    setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));/' src/components/InvoiceList.tsx

sed -i 's/setSelectedInvoiceIds(prev => prev.filter(id => id !== confirmDeleteState.invoiceId));/setSelectedInvoiceIds(prev => prev.filter(id => id !== confirmDeleteState.invoiceId));\n      showToast('\''Invoice berhasil dihapus'\'', '\''success'\'');\n      setConfirmDeleteState(prev => ({ ...prev, isOpen: false }));/' src/components/InvoiceList.tsx
