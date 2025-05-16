import React from 'react';
import { Link, NavLink } from 'react-router-dom'; // Using NavLink for active styling
import './Sidebar.css'; // We'll create this next

const Sidebar = () => {
  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <h3>DBD-Core</h3> {/* Or your app name/logo */}
      </div>
      <ul>
        <li>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active-link' : ''}>Home</NavLink>
        </li>
        <li>
          <NavLink to="/vendors" className={({ isActive }) => isActive ? 'active-link' : ''}>Vendors</NavLink>
        </li>
        <li>
          <NavLink to="/products" className={({ isActive }) => isActive ? 'active-link' : ''}>Products</NavLink>
        </li>
        <li>
          <NavLink to="/customers" className={({ isActive }) => isActive ? 'active-link' : ''}>Customers</NavLink>
        </li>
        <li>
          <NavLink to="/order-entry" className={({ isActive }) => isActive ? 'active-link' : ''}>Order Entry</NavLink>
        </li>
        <li>
          <NavLink to="/invoices" className={({ isActive }) => isActive ? 'active-link' : ''}>Invoices</NavLink>
        </li>
        <li>
          <NavLink to="/general-ledger" className={({ isActive }) => isActive ? 'active-link' : ''}>General Ledger</NavLink>
        </li>
        <li>
          <NavLink to="/journalentry" className={({ isActive }) => isActive ? 'active-link' : ''}>Journal Entries</NavLink>
        </li>
        {/* Add more links as needed */}
      </ul>
    </nav>
  );
};

export default Sidebar;
