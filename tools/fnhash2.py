#!/usr/bin/env python3
"""Per-function hash using naive brace matching (same algorithm as the editor-side snippet in README)."""
import re, hashlib, glob, sys, os
d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'apps_script')
t = '\n'.join(open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(d, '*.gs'))))
out = []
for m in re.finditer(r'\bfunction (\w+)\(', t):
    i = t.index('{', m.end()); dep = 0; j = i
    while j < len(t):
        c = t[j]
        if c == '{': dep += 1
        elif c == '}':
            dep -= 1
            if dep == 0: break
        j += 1
    body = re.sub(r'\s+', ' ', re.sub(r'(?m)^[ \t]*//[^\n]*', ' ', t[m.start():j+1])).strip()
    out.append('%s:%s' % (m.group(1), hashlib.sha256(body.encode()).hexdigest()[:6]))
print(' '.join(sorted(out)))
