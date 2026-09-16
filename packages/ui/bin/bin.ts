#!/usr/bin/env node
import pleaseUpgradeNode from 'please-upgrade-node';

import packageJson from '../package.json' with { type: 'json' };

pleaseUpgradeNode(packageJson);

import('../src/cli').then(({ cli }) => cli());
