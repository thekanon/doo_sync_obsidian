#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else yield p;
  }
}

// 수정: __tests__ 와 tests 둘 다 훑고 싶으면 배열에 추가
const roots = ['__tests__', 'tests'];

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const files = roots.flatMap((r) =>
  fs.existsSync(r) ? [...walk(r)].filter((f) => exts.has(path.extname(f))) : []
);

// 1) 정적 import
//    from "<relative path>" 형태
//    (../ 또는 ./ 이 1번 이상 나오고, app|services 디렉터리로 들어가는 경우)
const relRe =
  /from\s+(['"])((?:\.{1,2}\/)+(?:app|services)\/[^'"]+)\1/g;

// 2) 동적 import
//    import("<relative path>") 형태
const dynRe =
  /import\((['"])((?:\.{1,2}\/)+(?:app|services)\/[^'"]+)\1\)/g;

// 확장자 있는지 판정 (ts/tsx/js/mjs/cjs 등 끝에 .<ext>가 있으면 true)
const hasKnownExt = (p) => /\.[cm]?(?:t|j)sx?$/i.test(p);

let changedCount = 0;

for (const f of files) {
  let code = fs.readFileSync(f, 'utf8');
  const orig = code;

  code = code.replace(relRe, (m, q, p) => {
    if (hasKnownExt(p)) return m;
    return `from ${q}${p}.js${q}`;
  });

  code = code.replace(dynRe, (m, q, p) => {
    if (hasKnownExt(p)) return m;
    return `import(${q}${p}.js${q})`;
  });

  if (code !== orig) {
    fs.writeFileSync(f, code);
    console.log('fixed', f);
    changedCount++;
  }
}

console.log(`Done. patched files: ${changedCount}`);
