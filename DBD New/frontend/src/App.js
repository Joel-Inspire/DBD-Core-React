import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from 'react-router-dom';
import './App.css';
import Sidebar from './components/layout/Sidebar'; 
import HomePage from './components/layout/HomePage'; 
import VendorList from './components/Vendor/VendorList';
import ProductList from './components/product/ProductList'; 
import CustomerList from './components/customer/CustomerList'; 
import GeneralLedgerList from './components/generalledger/GeneralLedgerList';
import JournalEntryList from './components/journalEntry/JournalEntryList'; 
import OrderEntryList from './components/orderEntry/OrderEntryList'; 
import InvoiceList from './components/accountsReceivable/InvoiceList'; 

function App() {
  return (
    <Router>
      <div className="App"> 
        <Sidebar /> 
        <div className="app-content"> 
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/sales-orders" element={<OrderEntryList />} />
            <Route path="/invoices" element={<InvoiceList />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/gl-dashboard" element={<GeneralLedgerList />} />
            <Route path="/journal-entries" element={<JournalEntryList />} />
            <Route path="/general-ledger" element={<GeneralLedgerList />} />
            <Route path="/journalentry" element={<JournalEntryList />} />
            <Route path="/order-entry" element={<OrderEntryList />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
