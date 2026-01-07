
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { db } from './firebase';
import { UserRole } from '../types';

/**
 * Seeds the database with core platform nodes:
 * - 1 System Super Admin
 * - 1 Initial Platform Customer
 * - 10 Platform FAQs
 * 
 * Mock riders and additional test customers have been removed 
 * to ensure the environment is strictly real-data driven.
 */
export const seedTestUsers = async () => {
  const batch = writeBatch(db);
  
  // 1. Super Admin Profile (Root Identity)
  const adminRef = doc(db, "users", "system_super_admin");
  batch.set(adminRef, {
    uid: "system_super_admin",
    fullName: "System Super Admin",
    email: "admin@fudaydiye.so",
    mobile: "+252634440000",
    role: 'ADMIN' as UserRole,
    location: 'Hargeisa HQ',
    walletBalance: 0.00,
    rewardPoints: 0,
    trustScore: 100,
    trustTier: 'GOLD',
    createdAt: serverTimestamp(),
    avatar: `https://ui-avatars.com/api/?name=Admin&background=015754&color=06DC7F`
  });

  // 2. Initial Platform Customer Node
  const initialCustRef = doc(db, "users", "initial_customer_01");
  batch.set(initialCustRef, {
    uid: "initial_customer_01",
    fullName: "Fudaydiye Tester",
    email: "customer@fudaydiye.so",
    mobile: "+252634440099",
    role: 'CUSTOMER' as UserRole,
    location: 'Hargeisa Central',
    walletBalance: 500.00,
    rewardPoints: 120,
    trustScore: 90,
    trustTier: 'SILVER',
    createdAt: serverTimestamp(),
    avatar: `https://ui-avatars.com/api/?name=Tester&background=015754&color=06DC7F`
  });

  // 3. Platform Knowledge Base (FAQs)
  const faqData = [
    { title: "What is Fudaydiye Cloud?", category: "General", content: "Fudaydiye is Somaliland's premier commerce and logistics mesh. We connect vendors with customers through real-time social commerce and high-speed delivery nodes." },
    { title: "How does Atomic Dispatch work?", category: "Logistics", content: "Atomic Dispatch is our elite tier delivery protocol. For eligible zones in Hargeisa, we guarantee delivery in under 60 minutes using our fleet of optimized Bajaj and motorcycle nodes." },
    { title: "How can I become a Verified Merchant?", category: "Onboarding", content: "Select the 'Merchant' identity in the hub, complete your business registry, and submit KYC documents. Verification takes 24-48 hours." },
    { title: "Is payment direct or third-party?", category: "Finance", content: "Fudaydiye utilizes direct API tunnels with regional telecommunications (Telesom, Somtel) and banks (Premier). This eliminates middlemen and ensures maximum security and speed." },
    { title: "What are User Trust Tiers?", category: "Trust", content: "Users progress from Bronze to Platinum based on shopping frequency and fulfillment history. Gold/Platinum users unlock the 'Promote & Earn' module." },
    { title: "Can I track my rider in real-time?", category: "Tracking", content: "Yes! Once a dispatch captain is assigned, you can open the Live Tracker in your Order Hub to see their exact GPS node moving through the city." },
    { title: "How do I earn as a Promoter?", category: "Promoter", content: "If you have attained Gold Tier, activate your Promoter Hub. Share merchant product nodes to earn commissions on every successful mesh transaction." },
    { title: "What regions do you serve?", category: "Logistics", content: "Currently, we operate dense meshes in Hargeisa and Berbera. Logistics nodes in Borama and Burco are coming online in the next cycle." },
    { title: "How do I request a refund?", category: "Support", content: "Go to your Order Hub, select the order node, and trigger 'Order Recovery'. Our AI Judge will analyze the dispute based on your trust score." },
    { title: "What is the Direct Channel support?", category: "Support", content: "Direct Channel is a secure peer-to-peer comms tunnel with our human support nodes for instant assistance with payments or logistics." }
  ];

  for (const faq of faqData) {
    const ref = doc(collection(db, "cms_content"));
    batch.set(ref, {
      ...faq,
      type: 'FAQ',
      status: 'PUBLISHED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  try {
    await batch.commit();
    console.log("Infrastructure provisioned. Root nodes authorized.");
    return true;
  } catch (err) {
    console.error("Provisioning failure:", err);
    return false;
  }
};
