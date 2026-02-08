// Stellar Network Configuration

export const STELLAR_CONFIG = {
  network: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org:443',
  networkPassphrase: 'Test SDF Network ; September 2015',
};

// Deployed Smart Contract Addresses
export const CONTRACT_ADDRESSES = {
  creditScoring: 'CDOYLJWR54YUIFHTPSXQEUEBKAHYB53NLZOBRRUUVVH7TWT4VNEDLKRV',
  loan: 'CD36X4BBBCDQIRGQ22OBPIXJN2SA2AARIBR4J55W4FZIZ5GFNIK5RFX4',
  escrow: 'CD666QE443BKJVHD5TBRODGS3Z426E2IHJXXJVNF6LC72DXC6Q3NOJUX',
};

// Stellar Expert URLs for transaction viewing
export const STELLAR_EXPERT_URL = 'https://stellar.expert/explorer/testnet';

export function getStellarExpertTxUrl(hash: string): string {
  return `${STELLAR_EXPERT_URL}/tx/${hash}`;
}
