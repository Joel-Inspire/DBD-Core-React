const API_URL = 'http://localhost:3001/journalEntries';

// Fetch all journal entries
export const getJournalEntries = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch journal entries:", error);
    throw error; // Re-throw to allow calling component to handle
  }
};

export const addJournalEntry = async (entryData) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entryData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add journal entry: ${response.status} ${errorText || response.statusText}`);
  }
  return response.json(); // Return the newly created entry (which will include the server-generated ID)
};

export const updateJournalEntry = async (id, entryData) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entryData),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update journal entry: ${response.status} ${errorText || response.statusText}`);
  }
  return response.json(); // Return the updated entry
};

export const deleteJournalEntry = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    // For DELETE, response might not have a body or might have a text error
    const errorText = await response.text().catch(() => ''); // Try to get text, default to empty if error
    throw new Error(`Failed to delete journal entry: ${response.status} ${errorText || response.statusText}`);
  }
  // DELETE requests usually return 204 No Content on success, or sometimes the deleted object/empty object
  // We don't strictly need to return anything here if we're just confirming success by status code.
  return true; // Or response.json() if your API returns the deleted item
};

export const postJournalEntry = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'Posted' }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to post journal entry: ${errorData.message || response.statusText}`);
  }
  return response.json(); // Return the updated entry with the new status
};

export const unpostJournalEntry = async (id) => {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: 'Draft' }), // Revert status to Draft
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Failed to un-post journal entry: ${errorData.message || response.statusText}`);
  }
  return response.json(); // Return the updated entry with the new status
};

// We will add functions for delete later
