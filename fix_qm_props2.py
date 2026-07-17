import re

with open('src/components/QuotationManagement.tsx', 'r') as f:
    content = f.read()

# Fix interface
content = re.sub(r'  onAddClient: \(client: Client\) => void;\n  onAddProduct: \(product: Product\) => void;\n  onFeatureBlocked,\n  onAddClient,\n  onAddProduct\?: \(featureName: string\) => void;', 
                 r'  onAddClient: (client: Client) => void;\n  onAddProduct: (product: Product) => void;\n  onFeatureBlocked?: (featureName: string) => void;', content)

# Fix comma operator left side
content = re.sub(r'onAddProduct\(1 \* qpPrice, newProduct\)', r'onAddProduct(newProduct)', content)

with open('src/components/QuotationManagement.tsx', 'w') as f:
    f.write(content)
