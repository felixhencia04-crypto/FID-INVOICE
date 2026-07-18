import re

def fix_sort(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Regex to find the broken sort
    # msgs.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
    # OR
    # msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() || 0);
    
    new_sort = """msgs.sort((a: any, b: any) => {
        const timeA = a.id ? parseInt(a.id.split('_').pop() || '0') : 0;
        const timeB = b.id ? parseInt(b.id.split('_').pop() || '0') : 0;
        return timeA - timeB;
      });"""
      
    new_sort_no_any = """msgs.sort((a, b) => {
        const timeA = a.id ? parseInt(a.id.split('_').pop() || '0') : 0;
        const timeB = b.id ? parseInt(b.id.split('_').pop() || '0') : 0;
        return timeA - timeB;
      });"""

    content = re.sub(r"msgs\.sort\(\(a:\s*any,\s*b:\s*any\)\s*=>\s*new Date\(a\.timestamp\)\.getTime\(\)\s*-\s*new Date\(b\.timestamp\)\.getTime\(\)\s*\|\|\s*0\);", new_sort, content)
    
    content = re.sub(r"msgs\.sort\(\(a,\s*b\)\s*=>\s*new Date\(a\.timestamp\)\.getTime\(\)\s*-\s*new Date\(b\.timestamp\)\.getTime\(\)\s*\|\|\s*0\);", new_sort_no_any, content)

    with open(filepath, 'w') as f:
        f.write(content)

fix_sort('src/components/AdminPanel.tsx')
fix_sort('src/components/CallCenterChat.tsx')
print("Patched sort")
