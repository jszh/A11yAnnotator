import os
import glob
import re

files = glob.glob('*.html')

old_pattern = re.compile(
    r'(lucide\.createIcons\(\{\s*icons: \{ \[name\]: lucide\.icons\[name\] \},\s*nameAttr: \'data-lucide\',\s*attrs: \{\s*class: className,\s*width: size,\s*height: size,\s*\'stroke-width\': 2\s*\}\s*\}\);\s*)const svg = lucide\.icons\[name\]\.toSvg\(\{\s*class: className,\s*width: size,\s*height: size,\s*\'stroke-width\': 2\s*\}\);\s*iconRef\.current\.innerHTML = svg;',
    re.DOTALL
)

for file in files:
    with open(file, 'r') as f:
        content = f.read()
    
    content = content.replace(
        "iconRef.current.innerHTML = '';", 
        "iconRef.current.innerHTML = `<i data-lucide=\"${name}\"></i>`;"
    )
    
    content = old_pattern.sub(r'\1', content)
    
    with open(file, 'w') as f:
        f.write(content)

print(f"Updated {len(files)} files.")
