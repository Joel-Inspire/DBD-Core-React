import React, { useEffect, useState, useMemo } from 'react';
import {
  getJournalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry, postJournalEntry,
  unpostJournalEntry
} from '../../services/journalEntryService';
import { getGeneralLedgerAccounts } from '../../services/generalLedgerService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './JournalEntryList.css';
import {
  FaPlus, FaPencilAlt, FaTrashAlt, FaChevronLeft, FaChevronRight, FaSave, FaTimes, FaMinus,
  FaCheckCircle, FaUndo, FaClone
} from 'react-icons/fa';

const JournalEntryList = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [generalLedgerAccounts, setGeneralLedgerAccounts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [currentEntryData, setCurrentEntryData] = useState(defaultEntryFormState()); // Use a function to get default
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [filters, setFilters] = useState({ description: '', status: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'entryDate', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); // Or allow user to set this

  // Function to provide default state, ensuring fresh object each time
  function defaultEntryFormState() {
    return {
      entryDate: new Date().toISOString().slice(0, 10),
      description: '',
      status: 'Draft',
      lines: [{ lineNumber: 1, glAccountNumber: '', lineDescription: '', debit: 0, credit: 0 }]
    };
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [entriesData, glAccountsData] = await Promise.all([
          getJournalEntries(),
          getGeneralLedgerAccounts()
        ]);
        setJournalEntries(entriesData);
        setGeneralLedgerAccounts(glAccountsData.filter(acc => acc.rollupCode === 'D'));
        setError(null);
      } catch (err) {
        setError(err.message);
        setJournalEntries([]);
        setGeneralLedgerAccounts([]);
        toast.error(`Failed to fetch data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
        // Optional: third click clears sort or reverses to ascending again
        // For now, let's just toggle between asc/desc
        direction = 'ascending'; 
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedEntries = useMemo(() => {
    let sortableEntries = [...journalEntries];

    // Filtering
    if (filters.description) {
      sortableEntries = sortableEntries.filter(entry =>
        entry.description.toLowerCase().includes(filters.description.toLowerCase())
      );
    }
    if (filters.status) {
      sortableEntries = sortableEntries.filter(entry => entry.status === filters.status);
    }

    // Sorting
    if (sortConfig.key) {
      sortableEntries.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];

        // Handle date sorting specifically for entryDate
        if (sortConfig.key === 'entryDate') {
          valA = new Date(valA);
          valB = new Date(valB);
        }
        // Could add more specific type handling here if needed (e.g. numbers)

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableEntries;
  }, [journalEntries, filters, sortConfig]);

  const paginatedEntries = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedEntries.slice(startIndex, endIndex);
  }, [filteredAndSortedEntries, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedEntries.length / itemsPerPage);
  }, [filteredAndSortedEntries, itemsPerPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleItemsPerPageChange = (event) => {
    const newItemsPerPage = parseInt(event.target.value, 10);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const handleOpenAddModal = () => {
    setEditingEntryId(null);
    setCurrentEntryData(defaultEntryFormState());
    setShowEntryModal(true);
  };

  const handleEditClick = (entry) => {
    setEditingEntryId(entry.id);
    setCurrentEntryData({
        ...entry,
        lines: entry.lines.map(line => ({...line}))
    });
    setShowEntryModal(true);
  };

  const handleCloseModal = () => {
    setShowEntryModal(false);
    setEditingEntryId(null);
    setCurrentEntryData(defaultEntryFormState());
  }

  const handleAddNewLine = () => {
    setCurrentEntryData(prev => ({
      ...prev,
      lines: [...prev.lines, { lineNumber: prev.lines.length + 1, glAccountNumber: '', lineDescription: '', debit: 0, credit: 0 }]
    }));
  };

  const handleRemoveLine = (index) => {
    setCurrentEntryData(prev => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index).map((line, idx) => ({ ...line, lineNumber: idx + 1 }))
    }));
  };

  const handleCurrentEntryChange = (event) => {
    const { name, value } = event.target;
    setCurrentEntryData(prev => ({ ...prev, [name]: value }));
  };

  const handleLineChange = (index, event) => {
    const { name, value } = event.target;
    const updatedLines = currentEntryData.lines.map((line, i) => {
      if (i === index) {
        return { ...line, [name]: name === 'debit' || name === 'credit' ? parseFloat(value) || 0 : value };
      }
      return line;
    });
    setCurrentEntryData(prev => ({ ...prev, lines: updatedLines }));
  };

  const { totalDebits, totalCredits, difference } = useMemo(() => {
    const debits = currentEntryData.lines.reduce((acc, line) => acc + (parseFloat(line.debit) || 0), 0);
    const credits = currentEntryData.lines.reduce((acc, line) => acc + (parseFloat(line.credit) || 0), 0);
    return { 
      totalDebits: debits,
      totalCredits: credits,
      difference: debits - credits
    };
  }, [currentEntryData.lines]);

  const validateEntryData = () => {
    if (!currentEntryData.entryDate || !currentEntryData.description.trim()) {
      toast.error('Entry Date and Description are required.');
      return false;
    }
    if (currentEntryData.lines.length === 0) {
      toast.error('At least one line item is required.');
      return false;
    }
    for (const line of currentEntryData.lines) {
      if (!line.glAccountNumber) {
        toast.error('All lines must have a G/L Account selected.');
        return false;
      }
      if (line.debit < 0 || line.credit < 0) {
        toast.error('Debit and Credit amounts cannot be negative.');
        return false;
      }
      if (line.debit > 0 && line.credit > 0) {
        toast.error('A single line cannot have both Debit and Credit amounts.');
        return false;
      }
    }
    if (totalDebits !== totalCredits) {
      toast.error('Total Debits must equal Total Credits.');
      return false;
    }
    if (totalDebits === 0 && totalCredits === 0 && !editingEntryId) {
        toast.warn('The journal entry has zero total debits and credits. Please ensure this is intended.');
    }
    return true;
  };

  const handleSaveEntry = async () => {
    if (!validateEntryData()) return;
    setIsSaving(true);
    try {
      const payload = {
        ...currentEntryData,
        totalDebits: totalDebits,
        totalCredits: totalCredits,
        lines: currentEntryData.lines.map(line => ({
          ...line,
          id: line.id,
          lineNumber: line.lineNumber,
          debit: parseFloat(line.debit) || 0,
          credit: parseFloat(line.credit) || 0,
        }))
      };
      if (editingEntryId) {
        const updatedEntry = await updateJournalEntry(editingEntryId, payload);
        setJournalEntries(prevEntries => 
          prevEntries.map(entry => entry.id === editingEntryId ? updatedEntry : entry)
        );
        toast.success('Journal Entry updated successfully!');
      } else {
        const savedEntry = await addJournalEntry(payload);
        setJournalEntries(prevEntries => [savedEntry, ...prevEntries]);
        toast.success('Journal Entry saved successfully!');
      }
      handleCloseModal();
    } catch (err) {
      toast.error(`Failed to save entry: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async (entryId) => {
    const entryToDelete = journalEntries.find(entry => entry.id === entryId);
    if (!entryToDelete) {
        toast.error("Entry not found.");
        return;
    }
    if (window.confirm(`Are you sure you want to delete Journal Entry ID: ${entryToDelete.id} (${entryToDelete.description})?`)) {
        try {
            await deleteJournalEntry(entryId);
            setJournalEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
            toast.success('Journal Entry deleted successfully!');
        } catch (err) {
            toast.error(`Failed to delete entry: ${err.message}`);
        }
    }
  };

  const handlePostClick = async (entryId) => {
    if (window.confirm('Are you sure you want to post this journal entry? Once posted, it may not be editable.')) {
      try {
        const postedEntry = await postJournalEntry(entryId);
        setJournalEntries(prevEntries => 
          prevEntries.map(entry => entry.id === entryId ? postedEntry : entry)
        );
        toast.success('Journal Entry posted successfully!');
      } catch (err) {
        toast.error(`Failed to post entry: ${err.message}`);
      }
    }
  };

  const handleUnpostClick = async (entryId) => {
    if (window.confirm('Are you sure you want to un-post this journal entry? It will revert to Draft status and become editable.')) {
      try {
        const unpostedEntry = await unpostJournalEntry(entryId);
        setJournalEntries(prevEntries => 
          prevEntries.map(entry => entry.id === entryId ? unpostedEntry : entry)
        );
        toast.success('Journal Entry un-posted successfully and reverted to Draft!');
      } catch (err) {
        toast.error(`Failed to un-post entry: ${err.message}`);
      }
    }
  };

  const handleCloneClick = (entryToClone) => {
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const clonedEntryData = {
      ...entryToClone, // Spread the original entry to copy most fields
      id: null, // New entry, so no ID yet
      entryDate: today,
      description: `Clone of: ${entryToClone.description}`,
      status: 'Draft', // Cloned entries are always draft initially
      // Deep copy lines to ensure they are new objects and not references
      lines: entryToClone.lines.map(line => ({ ...line })),
      // Reset any fields that should not be copied or should have a default for a new clone
      totalDebits: entryToClone.totalDebits, // These will be recalculated or kept from clone
      totalCredits: entryToClone.totalCredits
    };

    setCurrentEntryData(clonedEntryData);
    setEditingEntryId(null); // It's a new entry, not editing an existing one
    setShowEntryModal(true);
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'; // Up and Down arrows
    }
    return '';
  };

  if (loading) return <p>Loading journal entries...</p>;
  if (error && paginatedEntries.length === 0 && filteredAndSortedEntries.length > 0 && journalEntries.length > 0) {
      // Error but still have some entries to show from filters/sort
  } else if (error && journalEntries.length === 0) { 
      return <p>Error fetching data. Please try again later.</p>; 
  }

  return (
    <div className="journal-entry-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <h2>Journal Entries</h2>
      <div className="controls-container">
        <button onClick={handleOpenAddModal} className="add-button">
          <FaPlus /> Add New Journal Entry
        </button>
        <div className="filter-container">
          <input 
            type="text" 
            name="description" 
            placeholder="Filter by Description..." 
            value={filters.description} 
            onChange={handleFilterChange} 
            className="filter-input"
          />
          <select 
            name="status" 
            value={filters.status} 
            onChange={handleFilterChange} 
            className="filter-select"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option> {/* Assuming Posted status will exist */}
          </select>
          <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="filter-select">
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>
      </div>

      <table className="journal-entry-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('id')} className={`sortable-header ${sortConfig.key === 'id' ? 'active-sort' : ''}`}>
              ID{getSortIndicator('id')}
            </th>
            <th onClick={() => requestSort('entryDate')} className={`sortable-header ${sortConfig.key === 'entryDate' ? 'active-sort' : ''}`}>
              Date{getSortIndicator('entryDate')}
            </th>
            <th onClick={() => requestSort('description')} className={`sortable-header ${sortConfig.key === 'description' ? 'active-sort' : ''}`}>
              Description{getSortIndicator('description')}
            </th>
            <th onClick={() => requestSort('status')} className={`sortable-header ${sortConfig.key === 'status' ? 'active-sort' : ''}`}>
              Status{getSortIndicator('status')}
            </th>
            {/* Debits/Credits are not typically sorted on, but could be if needed */}
            <th>Total Debits</th>
            <th>Total Credits</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedEntries.length === 0 && !loading && (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center' }}>No journal entries found{ (filters.description || filters.status) ? ' matching your filters' : '' }.</td>
            </tr>
          )}
          {paginatedEntries.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.id}</td>
              <td>{new Date(entry.entryDate).toLocaleDateString()}</td>
              <td>{entry.description}</td>
              <td>{entry.status}</td>
              <td>{entry.totalDebits.toFixed(2)}</td>
              <td>{entry.totalCredits.toFixed(2)}</td>
              <td>
                {entry.status === 'Draft' && (
                  <button onClick={() => handlePostClick(entry.id)} className="button-icon post-button" title="Post Entry">
                    <FaCheckCircle /> Post
                  </button>
                )}
                {entry.status === 'Posted' && (
                  <button onClick={() => handleUnpostClick(entry.id)} className="button-icon unpost-button" title="Un-Post Entry">
                    <FaUndo /> Un-Post
                  </button>
                )}
                <button onClick={() => handleEditClick(entry)} className="button-icon edit-button" title="Edit Entry">
                  <FaPencilAlt /> Edit
                </button>
                <button onClick={() => handleCloneClick(entry)} className="button-icon clone-button" title="Clone Entry">
                  <FaClone /> Clone
                </button>
                <button onClick={() => handleDeleteClick(entry.id)} className="button-icon delete-button" title="Delete Entry">
                  <FaTrashAlt /> Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            <FaChevronLeft /> Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next <FaChevronRight />
          </button>
        </div>
      )}

      {showEntryModal && (
        <div className="modal">
          <div className="modal-content large">
            <span className="close-button" onClick={handleCloseModal}>&times;</span>
            <h3>{editingEntryId ? 'Edit Journal Entry' : 'Add New Journal Entry'}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEntry(); }}>
              <div className="form-group">
                <label htmlFor="entryDate">Entry Date:</label>
                <input type="date" id="entryDate" name="entryDate" value={currentEntryData.entryDate.slice(0,10)} onChange={handleCurrentEntryChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <input type="text" id="description" name="description" value={currentEntryData.description} onChange={handleCurrentEntryChange} placeholder="Journal entry description" required />
              </div>
              {editingEntryId && (
                  <div className="form-group">
                      <label htmlFor="status">Status:</label>
                      {/* Potentially make status editable based on rules */}
                      <select 
                        id="status" 
                        name="status" 
                        value={currentEntryData.status} 
                        onChange={handleCurrentEntryChange} 
                        disabled={currentEntryData.status === 'Posted'} // Example: disable if posted
                      >
                        <option value="Draft">Draft</option>
                        <option value="Posted">Posted</option>
                      </select>
                  </div>
              )}

              <h4>Entry Lines</h4>
              <table className="lines-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>G/L Account</th>
                    <th>Line Description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEntryData.lines.map((line, index) => (
                    <tr key={line.id || index}>
                      <td>{line.lineNumber}</td>
                      <td>
                        <select 
                          name="glAccountNumber" 
                          value={line.glAccountNumber} 
                          onChange={(e) => handleLineChange(index, e)} 
                          required
                        >
                          <option value="">Select G/L Account</option>
                          {generalLedgerAccounts.map(acc => (
                            <option key={acc.id} value={acc.accountNumber}>{acc.accountNumber} - {acc.description}</option>
                          ))}
                        </select>
                      </td>
                      <td><input type="text" name="lineDescription" value={line.lineDescription} onChange={(e) => handleLineChange(index, e)} placeholder="Line item description" /></td>
                      <td><input type="number" name="debit" value={line.debit} onChange={(e) => handleLineChange(index, e)} step="0.01" /></td>
                      <td><input type="number" name="credit" value={line.credit} onChange={(e) => handleLineChange(index, e)} step="0.01" /></td>
                      <td>
                        {currentEntryData.lines.length > 1 && (
                          <button type="button" onClick={() => handleRemoveLine(index)} className="button-icon remove-line-button" title="Remove Line">
                            <FaMinus />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={handleAddNewLine} className="button-secondary add-line-button">
                <FaPlus /> Add New Line
              </button>
              
              <div className="entry-totals">
                <p>Total Debits: {totalDebits.toFixed(2)}</p>
                <p>Total Credits: {totalCredits.toFixed(2)}</p>
                <p style={{ color: difference !== 0 ? 'red' : 'green' }}>
                  Difference: {difference.toFixed(2)}
                </p>
              </div>

              <div className="form-actions">
                <button type="submit" className="button-primary" disabled={isSaving || difference !== 0 || currentEntryData.status === 'Posted'}>
                  <FaSave /> {isSaving ? 'Saving...' : (editingEntryId ? 'Update Entry' : 'Save Entry')}
                </button>
                <button type="button" onClick={handleCloseModal} className="button-tertiary">
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JournalEntryList;
