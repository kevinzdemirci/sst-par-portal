/**
 * One-time: replace the old GitHub Pages site (kevinzdemirci.github.io/sst-par-portal)
 * with a redirect to the portal's new home on Firebase Hosting, keeping any path/query.
 *   npm run retire:github-pages
 */
import { execSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const NEW_HOME = 'https://sst-par-portal.web.app';
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>SST Personnel Action Request Portal has moved</title>
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0; url=${NEW_HOME}/">
<script>
  var rest = location.pathname.replace(/^\\/sst-par-portal\\/?/, '/');
  location.replace('${NEW_HOME}' + rest + location.search + location.hash);
</script>
</head>
<body style="font-family: system-ui, sans-serif; padding: 2rem;">
<p>The SST Personnel Action Request Portal has moved to <a href="${NEW_HOME}/">${NEW_HOME}</a>.</p>
</body>
</html>
`;

const dir = mkdtempSync(join(tmpdir(), 'sst-gh-redirect-'));
writeFileSync(join(dir, 'index.html'), page);
writeFileSync(join(dir, '404.html'), page);
const remote = execSync('git remote get-url origin').toString().trim();
const run = cmd => execSync(cmd, { cwd: dir, stdio: 'inherit' });
run('git init -q');
run('git checkout -q -b gh-pages');
run('git add -A');
run('git commit -q -m "Redirect to https://sst-par-portal.web.app"');
run(`git push -f "${remote}" gh-pages`);
console.log(`\nDone. The old GitHub address now redirects to ${NEW_HOME}`);
