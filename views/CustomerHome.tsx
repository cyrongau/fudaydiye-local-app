import React from 'react';
import { usePlatform } from '../hooks/usePlatform';
import MobileCustomerHome from './MobileCustomerHome';
import WebCustomerHome from './WebCustomerHome';

const CustomerHome: React.FC = () => {
   // We now use the unified WebCustomerHome for both platforms
   usePlatform();

   return <WebCustomerHome />;
};

export default CustomerHome;
