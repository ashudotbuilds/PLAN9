import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { App } from './App';
import { apiClient } from './api-client';

describe('Web App - Operational Canvas Readiness', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ready state when all health checks succeed', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: {
        status: 'ready',
        details: {
          status: 'healthy',
          service: 'api',
          timestamp: '2026-10-11T00:00:00.000Z'
        }
      },
      mockProviders: {
        status: 'ready',
        details: {
          status: 'healthy',
          service: 'mock-providers',
          timestamp: '2026-10-11T00:00:00.000Z',
          providers: {
            users: 'ready',
            inventory: 'ready',
            shipping: 'ready'
          }
        }
      }
    });

    render(<App />);

    // Wait for ready badges
    await waitFor(() => {
      expect(screen.getAllByText('READY').length).toBeGreaterThan(0);
    });

    expect(screen.getByText('Control Plane API')).toBeInTheDocument();
    expect(screen.getByText('Mock Dependency Providers')).toBeInTheDocument();
    expect(screen.getByText('Users API')).toBeInTheDocument();
    expect(screen.getByText('Inventory API')).toBeInTheDocument();
    expect(screen.getByText('Shipping API')).toBeInTheDocument();
  });

  it('renders offline state when services are unreachable', async () => {
    vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: {
        status: 'offline',
        error: 'Failed to fetch API'
      },
      mockProviders: {
        status: 'offline',
        error: 'Failed to connect to mock providers'
      }
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('OFFLINE').length).toBe(2);
    });

    expect(screen.getByText('Failed to fetch API')).toBeInTheDocument();
    expect(screen.getByText('Failed to connect to mock providers')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const spy = vi.spyOn(apiClient, 'checkSystemReadiness').mockResolvedValue({
      api: { status: 'ready' },
      mockProviders: { status: 'ready' }
    });

    render(<App />);

    const refreshButton = await screen.findByRole('button', { name: /refresh readiness/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(2);
    });
  });
});
