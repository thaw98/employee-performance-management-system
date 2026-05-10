import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppSidebar } from './AppSidebar';

vi.mock('../../app/hooks', () => ({
  useAppSelector: vi.fn((selector: (state: unknown) => unknown) =>
    selector({
      auth: {
        user: {
          role: 'HR',
          roleId: 1,
        },
      },
    }),
  ),
}));

describe('AppSidebar self-assessment navigation', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows one assignments item for HR self-assessment navigation', () => {
    render(
      <MemoryRouter initialEntries={['/hr/self-assessment/assignments']}>
        <AppSidebar />
      </MemoryRouter>,
    );

    expect(screen.getAllByText('Assignments')).toHaveLength(1);
    expect(screen.queryByText('Assignments overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Assign Self-Assessment Forms')).not.toBeInTheDocument();
  });
});
