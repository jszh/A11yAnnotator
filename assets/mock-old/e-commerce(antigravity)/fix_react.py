import os
import glob

files = glob.glob('/Users/mengqishi/Desktop/ABD-mock-websites/ecommerce-portal/**/*.html', recursive=True)
for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    old_code = """        window.onload = () => {
            setTimeout(() => {
                const root = ReactDOM.createRoot(document.getElementById('root'));
                root.render(<App />);
            }, 100);
        };"""
    new_code = """        setTimeout(() => {
            const root = ReactDOM.createRoot(document.getElementById('root'));
            root.render(<App />);
        }, 100);"""
    
    if old_code in content:
        content = content.replace(old_code, new_code)
        with open(f, 'w') as file:
            file.write(content)
        print("Fixed " + f)

