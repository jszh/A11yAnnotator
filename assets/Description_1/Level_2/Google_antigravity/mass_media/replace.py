import os
import re

directory = "."
files_to_process = ["index.html", "category.html", "article.html", "opinion.html", "subscription.html"]

unsplash_pattern = re.compile(r"https://images\.unsplash\.com/photo-[a-zA-Z0-9\-]+(?:%[0-9A-Fa-f]{2})?(?:\?[^\s\"']*)?")
dicebear_pattern = re.compile(r"https://api\.dicebear\.com/7\.x/notionists/svg\?seed=([^&\"\']+)(?:&[^\"\']*)?")

def repl_unsplash(match):
    url = match.group(0)
    # create a simple seed from url length + some chars
    seed = f"img_{sum(ord(c) for c in url[-10:])}"
    return f"https://picsum.photos/seed/{seed}/800/600"

def repl_dicebear(match):
    seed = match.group(1)
    if seed.startswith("${") and seed.endswith("}"):
        seed_expr = seed[2:-1]
        return f"https://ui-avatars.com/api/?name=${{{seed_expr}}}&background=f1f5f9&color=1d2939"
    else:
        return f"https://ui-avatars.com/api/?name={seed}&background=f1f5f9&color=1d2939"

for filename in files_to_process:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    content = unsplash_pattern.sub(repl_unsplash, content)
    content = dicebear_pattern.sub(repl_dicebear, content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Replacement complete.")
