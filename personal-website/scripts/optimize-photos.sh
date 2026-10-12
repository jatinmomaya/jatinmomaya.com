#!/bin/bash
# Re-encode a chapter's photos for the web: 1170px wide, JPEG quality 68,
# progressive. Run from the personal-website directory:
#   scripts/optimize-photos.sh mexico
# Source files are read from public/photos/<id>/src/ (or the folder itself
# with --in-place); web versions are written to public/photos/<id>/NN.jpg.
set -euo pipefail

CHAPTER="${1:?usage: optimize-photos.sh <chapter-id> [--in-place]}"
IN_PLACE="${2:-}"
BASE="public/photos/$CHAPTER"
SRC_DIR="$BASE/src"

if [ "$IN_PLACE" = "--in-place" ]; then
  SRC_DIR="$BASE"
fi

if [ ! -d "$SRC_DIR" ]; then
  echo "no source directory: $SRC_DIR"
  echo "put originals in public/photos/$CHAPTER/src/ first"
  exit 1
fi

python3 - "$SRC_DIR" "$BASE" "$IN_PLACE" << 'EOF'
import os, sys
from PIL import Image

src_dir, base, in_place = sys.argv[1], sys.argv[2], sys.argv[3]
files = sorted(
    f for f in os.listdir(src_dir)
    if f.lower().endswith(('.jpg', '.jpeg', '.png', '.heic'))
    and not (in_place == '--in-place' and len(f) == 6 and f[:2].isdigit())
)
if not files:
    print('nothing to encode')
    sys.exit(0)

for n, name in enumerate(files, 1):
    im = Image.open(os.path.join(src_dir, name)).convert('RGB')
    if im.width > 1170:
        im = im.resize((1170, round(im.height * 1170 / im.width)), Image.LANCZOS)
    out = os.path.join(base, f'{n:02d}.jpg')
    im.save(out, 'JPEG', quality=68, optimize=True, progressive=True)
    print(f'{name} -> {os.path.basename(out)} ({im.width}x{im.height})')
EOF
