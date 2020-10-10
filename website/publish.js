#!/usr/bin/env node

const shell = require('shelljs');

const currentCommit = shell.exec('git rev-parse HEAD').stdout.trim();

const siteConfig = require(`${process.cwd()}/siteConfig.js`);

if (!shell.which('git')) {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}

console.log(shell.exec('git --version').stdout.trim());

if (shell.exec(`git worktree add build/gh-pages origin/gh-pages`).code !== 0) {
  shell.echo('Error: git worktree failed');
  shell.exit(1);
}

if (
  shell.exec(`cp -r build/${siteConfig.projectName}/* build/gh-pages/`).code !==
  0
) {
  shell.echo('Error: copy page failed');
  shell.exit(1);
}

shell.exec('cd build/gh-pages');
shell.exec('git add --all');
if (
  shell.exec(
    `git commit -m "Update Page" -m "Deploy website version based on ${currentCommit}"`
  ).code !== 0
) {
  shell.echo('Error: git commit failed');
  shell.exit(1);
}

if (shell.exec(`git push origin gh-pages`).code !== 0) {
  shell.echo('Error: Git push failed');
  shell.exit(1);
}
