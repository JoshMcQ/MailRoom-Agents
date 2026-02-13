#!/usr/bin/env ts-node
import { spawnSync } from 'child_process';

const result = spawnSync('supabase', ['db', 'push'], { stdio: 'inherit' });
if (result.status !== 0) {
  console.error('Failed to run supabase db push');
  process.exit(result.status ?? 1);
}
