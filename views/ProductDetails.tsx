import React from 'react';
import { Capacitor } from '@capacitor/core';
import WebProductDetails from './WebProductDetails';
import MobileProductDetails from './MobileProductDetails';

const ProductDetails: React.FC = () => {
  // We can safely do this check because these components don't share state directly via this parent, 
  // and we are not using any hooks in this parent wrapper that would be conditional.
  // The conditional rendering here is at the "Component Tree" level.

  // Note: window.innerWidth is not reactive, but for a page load decision it's often sufficient.
  // Ideally use a useWindowSize hook, but that itself must be called unconditionally.

  // Let's use a cleaner approach: render the one that matches.
  // However, to be 100% safe with hooks in child components, we mount only one of them.

  // Since we are not using hooks IN THIS COMPONENT, we can just return based on logic.
  const isMobile = window.innerWidth < 768;
  const isNative = Capacitor.isNativePlatform();

  if (isNative || isMobile) {
    return <MobileProductDetails />;
  }

  return <WebProductDetails />;
};

export default ProductDetails;
