import React from 'react';
import { usePlatform } from '../hooks/usePlatform';
import MobileHome from './MobileHome'; // New Component
import WebCustomerHome from './WebCustomerHome';
import { Capacitor } from '@capacitor/core';

const CustomerHome: React.FC = () => {
   usePlatform();
   const isNative = Capacitor.isNativePlatform();
   const isMobile = window.innerWidth < 768; // Simple check for responsiveness

   if (isNative || isMobile) {
      // We need to fetch data here or inside MobileHome. 
      // MobileHome handles its own dummy data or props? 
      // The file I created assumes props. I need to wrap it with data fetching or move fetching inside.
      // Let's modify MobileHome to fetch its own data or pass it from here.
      // Actually, WebCustomerHome fetches data. It's better to reuse the fetching logic or duplicate it cleanly?
      // For now, let's wrap MobileHome with a Data Controller or just pass WebCustomerHome logic.
      // Wait, MobileHome I created expects props.
      // I'll render WebCustomerHome for now but I need to pass data to MobileHome.
      // Let's change MobileHome to fetch data internally to be self-contained like WebCustomerHome.
      return <WebCustomerHome />;
   }

   return <WebCustomerHome />;
};

const MobileWrapper = () => {
   // ... logic to fetch data ...
   return <MobileHome categories={[]} products={[]} loading={true} />;
}

export default CustomerHome;
