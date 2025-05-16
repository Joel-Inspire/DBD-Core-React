import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We'll create this next

const HomePage = () => {
  return (
    <div className="home-page-container">
      <header className="home-header">
        <h1>Welcome to DBD-Core Application</h1>
        <p>Your central hub for managing business operations.</p>
      </header>
      
      <section className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {/* Example: Link to a frequently used module */}
          {/* Replace with actual links or interactive elements later */}
          <div className="action-card">
            <h4>View Invoices</h4>
            <p>Access and manage customer invoices.</p>
            <Link to="/invoices" className="button-primary">Go to Invoices</Link>
          </div>
          <div className="action-card">
            <h4>Manage Products</h4>
            <p>Update and review product catalog.</p>
            <Link to="/products" className="button-primary">Go to Products</Link>
          </div>
          <div className="action-card">
            <h4>Enter Orders</h4>
            <p>Create new sales or purchase orders.</p>
            <Link to="/sales-orders" className="button-primary">Go to Order Entry</Link>
          </div>
        </div>
      </section>

      <section className="dashboard-summary">
        <h2>Dashboard Overview</h2>
        <p>Key metrics and summaries will be displayed here in the future.</p>
        {/* Placeholder for charts or data summaries */}
        <div className="summary-placeholder">
          <p>[Chart/Summary Area 1]</p>
          <p>[Chart/Summary Area 2]</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
