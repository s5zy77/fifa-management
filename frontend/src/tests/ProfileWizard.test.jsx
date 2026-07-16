import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProfileWizard } from '../components/ProfileWizard';
import { vi } from 'vitest';

vi.mock('../utils/api', () => ({
  createProfile: vi.fn().mockResolvedValue({ id: 'test-123' })
}));

describe('ProfileWizard', () => {
  it('renders sliders and submits data correctly', async () => {
    const onComplete = vi.fn();
    render(
      <BrowserRouter>
        <ProfileWizard onComplete={onComplete} />
      </BrowserRouter>
    );

    const noiseSlider = screen.getByTestId('slider-noise');
    fireEvent.change(noiseSlider, { target: { value: '8' } });

    const form = screen.getByTestId('profile-form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalled();
    });
  });
});
