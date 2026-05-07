#!/usr/bin/env node
/* eslint-disable ts/no-require-imports */

const pleaseUpgradeNode = require('please-upgrade-node');

const packageJson = require('../package.json');

pleaseUpgradeNode(packageJson);

import('./cli.mjs').then(({ cli }) => cli());
