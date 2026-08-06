import os
import glob

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # The routes usually look like @router.get("/")
    # Replace ("/") with ("")
    # But only for @router decorators
    lines = content.split('\n')
    new_lines = []
    changed = False
    for line in lines:
        if line.strip().startswith('@router.') and '("/")' in line:
            new_lines.append(line.replace('("/")', '("")'))
            changed = True
        elif line.strip().startswith('@router.') and '("/", ' in line:
            new_lines.append(line.replace('("/", ', '("", '))
            changed = True
        else:
            new_lines.append(line)
            
    if changed:
        with open(filepath, 'w') as f:
            f.write('\n'.join(new_lines))
        print(f"Fixed {filepath}")

files = glob.glob("app/api/v1/*.py")
for file in files:
    fix_file(file)

