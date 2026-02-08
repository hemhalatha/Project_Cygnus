import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentFundingPanel } from './AgentFundingPanel';

describe('AgentFundingPanel', () => {
  let mockTransactionService;
  let mockWalletService;
  let mockOnBalanceUpdate;

  beforeEach(() => {
    mockTransactionService = {
      validateAmount: vi.fn(),
      createPayment: vi.fn(),
      signTransaction: vi.fn(),
      submitTransaction: vi.fn(),
      pollTransactionStatus: vi.fn(),
    };

    mockWalletService = {
      getState: vi.fn(),
      refreshBalance: vi.fn(),
    };

    mockOnBalanceUpdate = vi.fn();
  });

  it('should display agent and user balances', () => {
    render(
      <AgentFundingPanel
        agentId="agent-1"
        agentAddress="GTEST123"
        agentBalance="50000000" // 5 XLM in stroops
        userBalance="100000000" // 10 XLM in stroops
        transactionService={mockTransactionService}
        walletService={mockWalletService}
        onBalanceUpdate={mockOnBalanceUpdate}
      />
    );

    expect(screen.getByText('5.00 XLM')).toBeInTheDocument();
    expect(screen.getByText('10.00 XLM')).toBeInTheDocument();
  });

  it('should validate amount is positive and non-zero', async () => {
    mockTransactionService.validateAmount.mockReturnValue(true);

    render(
      <AgentFundingPanel
        agentId="agent-1"
        agentAddress="GTEST123"
        agentBalance="50000000"
        userBalance="100000000"
        transactionService={mockTransactionService}
        walletService={mockWalletService}
        onBalanceUpdate={mockOnBalanceUpdate}
      />
    );

    const input = screen.getByPlaceholderText('0.00');

    // Test zero amount
    fireEvent.change(input, { target: { value: '0' } });
    await waitFor(() => {
      expect(screen.getByText('Amount must be positive and non-zero')).toBeInTheDocument();
    });

    // Test negative amount
    fireEvent.change(input, { target: { value: '-5' } });
    await waitFor(() => {
      expect(screen.getByText('Amount must be positive and non-zero')).toBeInTheDocument();
    });
  });

  it('should validate sufficient balance', async () => {
    mockTransactionService.validateAmount.mockReturnValue(false);

    render(
      <AgentFundingPanel
        agentId="agent-1"
        agentAddress="GTEST123"
        agentBalance="50000000"
        userBalance="100000000" // 10 XLM
        transactionService={mockTransactionService}
        walletService={mockWalletService}
        onBalanceUpdate={mockOnBalanceUpdate}
      />
    );

    const input = screen.getByPlaceholderText('0.00');

    // Test amount exceeding balance
    fireEvent.change(input, { target: { value: '15' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument();
    });
  });

  it('should handle successful funding transaction', async () => {
    mockTransactionService.validateAmount.mockReturnValue(true);
    mockWalletService.getState.mockReturnValue({
      isConnected: true,
      connection: { publicKey: 'GUSER123', provider: 'freighter' },
    });

    const mockTransaction = { toXDR: () => 'mock-xdr' };
    mockTransactionService.createPayment.mockResolvedValue(mockTransaction);
    mockTransactionService.signTransaction.mockResolvedValue(mockTransaction);
    mockTransactionService.submitTransaction.mockResolvedValue({
      hash: 'abc123',
      status: 'confirmed',
      timestamp: Date.now(),
    });
    mockTransactionService.pollTransactionStatus.mockResolvedValue({
      hash: 'abc123',
      status: 'confirmed',
      timestamp: Date.now(),
    });
    mockWalletService.refreshBalance.mockResolvedValue('90000000');

    render(
      <AgentFundingPanel
        agentId="agent-1"
        agentAddress="GTEST123"
        agentBalance="50000000"
        userBalance="100000000"
        transactionService={mockTransactionService}
        walletService={mockWalletService}
        onBalanceUpdate={mockOnBalanceUpdate}
      />
    );

    const input = screen.getByPlaceholderText('0.00');
    const button = screen.getByRole('button', { name: 'Fund Agent' });

    // Enter valid amount
    fireEvent.change(input, { target: { value: '5' } });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    // Click fund button
    fireEvent.click(button);

    // Wait for transaction to complete
    await waitFor(() => {
      expect(mockTransactionService.createPayment).toHaveBeenCalledWith({
        source: 'GUSER123',
        destination: 'GTEST123',
        amount: '50000000',
        memo: 'Fund agent agent-1',
      });
    });

    expect(mockTransactionService.signTransaction).toHaveBeenCalled();
    expect(mockTransactionService.submitTransaction).toHaveBeenCalled();
    expect(mockWalletService.refreshBalance).toHaveBeenCalled();
    expect(mockOnBalanceUpdate).toHaveBeenCalled();
  });

  it('should display error when wallet not connected', async () => {
    mockTransactionService.validateAmount.mockReturnValue(true);
    mockWalletService.getState.mockReturnValue({
      isConnected: false,
      connection: null,
    });

    render(
      <AgentFundingPanel
        agentId="agent-1"
        agentAddress="GTEST123"
        agentBalance="50000000"
        userBalance="100000000"
        transactionService={mockTransactionService}
        walletService={mockWalletService}
        onBalanceUpdate={mockOnBalanceUpdate}
      />
    );

    const input = screen.getByPlaceholderText('0.00');
    const button = screen.getByRole('button', { name: 'Fund Agent' });

    fireEvent.change(input, { target: { value: '5' } });
    
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Wallet not connected/)).toBeInTheDocument();
    });
  });

  it('should display error when transaction is rejected', async () => {
    mockTransactionService.validateAmount.mockReturnValue(true);
    mockWalletService.getState.mockReturnValue({
      isConnected: true,
      connection: { publicKey: 'GUSER123', provider: 'freighter' },
    });

    const mockTransaction = { toXDR: () => 'mock-xdr' };
    mockTransactionService.createPayment.mockResolvedValue(mockTransaction);
    mockTransactionService.signTransaction.mockRejectedValue(
      new Error('Transaction rejected by user')
    );

    render(
      <AgentFundingPanel
        agentId="agent-1"
        agentAddress="GTEST123"
        agentBalance="50000000"
        userBalance="100000000"
        transactionService={mockTransactionService}
        walletService={mockWalletService}
        onBalanceUpdate={mockOnBalanceUpdate}
      />
    );

    const input = screen.getByPlaceholderText('0.00');
    const button = screen.getByRole('button', { name: 'Fund Agent' });

    fireEvent.change(input, { target: { value: '5' } });
    
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Transaction rejected by user')).toBeInTheDocument();
    });
  });

  it('should update balance on confirmation', async () => {
    mockTransactionService.validateAmount.mockReturnValue(true);
    mockWalletService.getState.mockReturnValue({
      isConnected: true,
      connection: { publicKey: 'GUSER123', provider: 'freighter' },
    });

    const mockTransaction = { toXDR: () => 'mock-xdr' };
    mockTransactionService.createPayment.mockResolvedValue(mockTransaction);
    mockTransactionService.signTransaction.mockResolvedValue(mockTransaction);
    mockTransactionService.submitTransaction.mockResolvedValue({
      hash: 'abc123',
      status: 'confirmed',
      timestamp: Date.now(),
    });
    mockTransactionService.pollTransactionStatus.mockResolvedValue({
      hash: 'abc123',
      status: 'confirmed',
      timestamp: Date.now(),
    });
    mockWalletService.refreshBalance.mockResolvedValue('90000000');

    render(
      <AgentFundingPanel
        agentId="agent-1"
        agentAddress="GTEST123"
        agentBalance="50000000"
        userBalance="100000000"
        transactionService={mockTransactionService}
        walletService={mockWalletService}
        onBalanceUpdate={mockOnBalanceUpdate}
      />
    );

    const input = screen.getByPlaceholderText('0.00');
    const button = screen.getByRole('button', { name: 'Fund Agent' });

    fireEvent.change(input, { target: { value: '5' } });
    
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockWalletService.refreshBalance).toHaveBeenCalled();
      expect(mockOnBalanceUpdate).toHaveBeenCalled();
    });
  });
});
