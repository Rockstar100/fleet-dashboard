import { describe, expect, it, afterEach } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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

  it('keeps map, list and details selection in sync, and deselects on empty-map click', () => {
    render(<Dashboard />);

    const mapMarker = screen.getByRole('button', { name: /^r1,/i });
    fireEvent.click(mapMarker);

    expect(mapMarker).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('option', { name: /r1/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'r1', level: 3 })).toBeInTheDocument();

    // Click the layout image (covers the map plane) — must deselect. This was a
    // real bug: the handler previously required e.target === e.currentTarget,
    // which never fires when the <img> is the click target.
    fireEvent.click(screen.getByAltText(/site layout/i));
    expect(screen.getByText(/select a robot/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^r1,/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps the selected robot in the list when filters would otherwise hide it', () => {
    render(<Dashboard />);

    fireEvent.click(screen.getByRole('button', { name: /^r1,/i }));
    fireEvent.change(screen.getByRole('searchbox', { name: /search robots/i }), { target: { value: 'r2' } });

    // Filter matches only r2, but r1 stays listed because it is selected.
    const options = screen.getAllByRole('option').map((el) => el.textContent ?? '');
    expect(options.some((t) => /r1/.test(t))).toBe(true);
    expect(options.some((t) => /r2/.test(t))).toBe(true);
    expect(screen.getByRole('option', { name: /r1/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: 'r1', level: 3 })).toBeInTheDocument();
  });
});
