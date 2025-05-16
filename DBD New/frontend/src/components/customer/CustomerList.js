import React, { useState, useEffect, useCallback } from 'react';
import * as customerService from '../../services/customerService';
import './CustomerList.css';

const initialCustomerFormState = {
  CUST_CODE: '',
  CUST_NAME: '',
  CUST_CONTACT_PERSON: '',
  CUST_EMAIL: '',
  CUST_PHONE: '',
  CUST_ADDRESS: '',
  CUST_STATUS: 'Active',
};

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState(initialCustomerFormState);
  const [addFormError, setAddFormError] = useState(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null); // Stores the customer object being edited
  const [editFormError, setEditFormError] = useState(null);
  const [actionError, setActionError] = useState(null); // For general errors from delete/other actions

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setActionError(null); // Clear previous action errors
      const data = await customerService.getCustomers();
      setCustomers(data || []);
    } catch (err) {
      setError(err.message);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // --- Add Customer Handlers ---
  const handleAddNewCustomerClick = () => {
    setNewCustomer(initialCustomerFormState);
    setShowAddForm(true);
    setShowEditForm(false); // Ensure edit form is hidden
    setAddFormError(null);
  };

  const handleNewCustomerInputChange = (event) => {
    const { name, value } = event.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveNewCustomer = async (event) => {
    event.preventDefault();
    if (!newCustomer.CUST_NAME || !newCustomer.CUST_CODE) {
      setAddFormError('Customer Name and Code are required.');
      return;
    }
    try {
      setAddFormError(null);
      await customerService.addCustomer(newCustomer);
      setShowAddForm(false);
      fetchCustomers();
    } catch (err) {
      setAddFormError(`Failed to add customer: ${err.message}`);
    }
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewCustomer(initialCustomerFormState);
    setAddFormError(null);
  };

  // --- Edit Customer Handlers ---
  const handleEditCustomerClick = (customer) => {
    setEditingCustomer({ ...customer }); // Set the customer to edit, ensure it's a copy
    setShowEditForm(true);
    setShowAddForm(false); // Ensure add form is hidden
    setEditFormError(null);
  };

  const handleEditingCustomerInputChange = (event) => {
    const { name, value } = event.target;
    setEditingCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEditedCustomer = async (event) => {
    event.preventDefault();
    if (!editingCustomer || !editingCustomer.CUST_NAME || !editingCustomer.CUST_CODE) {
      setEditFormError('Customer Name and Code are required.');
      return;
    }
    try {
      setEditFormError(null);
      await customerService.updateCustomer(editingCustomer.id, editingCustomer);
      setShowEditForm(false);
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      setEditFormError(`Failed to update customer: ${err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingCustomer(null);
    setEditFormError(null);
  };

  // --- Delete Customer Handler ---
  const handleDeleteCustomerClick = async (customerId, customerName) => {
    setActionError(null); // Clear previous errors
    if (window.confirm(`Are you sure you want to delete customer "${customerName}" (ID: ${customerId})?`)) {
      try {
        await customerService.deleteCustomer(customerId);
        fetchCustomers(); // Refetch customers to update the list
      } catch (err) {
        setActionError(`Failed to delete customer: ${err.message}`);
        // Also log to console for more details if needed
        console.error(`Error deleting customer ${customerId}:`, err);
      }
    }
  };

  if (loading) {
    return <p>Loading customers...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  const renderCustomerForm = (formType) => {
    const isEdit = formType === 'edit';
    const customerData = isEdit ? editingCustomer : newCustomer;
    const handleChange = isEdit ? handleEditingCustomerInputChange : handleNewCustomerInputChange;
    const handleSubmit = isEdit ? handleSaveEditedCustomer : handleSaveNewCustomer;
    const handleCancel = isEdit ? handleCancelEdit : handleCancelAdd;
    const formError = isEdit ? editFormError : addFormError;
    const title = isEdit ? 'Edit Customer' : 'Add New Customer';

    if (!customerData) return null; // Should not happen if form is shown

    return (
      <form onSubmit={handleSubmit} className="customer-form">
        <h3>{title}</h3>
        {formError && <p className="error-message">{formError}</p>}
        <div>
          <label htmlFor={`${formType}-CUST_CODE`}>Customer Code:</label>
          <input
            type="text"
            id={`${formType}-CUST_CODE`}
            name="CUST_CODE"
            value={customerData.CUST_CODE}
            onChange={handleChange}
            required
            disabled={isEdit} // Typically, code/ID is not editable
          />
        </div>
        <div>
          <label htmlFor={`${formType}-CUST_NAME`}>Customer Name:</label>
          <input
            type="text"
            id={`${formType}-CUST_NAME`}
            name="CUST_NAME"
            value={customerData.CUST_NAME}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor={`${formType}-CUST_CONTACT_PERSON`}>Contact Person:</label>
          <input
            type="text"
            id={`${formType}-CUST_CONTACT_PERSON`}
            name="CUST_CONTACT_PERSON"
            value={customerData.CUST_CONTACT_PERSON || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor={`${formType}-CUST_EMAIL`}>Email:</label>
          <input
            type="email"
            id={`${formType}-CUST_EMAIL`}
            name="CUST_EMAIL"
            value={customerData.CUST_EMAIL || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor={`${formType}-CUST_PHONE`}>Phone:</label>
          <input
            type="tel"
            id={`${formType}-CUST_PHONE`}
            name="CUST_PHONE"
            value={customerData.CUST_PHONE || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor={`${formType}-CUST_ADDRESS`}>Address:</label>
          <input
            type="text"
            id={`${formType}-CUST_ADDRESS`}
            name="CUST_ADDRESS"
            value={customerData.CUST_ADDRESS || ''}
            onChange={handleChange}
          />
        </div>
        <div>
          <label htmlFor={`${formType}-CUST_STATUS`}>Status:</label>
          <select
            id={`${formType}-CUST_STATUS`}
            name="CUST_STATUS"
            value={customerData.CUST_STATUS}
            onChange={handleChange}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <button type="submit">Save Customer</button>
        <button type="button" onClick={handleCancel} className="cancel-button">
          Cancel
        </button>
      </form>
    );
  };

  return (
    <div className="customer-list-container">
      <h2>Customer Management</h2>
      
      {!showAddForm && !showEditForm && (
        <button onClick={handleAddNewCustomerClick} className="add-button">
          Add New Customer
        </button>
      )}

      {showAddForm && renderCustomerForm('add')}
      {showEditForm && renderCustomerForm('edit')}

      {actionError && <p className="error-message">{actionError}</p>} {/* Display general action errors */}

      {customers.length === 0 && !showAddForm && !showEditForm ? (
        <p>No customers found.</p>
      ) : (
        <ul className="customer-list">
          {customers.map((customer) => (
            <li key={customer.id} className="customer-item">
              <h3>{customer.CUST_NAME} ({customer.CUST_CODE})</h3>
              <p>Contact: {customer.CUST_CONTACT_PERSON || 'N/A'}</p>
              <p>Email: {customer.CUST_EMAIL}</p>
              <p>Phone: {customer.CUST_PHONE}</p>
              <p>Address: {customer.CUST_ADDRESS}</p>
              <p>Status: <span className={`status-${customer.CUST_STATUS?.toLowerCase()}`}>{customer.CUST_STATUS}</span></p>
              <div className="customer-item-actions">
                <button onClick={() => handleEditCustomerClick(customer)} className="edit-button">
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteCustomerClick(customer.id, customer.CUST_NAME)} 
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CustomerList;
