import React, { useState, useMemo, useEffect } from 'react';
import './VendorList.css';
import {
  getVendors as apiGetVendors,
  addVendor as apiAddVendor,
  updateVendor as apiUpdateVendor,
  deleteVendor as apiDeleteVendor
} from '../../services/vendorService';

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [newVendor, setNewVendor] = useState({
    VEND_DIV: '',
    VEND_CODE: '',
    VEND_NAME: '',
    VEND_CITY: '',
    VEND_PHONE: '',
    id: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingVendorId, setEditingVendorId] = useState(null);
  const [filterTerm, setFilterTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'VEND_NAME', direction: 'ascending' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGetVendors();
        setVendors(data);
      } catch (err) {
        console.error("Failed to fetch vendors:", err);
        setError(err.message || 'Failed to load vendors. Please try again later.');
      }
      setLoading(false);
    };

    fetchVendors();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewVendor({ ...newVendor, [name]: value });
  };

  const handleDeleteVendor = async (vendorId, vendorName) => {
    if (window.confirm(`Are you sure you want to delete vendor ${vendorName} (${vendorId})?`)) {
      setLoading(true);
      setError(null);
      try {
        await apiDeleteVendor(vendorId);
        setVendors(vendors.filter(vendor => vendor.id !== vendorId));
        alert(`Vendor ${vendorName} (${vendorId}) deleted successfully!`);
      } catch (err) {
        console.error("Failed to delete vendor:", err);
        setError(err.message || `Failed to delete vendor ${vendorName}. Please try again.`);
      }
      setLoading(false);
    }
  };

  const handleEditVendor = (vendorToEdit) => {
    setIsEditing(true);
    setEditingVendorId(vendorToEdit.id);
    setNewVendor({ ...vendorToEdit });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingVendorId(null);
    setNewVendor({ VEND_DIV: '', VEND_CODE: '', VEND_NAME: '', VEND_CITY: '', VEND_PHONE: '', id: '' });
    setError(null);
  };

  const handleFilterChange = (e) => {
    setFilterTerm(e.target.value);
  };

  const handleSaveVendor = async (e) => {
    e.preventDefault();
    if (!newVendor.VEND_CODE || !newVendor.VEND_NAME) {
      alert('Vendor Code and Vendor Name are required.');
      return;
    }

    setLoading(true);
    setError(null);
    const vendorDataToSave = { ...newVendor };

    try {
      if (isEditing) {
        const updatedVendor = await apiUpdateVendor(editingVendorId, vendorDataToSave);
        setVendors(vendors.map(vendor => 
          vendor.id === editingVendorId ? updatedVendor : vendor 
        ));
        alert(`Vendor ${updatedVendor.VEND_NAME} (${editingVendorId}) updated successfully!`);
      } else {
        const addedVendor = await apiAddVendor(vendorDataToSave);
        setVendors([...vendors, addedVendor]);
        alert(`Vendor ${addedVendor.VEND_NAME} (${addedVendor.id}) added successfully!`);
      }
      handleCancelEdit();
    } catch (err) {
      console.error("Failed to save vendor:", err);
      const action = isEditing ? 'update' : 'add';
      setError(err.message || `Failed to ${action} vendor. Please try again.`);
    }
    setLoading(false);
  };

  const filteredAndSortedVendors = useMemo(() => {
    let sortableVendors = [...vendors];
    if (filterTerm) {
      sortableVendors = sortableVendors.filter(vendor =>
        Object.values(vendor).some(value =>
          String(value).toLowerCase().includes(filterTerm.toLowerCase())
        )
      );
    }
    if (sortConfig !== null) {
      sortableVendors.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableVendors;
  }, [vendors, filterTerm, sortConfig]);

  if (loading) {
    return <div className="vendor-list-container centered-message">Loading vendors...</div>;
  }

  if (error) {
    return (
      <div className="vendor-list-container centered-message error-message">
        <h1>Vendor Management</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="vendor-list-container">
      <h1>Vendor Management</h1>
      
      <button onClick={() => setShowAddVendorModal(true)} className="add-vendor-button">
        Add New Vendor
      </button>

      {filteredAndSortedVendors.length === 0 && !loading ? (
        <p className="empty-state-message">No vendors found.</p>
      ) : (
        <ul className="vendor-items-list">
          {filteredAndSortedVendors.map(vendor => (
            <li key={vendor.id || vendor.VEND_CODE} className="vendor-item">
              {vendor.VEND_NAME} - {vendor.VEND_CODE}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default VendorList;
