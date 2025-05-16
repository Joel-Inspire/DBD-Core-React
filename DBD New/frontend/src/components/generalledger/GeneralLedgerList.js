import React, { useEffect, useState, useMemo } from 'react';
import {
  getGeneralLedgerAccounts,
  addGeneralLedgerAccount,
  updateGeneralLedgerAccount,
  deleteGeneralLedgerAccount
} from '../../services/generalLedgerService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './GeneralLedgerList.css';

// Helper function to format YYMMDD to MM/DD/YYYY
const formatGlDate = (dateString) => {
  if (!dateString || dateString.length !== 6) {
    return dateString; // Return original or empty if invalid
  }
  const year = dateString.substring(0, 2);
  const month = dateString.substring(2, 4);
  const day = dateString.substring(4, 6);
  // Assuming 20xx for years. Adjust if century can be different.
  return `${month}/${day}/20${year}`;
};

const GeneralLedgerList = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'accountNumber', direction: 'ascending' });
  const [filterTerm, setFilterTerm] = useState('');
  const [recordTypeFilter, setRecordTypeFilter] = useState(''); // For Record Type dropdown filter
  const [accountStatusFilter, setAccountStatusFilter] = useState(''); // For Account Status dropdown filter
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Default to 10 items per page
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    accountNumber: '', description: '', recordType: 'A', rollupCode: 'D', periodValidation: 'A', normalBalance: 'D', accountCategory: '', accountStatus: 'A', reportGroup: '', historyFlag: 'N', consolidationFlag: 'N', intercompanyFlag: 'N', allocationFlag: 'N', fasbGroup: '', unitsRequiredFlag: 'N', lastActivityDate: '', changedByOperator: 'USR', lastChangeDate: '',
  });
  const [showEditModal, setShowEditModal] = useState(false); // State for edit modal visibility
  const [editingAccount, setEditingAccount] = useState(null); // State for the account being edited

  const defaultNewAccountState = {
    accountNumber: '', description: '', recordType: 'A', rollupCode: 'D', periodValidation: 'A', normalBalance: 'D', accountCategory: '', accountStatus: 'A', reportGroup: '', historyFlag: 'N', consolidationFlag: 'N', intercompanyFlag: 'N', allocationFlag: 'N', fasbGroup: '', unitsRequiredFlag: 'N', lastActivityDate: '', changedByOperator: 'USR', lastChangeDate: '',
  };

  useEffect(() => {
    setNewAccount(defaultNewAccountState); // Initialize newAccount state
    fetchAllAccounts();
  }, []);

  const fetchAllAccounts = async () => {
    try {
      setLoading(true);
      const data = await getGeneralLedgerAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoized sorted and filtered accounts (before pagination)
  const filteredAndSortedAccounts = useMemo(() => {
    let processedAccounts = [...accounts];

    // Apply text filtering
    if (filterTerm) {
      processedAccounts = processedAccounts.filter(account =>
        account.accountNumber.toLowerCase().includes(filterTerm.toLowerCase()) ||
        (account.description && account.description.toLowerCase().includes(filterTerm.toLowerCase()))
      );
    }

    // Apply Record Type filter
    if (recordTypeFilter) {
      processedAccounts = processedAccounts.filter(account => account.recordType === recordTypeFilter);
    }

    // Apply Account Status filter
    if (accountStatusFilter) {
      processedAccounts = processedAccounts.filter(account => account.accountStatus === accountStatusFilter);
    }

    // Apply sorting
    if (sortConfig !== null) {
      processedAccounts.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return processedAccounts;
  }, [accounts, sortConfig, filterTerm, recordTypeFilter, accountStatusFilter]);

  // Calculate current accounts to display based on pagination
  const currentDisplayedAccounts = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredAndSortedAccounts.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredAndSortedAccounts, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedAccounts.length / itemsPerPage);
  }, [filteredAndSortedAccounts, itemsPerPage]);

  const handleFilterChange = (event) => {
    setFilterTerm(event.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const handleRecordTypeFilterChange = (event) => {
    setRecordTypeFilter(event.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleAccountStatusFilterChange = (event) => {
    setAccountStatusFilter(event.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleNewAccountChange = (event) => {
    const { name, value } = event.target;
    setNewAccount(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSaveNewAccount = async (event) => {
    event.preventDefault();
    if (!newAccount.accountNumber || !newAccount.description) {
      toast.error('Account Number and Description are required.');
      return;
    }
    try {
      const today = new Date();
      const year = today.getFullYear().toString().substring(2);
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const currentDateYYMMDD = `${year}${month}${day}`;

      await addGeneralLedgerAccount({ ...newAccount, lastChangeDate: currentDateYYMMDD });
      setShowAddModal(false);
      setNewAccount({
        accountNumber: '', description: '', recordType: 'A', rollupCode: 'D', periodValidation: 'A', normalBalance: 'D', accountCategory: '', accountStatus: 'A', reportGroup: '', historyFlag: 'N', consolidationFlag: 'N', intercompanyFlag: 'N', allocationFlag: 'N', fasbGroup: '', unitsRequiredFlag: 'N', lastActivityDate: '', changedByOperator: 'USR', lastChangeDate: '',
      });
      fetchAllAccounts(); // Re-fetch accounts to show the new one
      toast.success(`Account ${newAccount.accountNumber} added successfully!`);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to add account: ${err.message}`);
    }
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account); // Set the full account object
    setShowEditModal(true);
  };

  const handleEditAccountChange = (event) => {
    const { name, value } = event.target;
    setEditingAccount(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSaveEditAccount = async (event) => {
    event.preventDefault();
    if (!editingAccount || !editingAccount.accountNumber || !editingAccount.description) {
      toast.error('Account Number and Description are required.');
      return;
    }
    try {
      const today = new Date();
      const year = today.getFullYear().toString().substring(2);
      const month = (today.getMonth() + 1).toString().padStart(2, '0');
      const day = today.getDate().toString().padStart(2, '0');
      const currentDateYYMMDD = `${year}${month}${day}`;

      // Only send necessary fields, especially if 'id' should not be in the body for PUT
      // For json-server, sending 'id' in the body is fine.
      const { id, ...dataToUpdate } = editingAccount;
      await updateGeneralLedgerAccount(id, { ...dataToUpdate, lastChangeDate: currentDateYYMMDD, changedByOperator: 'USR' }); // Assuming USR for now

      setShowEditModal(false);
      setEditingAccount(null);
      fetchAllAccounts(); // Re-fetch accounts
      toast.success(`Account ${editingAccount.accountNumber} updated successfully!`);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to update account: ${err.message}`);
    }
  };

  const handleDeleteAccount = async (accountId, accountNumber) => {
    if (window.confirm(`Are you sure you want to delete account ${accountNumber}? This action cannot be undone.`)) {
      try {
        await deleteGeneralLedgerAccount(accountId);
        fetchAllAccounts(); // Re-fetch accounts to reflect the deletion
        toast.success(`Account ${accountNumber} deleted successfully!`);
      } catch (err) {
        setError(err.message);
        toast.error(`Failed to delete account: ${err.message}`);
      }
    }
  };

  // Options for dropdowns
  const recordTypeOptions = [
    { value: 'A', label: 'A - Asset' },
    { value: 'L', label: 'L - Liability' },
    { value: 'E', label: 'E - Equity' },
    { value: 'R', label: 'R - Revenue' },
    { value: 'C', label: 'C - Cost of Sales' },
  ];

  const rollupCodeOptions = [
    { value: 'D', label: 'D - Detail' },
    { value: 'S', label: 'S - Summary' },
  ];

  const normalBalanceOptions = [
    { value: 'D', label: 'D - Debit' },
    { value: 'C', label: 'C - Credit' },
  ];

  const accountStatusOptions = [
    { value: 'A', label: 'A - Active' },
    { value: 'I', label: 'I - Inactive' },
  ];

  const yesNoOptions = [
    { value: 'Y', label: 'Y - Yes' },
    { value: 'N', label: 'N - No' },
  ];

  if (loading) {
    return <p>Loading General Ledger accounts...</p>;
  }

  if (error) {
    return <p>Error loading accounts: {error}</p>;
  }

  if (accounts.length === 0) {
    return <p>No General Ledger accounts found.</p>;
  }

  const getSortDirectionClass = (name) => {
    if (!sortConfig || sortConfig.key !== name) {
      return '';
    }
    return sortConfig.direction === 'ascending' ? 'sorted-asc' : 'sorted-desc';
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="general-ledger-container">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <h2>Chart of Accounts</h2>
      <div className="controls-container">
        <button onClick={() => setShowAddModal(true)} className="add-button">Add New Account</button>
        <div className="filter-container">
          <input
            type="text"
            placeholder="Filter by Account # or Description..."
            value={filterTerm}
            onChange={handleFilterChange}
            className="filter-input"
          />
          <select value={recordTypeFilter} onChange={handleRecordTypeFilterChange} className="filter-dropdown">
            <option value="">All Record Types</option>
            {recordTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={accountStatusFilter} onChange={handleAccountStatusFilterChange} className="filter-dropdown">
            <option value="">All Account Statuses</option>
            {accountStatusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => setShowAddModal(false)}>&times;</span>
            <h3>Add New General Ledger Account</h3>
            <form onSubmit={handleSaveNewAccount}>
              <div className="form-group">
                <label htmlFor="accountNumber">Account Number:</label>
                <input type="text" id="accountNumber" name="accountNumber" value={newAccount.accountNumber} onChange={handleNewAccountChange} maxLength="12" required />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <input type="text" id="description" name="description" value={newAccount.description} onChange={handleNewAccountChange} maxLength="35" required />
              </div>
              <div className="form-group">
                <label htmlFor="recordType">Record Type:</label>
                <select id="recordType" name="recordType" value={newAccount.recordType} onChange={handleNewAccountChange}>
                  {recordTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="normalBalance">Normal Balance:</label>
                <select id="normalBalance" name="normalBalance" value={newAccount.normalBalance} onChange={handleNewAccountChange}>
                  {normalBalanceOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="accountCategory">Account Category:</label>
                <input type="text" id="accountCategory" name="accountCategory" value={newAccount.accountCategory} onChange={handleNewAccountChange} maxLength="2" />
              </div>
              <div className="form-group">
                <label htmlFor="rollupCode">Rollup Code:</label>
                <select id="rollupCode" name="rollupCode" value={newAccount.rollupCode} onChange={handleNewAccountChange}>
                  {rollupCodeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="accountStatus">Account Status:</label>
                <select id="accountStatus" name="accountStatus" value={newAccount.accountStatus} onChange={handleNewAccountChange}>
                  {accountStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reportGroup">Report Group:</label>
                <input type="text" id="reportGroup" name="reportGroup" value={newAccount.reportGroup} onChange={handleNewAccountChange} maxLength="2" />
              </div>
              <div className="form-group">
                <label htmlFor="fasbGroup">FASB Group:</label>
                <input type="text" id="fasbGroup" name="fasbGroup" value={newAccount.fasbGroup} onChange={handleNewAccountChange} maxLength="4" />
              </div>
              <div className="form-group">
                <label htmlFor="unitsRequiredFlag">Units Required:</label>
                <select id="unitsRequiredFlag" name="unitsRequiredFlag" value={newAccount.unitsRequiredFlag} onChange={handleNewAccountChange}>
                  {yesNoOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="save-button">Save Account</button>
              <button type="button" onClick={() => setShowAddModal(false)} className="cancel-button">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingAccount && (
        <div className="modal">
          <div className="modal-content">
            <span className="close-button" onClick={() => { setShowEditModal(false); setEditingAccount(null); }}>&times;</span>
            <h3>Edit General Ledger Account</h3>
            <form onSubmit={handleSaveEditAccount}>
              <div className="form-group">
                <label htmlFor="editAccountNumber">Account Number:</label>
                <input type="text" id="editAccountNumber" name="accountNumber" value={editingAccount.accountNumber} onChange={handleEditAccountChange} maxLength="12" required />
              </div>
              <div className="form-group">
                <label htmlFor="editDescription">Description:</label>
                <input type="text" id="editDescription" name="description" value={editingAccount.description} onChange={handleEditAccountChange} maxLength="35" required />
              </div>
              <div className="form-group">
                <label htmlFor="editRecordType">Record Type:</label>
                <select id="editRecordType" name="recordType" value={editingAccount.recordType || ''} onChange={handleEditAccountChange}>
                  {recordTypeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="editNormalBalance">Normal Balance:</label>
                <select id="editNormalBalance" name="normalBalance" value={editingAccount.normalBalance || ''} onChange={handleEditAccountChange}>
                  {normalBalanceOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="editAccountCategory">Account Category:</label>
                <input type="text" id="editAccountCategory" name="accountCategory" value={editingAccount.accountCategory || ''} onChange={handleEditAccountChange} maxLength="2" />
              </div>
              <div className="form-group">
                <label htmlFor="editRollupCode">Rollup Code:</label>
                <select id="editRollupCode" name="rollupCode" value={editingAccount.rollupCode || ''} onChange={handleEditAccountChange}>
                  {rollupCodeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="editAccountStatus">Account Status:</label>
                <select id="editAccountStatus" name="accountStatus" value={editingAccount.accountStatus || ''} onChange={handleEditAccountChange}>
                  {accountStatusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="editReportGroup">Report Group:</label>
                <input type="text" id="editReportGroup" name="reportGroup" value={editingAccount.reportGroup || ''} onChange={handleEditAccountChange} maxLength="2" />
              </div>
              <div className="form-group">
                <label htmlFor="editFasbGroup">FASB Group:</label>
                <input type="text" id="editFasbGroup" name="fasbGroup" value={editingAccount.fasbGroup || ''} onChange={handleEditAccountChange} maxLength="4" />
              </div>
              <div className="form-group">
                <label htmlFor="editUnitsRequiredFlag">Units Required:</label>
                <select id="editUnitsRequiredFlag" name="unitsRequiredFlag" value={editingAccount.unitsRequiredFlag || ''} onChange={handleEditAccountChange}>
                  {yesNoOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="save-button">Update Account</button>
              <button type="button" onClick={() => { setShowEditModal(false); setEditingAccount(null); }} className="cancel-button">Cancel</button>
            </form>
          </div>
        </div>
      )}

      <table className="general-ledger-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('accountNumber')} className={getSortDirectionClass('accountNumber')}>Account Number</th>
            <th onClick={() => requestSort('description')} className={getSortDirectionClass('description')}>Description</th>
            <th>Type</th>
            <th>Normal Bal.</th>
            <th>Category</th>
            <th>Status</th>
            <th>Rollup Code</th>
            <th>Report Group</th>
            <th>Last Activity</th>
            <th>Last Change</th>
            <th>Period Valid.</th>
            <th>History Flag</th>
            <th>FASB Group</th>
            <th>Changed By</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentDisplayedAccounts.length > 0 ? (
            currentDisplayedAccounts.map(account => (
              <tr key={account.id}>
                <td>{account.accountNumber}</td>
                <td>{account.description}</td>
                <td>{account.recordType}</td>
                <td>{account.normalBalance}</td>
                <td>{account.accountCategory}</td>
                <td>{account.accountStatus}</td>
                <td>{account.rollupCode}</td>
                <td>{account.reportGroup}</td>
                <td>{formatGlDate(account.lastActivityDate)}</td>
                <td>{formatGlDate(account.lastChangeDate)}</td>
                <td>{account.periodValidation}</td>
                <td>{account.historyFlag}</td>
                <td>{account.fasbGroup}</td>
                <td>{account.changedByOperator}</td>
                <td>
                  <button onClick={() => handleEditAccount(account)} className="edit-button">Edit</button>
                  <button onClick={() => handleDeleteAccount(account.id, account.accountNumber)} className="delete-button">Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="15">No accounts found matching your criteria.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="pagination-controls">
        {/* Placeholder for pagination UI */}
      </div>

    </div>
  );
};

export default GeneralLedgerList;
