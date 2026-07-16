import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadDataset } from '../components/UploadDataset';
import { vi } from 'vitest';

vi.mock('../utils/api', () => ({
  uploadDataset: vi.fn().mockRejectedValue(new Error('Validation error: Signal references unknown zoneId'))
}));

describe('UploadDataset', () => {
  it('shows correct error state on malformed dataset upload', async () => {
    render(<UploadDataset />);
    
    const file = new File(['{"bad": "data"}'], 'test.json', { type: 'application/json' });
    const input = screen.getByTestId('file-upload');
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      const errorMsg = screen.getByTestId('upload-error');
      expect(errorMsg).toHaveTextContent('Validation error: Signal references unknown zoneId');
    });
  });
});
