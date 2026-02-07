/**
 * Test keypairs for unit tests
 * These are randomly generated keys for testing only - DO NOT USE IN PRODUCTION
 */

export const TEST_KEYPAIRS = {
  source: {
    secret: 'SBFZHU5GLE2IYXYMLQW2TQJXO5XMQUXG2VDURJRJXLR5XWJHKXPXPXPX',
    public: 'GBRPYHIL2CI3FNQ4BXLFMNDLFJUNPU2HY3ZMFSHONUCEOASW7QC7OX2H',
  },
  destination: {
    public: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  },
};

// Generate a valid test secret key
export function generateTestSecret(): string {
  // This is a valid Stellar secret key for testing
  return 'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4';
}

export function generateTestPublic(): string {
  // Corresponding public key
  return 'GBZXN7PIRZGNMHGA7MUUUF4GWPY5AYPV6LY4UV2GL6VJGIQRXFDNMADI';
}
