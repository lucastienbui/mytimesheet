import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

describe('<App />', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ entries: [], totalHours: 0 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the heading and empty state', async () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'MyTimesheet' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText(/No entries yet/i)).toBeInTheDocument(),
    );
  });
});
