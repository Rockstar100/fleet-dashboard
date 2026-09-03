import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { Dashboard } from '../components/dashboard/Dashboard';

// jsdom has no layout engine; give ResponsiveContainer a size so recharts renders.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);

afterEach(cleanup);

describe('Dashboard smoke', () => {
  it('mounts and shows the shell, summary tiles and all eight robots', () => {
    render(<Dashboard />);

    expect(screen.getByRole('heading', { name: /fleet console/i })).toBeInTheDocument();
    expect(screen.getByText(/total fleet/i)).toBeInTheDocument();

    // The roster has 8 robots; each appears as an option in the list.
    const list = screen.getByRole('listbox', { name: /robots/i });
    const ids = within(list)
      .getAllByRole('option')
      .map((el) => el.textContent);
    expect(ids.length).toBe(8);
    expect(ids.join(' ')).toMatch(/r1/);
  });

  it('exposes replay transport controls by default', () => {
    render(<Dashboard />);
    expect(screen.getByRole('button', { name: /restart replay/i })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /playback speed/i })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: /replay progress/i })).toBeInTheDocument();
  });
});
