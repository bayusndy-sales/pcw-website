#!/usr/bin/env python3
"""Print per-function hashes of apps_script/*.gs (same normalisation as the in-editor drift check)."""
import re, hashlib, glob, sys, os
d = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'apps_script')
files = sorted(glob.glob(os.path.join(d, '*.gs')))
t = '\n'.join(open(f, encoding='utf-8').read() for f in files)
t = re.sub(r'(?m)^[ \t]*//[^\n]*', ' ', t)
t = re.sub(r'\s+', ' ', t)
out = []
for c in re.split(r'(?=\bfunction \w+\()', t):
    m = re.match(r'function (\w+)\(', c)
    if m: out.append('%s:%s' % (m.group(1), hashlib.sha256(c.strip().encode()).hexdigest()[:6]))
print(len(out), ' '.join(out))
