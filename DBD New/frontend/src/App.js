import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link
} from 'react-router-dom';
import './App.css';
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
        <nav className="app-nav">
          <ul>
            <li>
              <Link to="/">Home (Vendors)</Link>
            </li>
            <li>
              <Link to="/products">Products</Link>
            </li>
            <li>
              <Link to="/customers">Customers</Link>
            </li>
            <li>
              <Link to="/general-ledger">General Ledger</Link>
            </li>
            <li>
              <Link to="/journalentry">Journal Entries</Link>
            </li>
            <li>
              <Link to="/order-entry">Order Entry</Link> 
            </li>
            <li>
              <Link to="/invoices">Invoices</Link>
            </li>
          </ul>
        </nav>

        <div className="app-content">
          <Routes>
            <Route path="/" element={<VendorList />} />
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
