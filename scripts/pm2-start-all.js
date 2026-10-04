#!/usr/bin/env node
/**
 * Bring all food-ordering PM2 apps back up after they were stopped or deleted.
 *
 *   node scripts/pm2-start-all.js            # start only what is not online
 *   node scripts/pm2-start-all.js --restart  # restart everything (even online apps)
 *   node scripts/pm2-start-all.js --dry-run  # show what would be done
 *
 * Deploy root defaults to D:\ICS-Projects\apps\food-ordering (same as the
 * Jenkinsfiles). Override with --root=<path> or the DEPLOY_ROOT env var.
 *
 * Per app:
 *   online               -> skip (or restart with --restart)
 *   stopped / errored    -> pm2 restart <name>
 *   missing (deleted)    -> cd <DEPLOY_DIR> && pm2 start ecosystem.config.js --only <name> --env production
 * Then `pm2 save` so the state survives a reboot.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const RESTART = args.includes('--restart');
const DRY_RUN = args.includes('--dry-run');
const rootArg = args.find((a) => a.startsWith('--root='));
const DEPLOY_ROOT =
  (rootArg && rootArg.slice('--root='.length)) ||
  process.env.DEPLOY_ROOT ||
  'D:\\ICS-Projects\\apps\\food-ordering';

// Backend first so the two frontends can reach it as soon as they boot.
const APPS = [
  { name: 'food-ordering-service', script: path.join('dist', 'main.js'), port: 5555 },
  { name: 'food-ordering-console', script: 'server.js', port: 8888 },
  { name: 'food-ordering-system', script: 'server.js', port: 8181 },
];

function run(cmd, cwd) {
  console.log(`  $ ${cwd ? `(cd ${cwd}) ` : ''}${cmd}`);
  if (DRY_RUN) return;
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function pm2List() {
  const out = execSync('pm2 jlist', { encoding: 'utf8' });
  // Some PM2 versions print warnings before the JSON payload.
  const start = out.indexOf('[');
  if (start === -1) throw new Error(`Unexpected "pm2 jlist" output:\n${out}`);
  return JSON.parse(out.slice(start));
}

function main() {
  console.log(`PM2_HOME    : ${process.env.PM2_HOME || '(default)'}`);
  console.log(`DEPLOY_ROOT : ${DEPLOY_ROOT}`);
  console.log(`Mode        : ${RESTART ? 'restart all' : 'start missing/stopped'}${DRY_RUN ? ' (dry run)' : ''}\n`);

  const procs = pm2List();
  const failed = [];

  for (const app of APPS) {
    const dir = path.join(DEPLOY_ROOT, app.name);
    const proc = procs.find((p) => p.name === app.name);
    const status = proc ? proc.pm2_env.status : 'not registered';
    console.log(`[${app.name}] status: ${status}`);

    try {
      if (proc && status === 'online' && !RESTART) {
        console.log('  already online, skipping');
      } else if (proc) {
        run(`pm2 restart ${app.name} --update-env`);
      } else {
        const ecosystem = path.join(dir, 'ecosystem.config.js');
        for (const required of [ecosystem, path.join(dir, app.script)]) {
          if (!fs.existsSync(required)) {
            throw new Error(`${required} not found — run the Jenkins job for ${app.name} first`);
          }
        }
        if (!fs.existsSync(path.join(dir, '.env'))) {
          console.warn(`  WARNING: ${path.join(dir, '.env')} not found, app may crash on boot`);
        }
        if (!DRY_RUN) fs.mkdirSync(path.join(dir, 'logs'), { recursive: true });
        run(`pm2 start ecosystem.config.js --only ${app.name} --env production`, dir);
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      failed.push(app.name);
    }
    console.log('');
  }

  run('pm2 save');
  if (!DRY_RUN) run('pm2 list');

  if (failed.length) {
    console.error(`\nFailed to start: ${failed.join(', ')}`);
    process.exit(1);
  }
  console.log('\nAll food-ordering apps are up.');
}

main();
