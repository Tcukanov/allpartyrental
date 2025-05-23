'use client';

import React from 'react';
import PayPalOnboarding from './PayPalOnboarding';

const PayPalConnectButton = ({ sandbox = false, onSuccess }) => {
  return <PayPalOnboarding />;
};

export default PayPalConnectButton; 