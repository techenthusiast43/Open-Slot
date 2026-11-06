import React, { useState } from 'react';
import { Web3Provider, useWeb3 } from './context/Web3Context';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import TransactionModal from './components/TransactionModal';

// Pages
import LandingPage from './pages/LandingPage';
import BusinessRegistrationPage from './pages/BusinessRegistrationPage';
import BusinessDashboardPage from './pages/BusinessDashboardPage';
import CreateSlotPage from './pages/CreateSlotPage';
import BrowseBusinessesPage from './pages/BrowseBusinessesPage';
import AvailableSlotsPage from './pages/AvailableSlotsPage';
import CustomerDashboardPage from './pages/CustomerDashboardPage';
import BookingDetailsPage from './pages/BookingDetailsPage';

function AppContent() {
  const [activePage, setActivePage] = useState('landing');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  const { account, chainId, isBotChain, switchNetwork } = useWeb3();

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      
      {/* Wrong Network Notice Bar */}
      {account && !isBotChain && (
        <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between text-center sticky top-0 z-50 shadow-md">
          <div className="flex-1">
            You are connected to Chain ID {chainId}. OpenSlot requires BOT Chain Testnet (Chain ID 968).
          </div>
          <button
            onClick={switchNetwork}
            className="px-3 py-1 bg-white text-slate-900 rounded-md font-bold text-xs hover:bg-slate-100 transition-colors shrink-0"
          >
            Switch to BOT Chain
          </button>
        </div>
      )}

      {/* Global Navbar */}
      <Navbar activePage={activePage} setActivePage={setActivePage} />

      {/* Main Page Content */}
      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingPage
            setActivePage={setActivePage}
            setSelectedBusiness={setSelectedBusiness}
          />
        )}

        {activePage === 'register' && (
          <BusinessRegistrationPage setActivePage={setActivePage} />
        )}

        {activePage === 'dashboard' && (
          <BusinessDashboardPage
            setActivePage={setActivePage}
            setSelectedSlotId={setSelectedSlotId}
          />
        )}

        {activePage === 'create-slot' && (
          <CreateSlotPage setActivePage={setActivePage} />
        )}

        {activePage === 'businesses' && (
          <BrowseBusinessesPage
            setActivePage={setActivePage}
            setSelectedBusiness={setSelectedBusiness}
          />
        )}

        {activePage === 'available-slots' && (
          <AvailableSlotsPage
            businessAddress={selectedBusiness}
            setActivePage={setActivePage}
            setSelectedSlotId={setSelectedSlotId}
          />
        )}

        {activePage === 'my-bookings' && (
          <CustomerDashboardPage
            setActivePage={setActivePage}
            setSelectedSlotId={setSelectedSlotId}
            setSelectedBusiness={setSelectedBusiness}
          />
        )}

        {activePage === 'booking-details' && (
          <BookingDetailsPage
            slotId={selectedSlotId}
            setActivePage={setActivePage}
            setSelectedBusiness={setSelectedBusiness}
          />
        )}
      </main>

      {/* Transaction Feedback Modal */}
      <TransactionModal />

      {/* Global Footer */}
      <Footer setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

