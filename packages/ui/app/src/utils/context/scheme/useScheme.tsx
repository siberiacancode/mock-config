'use client';

import React from 'react';

import { SchemeContext } from './SchemeContext';

export const useScheme = () => React.useContext(SchemeContext);
