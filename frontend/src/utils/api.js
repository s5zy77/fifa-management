export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, options);
    if (!response.ok) {
      let errorDetail = 'Unknown Error';
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || response.statusText;
      } catch (e) {
        errorDetail = response.statusText;
      }
      throw new Error(errorDetail);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
};

export const createProfile = (profile) => apiCall('/api/profile/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(profile)
});

export const generatePlan = (profileId, seatSection) => apiCall('/api/plan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ profileId, seatSection })
});

export const getLiveSignals = () => apiCall('/api/live-signals');

export const getReroute = (profileId, currentZoneId) => apiCall('/api/reroute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ profileId, currentZoneId })
});

export const uploadDataset = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiCall('/api/upload/', {
    method: 'POST',
    body: formData
  });
};
