#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
/* eslint-disable ts/no-require-imports */ const pleaseUpgradeNode = require('please-upgrade-node');
const packageJson = require('../../package.json');
pleaseUpgradeNode(packageJson);
const { cli } = require('./cli');
cli();
