import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WalletConnector } from './WalletConnector';

describe('WalletConnector', () => {
  let mockWalletService;
  let mockOnConnect;
  let mockOnDisconnect;

  beforeEach(() => {
    mockWalletService = {
      detectWallets: vi.fn(),
      restoreConnection: vi.fn(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      getState: vi.fn(),
    };

    mockOnConnect = vi.fn();
    mockOnDisconnect = vi.fn();
  });

  describe('2.1 Test no wallets detected scenario', () => {
    it('should display Install_Prompt when no wallets are detected', async () => {
      // Mock detectWallets to return empty array
      mockWalletService.detectWallets.mockResolvedValue([]);
      mockWalletService.restoreConnection.mockResolvedValue(null);

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify Install_Prompt is visible
      expect(screen.getByText('No wallet detected. Install a Stellar wallet to continue.')).toBeInTheDocument();
      expect(screen.getByText('Install Freighter →')).toBeInTheDocument();
    });

    it('should NOT display error message when no wallets are detected', async () => {
      // Mock detectWallets to return empty array
      mockWalletService.detectWallets.mockResolvedValue([]);
      mockWalletService.restoreConnection.mockResolvedValue(null);

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify error message is NOT visible
      const errorElements = screen.queryAllByText(/⚠/);
      expect(errorElements).toHaveLength(0);
    });

    it('should have null error state after detection with empty array', async () => {
      // Mock detectWallets to return empty array
      mockWalletService.detectWallets.mockResolvedValue([]);
      mockWalletService.restoreConnection.mockResolvedValue(null);

      const { container } = render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify no error div is rendered
      const errorDiv = container.querySelector('.wallet-error');
      expect(errorDiv).not.toBeInTheDocument();
    });

    it('should display exactly one message when no wallets are detected', async () => {
      // Mock detectWallets to return empty array
      mockWalletService.detectWallets.mockResolvedValue([]);
      mockWalletService.restoreConnection.mockResolvedValue(null);

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify Install_Prompt is visible
      const installPrompt = screen.getByText('No wallet detected. Install a Stellar wallet to continue.');
      expect(installPrompt).toBeInTheDocument();

      // Verify error message is NOT visible (no warning icon)
      const errorElements = screen.queryAllByText(/⚠/);
      expect(errorElements).toHaveLength(0);

      // This ensures only ONE message is displayed (the Install_Prompt)
    });
  });

  describe('2.2 Test detection failure scenario', () => {
    it('should display error message when wallet detection fails', async () => {
      // Mock detectWallets to throw an error
      mockWalletService.detectWallets.mockRejectedValue(new Error('Network error'));
      mockWalletService.restoreConnection.mockResolvedValue(null);

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete and error to be set
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify error message is visible
      await waitFor(() => {
        expect(screen.getByText('Failed to detect wallet providers')).toBeInTheDocument();
      });
    });

    it('should set error state when detection throws exception', async () => {
      // Mock detectWallets to throw an error
      mockWalletService.detectWallets.mockRejectedValue(new Error('Detection failed'));
      mockWalletService.restoreConnection.mockResolvedValue(null);

      const { container } = render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete and error to be set
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify error div is rendered
      await waitFor(() => {
        const errorDiv = container.querySelector('.wallet-error');
        expect(errorDiv).toBeInTheDocument();
      });
    });

    it('should display error with warning icon when detection fails', async () => {
      // Mock detectWallets to throw an error
      mockWalletService.detectWallets.mockRejectedValue(new Error('Detection failed'));
      mockWalletService.restoreConnection.mockResolvedValue(null);

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete and error to be set
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify error message with warning icon is visible
      await waitFor(() => {
        expect(screen.getByText('⚠')).toBeInTheDocument();
        expect(screen.getByText('Failed to detect wallet providers')).toBeInTheDocument();
      });
    });
  });

  describe('2.3 Test connection failure scenario', () => {
    it('should display error message when wallet connection fails', async () => {
      // Mock detectWallets to return available wallets
      mockWalletService.detectWallets.mockResolvedValue([
        { name: 'freighter' },
      ]);
      mockWalletService.restoreConnection.mockResolvedValue(null);
      
      // Mock connect to throw an error
      mockWalletService.connect.mockRejectedValue(new Error('User rejected connection'));

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Click on the wallet option to trigger connection
      const walletOption = screen.getByText('Freighter');
      fireEvent.click(walletOption);

      // Wait for connection attempt and error to be set
      await waitFor(() => {
        expect(mockWalletService.connect).toHaveBeenCalledWith('freighter');
      });

      // Verify error message is visible
      await waitFor(() => {
        expect(screen.getByText('User rejected connection')).toBeInTheDocument();
      });
    });

    it('should set error state when connection throws exception', async () => {
      // Mock detectWallets to return available wallets
      mockWalletService.detectWallets.mockResolvedValue([
        { name: 'freighter' },
      ]);
      mockWalletService.restoreConnection.mockResolvedValue(null);
      
      // Mock connect to throw an error
      mockWalletService.connect.mockRejectedValue(new Error('Connection timeout'));

      const { container } = render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Click on the wallet option to trigger connection
      const walletOption = screen.getByText('Freighter');
      fireEvent.click(walletOption);

      // Wait for connection attempt and error to be set
      await waitFor(() => {
        expect(mockWalletService.connect).toHaveBeenCalledWith('freighter');
      });

      // Verify error div is rendered
      await waitFor(() => {
        const errorDiv = container.querySelector('.wallet-error');
        expect(errorDiv).toBeInTheDocument();
      });
    });

    it('should display generic error message when connection fails without specific message', async () => {
      // Mock detectWallets to return available wallets
      mockWalletService.detectWallets.mockResolvedValue([
        { name: 'albedo' },
      ]);
      mockWalletService.restoreConnection.mockResolvedValue(null);
      
      // Mock connect to throw an error without message
      mockWalletService.connect.mockRejectedValue(new Error());

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Click on the wallet option to trigger connection
      const walletOption = screen.getByText('Albedo');
      fireEvent.click(walletOption);

      // Wait for connection attempt and error to be set
      await waitFor(() => {
        expect(mockWalletService.connect).toHaveBeenCalledWith('albedo');
      });

      // Verify generic error message is visible
      await waitFor(() => {
        expect(screen.getByText('Failed to connect wallet')).toBeInTheDocument();
      });
    });
  });

  describe('Additional scenarios', () => {
    it('should display wallet options when wallets are detected', async () => {
      // Mock detectWallets to return available wallets
      mockWalletService.detectWallets.mockResolvedValue([
        { name: 'freighter' },
        { name: 'albedo' },
      ]);
      mockWalletService.restoreConnection.mockResolvedValue(null);

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Verify wallet options are visible
      expect(screen.getByText('Freighter')).toBeInTheDocument();
      expect(screen.getByText('Albedo')).toBeInTheDocument();
    });

    it('should successfully connect to a wallet', async () => {
      // Mock detectWallets to return available wallets
      mockWalletService.detectWallets.mockResolvedValue([
        { name: 'freighter' },
      ]);
      mockWalletService.restoreConnection.mockResolvedValue(null);
      
      // Mock successful connection
      const mockConnection = {
        provider: 'freighter',
        publicKey: 'GTEST123456789',
      };
      mockWalletService.connect.mockResolvedValue(mockConnection);
      mockWalletService.getState.mockReturnValue({
        isConnected: true,
        connection: mockConnection,
        balance: '100000000',
      });

      render(
        <WalletConnector
          walletService={mockWalletService}
          onConnect={mockOnConnect}
          onDisconnect={mockOnDisconnect}
        />
      );

      // Wait for detectWallets to complete
      await waitFor(() => {
        expect(mockWalletService.detectWallets).toHaveBeenCalled();
      });

      // Click on the wallet option to trigger connection
      const walletOption = screen.getByText('Freighter');
      fireEvent.click(walletOption);

      // Wait for connection to complete
      await waitFor(() => {
        expect(mockWalletService.connect).toHaveBeenCalledWith('freighter');
      });

      // Verify onConnect callback was called
      expect(mockOnConnect).toHaveBeenCalledWith(mockConnection);
    });
  });
});
