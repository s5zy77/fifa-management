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

export const api = {
  signup: (email, password) => apiCall('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }),

  signin: (email, password) => apiCall('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }),

  createProfile: (profile) => apiCall('/api/profile/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile)
  }),

  generatePlan: (profileId, seatSection, companionProfile, userId) => apiCall('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, seatSection, companionProfile, userId })
  }),

  getLiveSignals: () => apiCall('/api/live-signals'),

  getReroute: (profileId, currentZoneId) => apiCall('/api/reroute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, currentZoneId })
  }),

  submitFeedback: (zoneId, direction, user_id) => apiCall('/api/feedback/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zoneId, direction, user_id })
  }),

  sharePlan: (planDetails, userId) => apiCall('/api/plan/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...planDetails, userId })
  }),

  uploadDataset: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCall('/api/upload/', {
      method: 'POST',
      body: formData
    });
  }
};
