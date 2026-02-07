/**
 * XDR (External Data Representation) Type Definitions
 * 
 * These types represent Stellar transaction structures that can be
 * serialized to/from XDR binary format for network communication.
 */

/**
 * Stellar transaction envelope containing transaction data and signatures
 */
export interface TransactionEnvelope {
  tx: Transaction;
  signatures: DecoratedSignature[];
}

/**
 * Core transaction structure
 */
export interface Transaction {
  sourceAccount: string;
  fee: number;
  seqNum: string;
  timeBounds?: TimeBounds;
  memo: Memo;
  operations: Operation[];
}

/**
 * Time bounds for transaction validity
 */
export interface TimeBounds {
  minTime: string;
  maxTime: string;
}

/**
 * Transaction memo (optional message)
 */
export interface Memo {
  type: MemoType;
  value?: string | Buffer;
}

export enum MemoType {
  MEMO_NONE = 0,
  MEMO_TEXT = 1,
  MEMO_ID = 2,
  MEMO_HASH = 3,
  MEMO_RETURN = 4,
}

/**
 * Transaction operation (action to perform)
 */
export interface Operation {
  sourceAccount?: string;
  body: OperationBody;
}

/**
 * Operation body containing the specific operation type and data
 */
export interface OperationBody {
  type: OperationType;
  data: any;
}

export enum OperationType {
  CREATE_ACCOUNT = 0,
  PAYMENT = 1,
  PATH_PAYMENT_STRICT_RECEIVE = 2,
  MANAGE_SELL_OFFER = 3,
  CREATE_PASSIVE_SELL_OFFER = 4,
  SET_OPTIONS = 5,
  CHANGE_TRUST = 6,
  ALLOW_TRUST = 7,
  ACCOUNT_MERGE = 8,
  INFLATION = 9,
  MANAGE_DATA = 10,
  BUMP_SEQUENCE = 11,
  MANAGE_BUY_OFFER = 12,
  PATH_PAYMENT_STRICT_SEND = 13,
  CREATE_CLAIMABLE_BALANCE = 14,
  CLAIM_CLAIMABLE_BALANCE = 15,
  BEGIN_SPONSORING_FUTURE_RESERVES = 16,
  END_SPONSORING_FUTURE_RESERVES = 17,
  REVOKE_SPONSORSHIP = 18,
  CLAWBACK = 19,
  CLAWBACK_CLAIMABLE_BALANCE = 20,
  SET_TRUST_LINE_FLAGS = 21,
  LIQUIDITY_POOL_DEPOSIT = 22,
  LIQUIDITY_POOL_WITHDRAW = 23,
  INVOKE_HOST_FUNCTION = 24,
  EXTEND_FOOTPRINT_TTL = 25,
  RESTORE_FOOTPRINT = 26,
}

/**
 * Payment operation data
 */
export interface PaymentOp {
  destination: string;
  asset: Asset;
  amount: string;
}

/**
 * Asset representation (native or issued)
 */
export interface Asset {
  type: AssetType;
  code?: string;
  issuer?: string;
}

export enum AssetType {
  ASSET_TYPE_NATIVE = 0,
  ASSET_TYPE_CREDIT_ALPHANUM4 = 1,
  ASSET_TYPE_CREDIT_ALPHANUM12 = 2,
}

/**
 * Decorated signature (signature with hint)
 */
export interface DecoratedSignature {
  hint: Buffer;
  signature: Buffer;
}

/**
 * Soroban contract invocation
 */
export interface InvokeHostFunctionOp {
  hostFunction: HostFunction;
  auth: SorobanAuthorizationEntry[];
}

export interface HostFunction {
  type: HostFunctionType;
  invokeContract?: InvokeContractArgs;
  createContract?: CreateContractArgs;
  uploadContractWasm?: Buffer;
}

export enum HostFunctionType {
  HOST_FUNCTION_TYPE_INVOKE_CONTRACT = 0,
  HOST_FUNCTION_TYPE_CREATE_CONTRACT = 1,
  HOST_FUNCTION_TYPE_UPLOAD_CONTRACT_WASM = 2,
}

export interface InvokeContractArgs {
  contractAddress: string;
  functionName: string;
  args: ScVal[];
}

export interface CreateContractArgs {
  contractIDPreimage: ContractIDPreimage;
  executable: ContractExecutable;
}

export interface ContractIDPreimage {
  type: ContractIDPreimageType;
  fromAddress?: ContractIDPreimageFromAddress;
  fromAsset?: string;
}

export enum ContractIDPreimageType {
  CONTRACT_ID_PREIMAGE_FROM_ADDRESS = 0,
  CONTRACT_ID_PREIMAGE_FROM_ASSET = 1,
}

export interface ContractIDPreimageFromAddress {
  address: string;
  salt: Buffer;
}

export interface ContractExecutable {
  type: ContractExecutableType;
  wasmHash?: Buffer;
  token?: void;
}

export enum ContractExecutableType {
  CONTRACT_EXECUTABLE_WASM = 0,
  CONTRACT_EXECUTABLE_STELLAR_ASSET = 1,
}

/**
 * Soroban contract value (ScVal)
 */
export interface ScVal {
  type: ScValType;
  value?: any;
}

export enum ScValType {
  SCV_BOOL = 0,
  SCV_VOID = 1,
  SCV_ERROR = 2,
  SCV_U32 = 3,
  SCV_I32 = 4,
  SCV_U64 = 5,
  SCV_I64 = 6,
  SCV_TIMEPOINT = 7,
  SCV_DURATION = 8,
  SCV_U128 = 9,
  SCV_I128 = 10,
  SCV_U256 = 11,
  SCV_I256 = 12,
  SCV_BYTES = 13,
  SCV_STRING = 14,
  SCV_SYMBOL = 15,
  SCV_VEC = 16,
  SCV_MAP = 17,
  SCV_ADDRESS = 18,
  SCV_CONTRACT_INSTANCE = 19,
  SCV_LEDGER_KEY_CONTRACT_INSTANCE = 20,
  SCV_LEDGER_KEY_NONCE = 21,
}

/**
 * Soroban authorization entry
 */
export interface SorobanAuthorizationEntry {
  credentials: SorobanCredentials;
  rootInvocation: SorobanAuthorizedInvocation;
}

export interface SorobanCredentials {
  type: SorobanCredentialsType;
  address?: SorobanAddressCredentials;
}

export enum SorobanCredentialsType {
  SOROBAN_CREDENTIALS_SOURCE_ACCOUNT = 0,
  SOROBAN_CREDENTIALS_ADDRESS = 1,
}

export interface SorobanAddressCredentials {
  address: string;
  nonce: string;
  signatureExpirationLedger: number;
  signature: ScVal;
}

export interface SorobanAuthorizedInvocation {
  function: SorobanAuthorizedFunction;
  subInvocations: SorobanAuthorizedInvocation[];
}

export interface SorobanAuthorizedFunction {
  type: SorobanAuthorizedFunctionType;
  contractFn?: InvokeContractArgs;
  createContractHostFn?: CreateContractArgs;
}

export enum SorobanAuthorizedFunctionType {
  SOROBAN_AUTHORIZED_FUNCTION_TYPE_CONTRACT_FN = 0,
  SOROBAN_AUTHORIZED_FUNCTION_TYPE_CREATE_CONTRACT_HOST_FN = 1,
}

/**
 * Transaction result
 */
export interface TransactionResult {
  feeCharged: string;
  result: TransactionResultResult;
  ext: TransactionResultExt;
}

export interface TransactionResultResult {
  code: TransactionResultCode;
  results?: OperationResult[];
}

export enum TransactionResultCode {
  txFEE_BUMP_INNER_SUCCESS = 1,
  txSUCCESS = 0,
  txFAILED = -1,
  txTOO_EARLY = -2,
  txTOO_LATE = -3,
  txMISSING_OPERATION = -4,
  txBAD_SEQ = -5,
  txBAD_AUTH = -6,
  txINSUFFICIENT_BALANCE = -7,
  txNO_ACCOUNT = -8,
  txINSUFFICIENT_FEE = -9,
  txBAD_AUTH_EXTRA = -10,
  txINTERNAL_ERROR = -11,
  txNOT_SUPPORTED = -12,
  txFEE_BUMP_INNER_FAILED = -13,
  txBAD_SPONSORSHIP = -14,
  txBAD_MIN_SEQ_AGE_OR_GAP = -15,
  txMALFORMED = -16,
  txSOROBAN_INVALID = -17,
}

export interface OperationResult {
  code: OperationResultCode;
  tr?: any;
}

export enum OperationResultCode {
  opINNER = 0,
  opBAD_AUTH = -1,
  opNO_ACCOUNT = -2,
  opNOT_SUPPORTED = -3,
  opTOO_MANY_SUBENTRIES = -4,
  opEXCEEDED_WORK_LIMIT = -5,
  opTOO_MANY_SPONSORING = -6,
}

export interface TransactionResultExt {
  v: number;
  sorobanMeta?: SorobanTransactionMeta;
}

export interface SorobanTransactionMeta {
  ext: SorobanTransactionMetaExt;
  events: ContractEvent[];
  returnValue: ScVal;
  diagnosticEvents: DiagnosticEvent[];
}

export interface SorobanTransactionMetaExt {
  v: number;
  v1?: SorobanTransactionMetaExtV1;
}

export interface SorobanTransactionMetaExtV1 {
  ext: ExtensionPoint;
  totalNonRefundableResourceFeeCharged: string;
  totalRefundableResourceFeeCharged: string;
  rentFeeCharged: string;
}

export interface ExtensionPoint {
  v: number;
}

export interface ContractEvent {
  ext: ExtensionPoint;
  contractID?: Buffer;
  type: ContractEventType;
  body: ContractEventBody;
}

export enum ContractEventType {
  SYSTEM = 0,
  CONTRACT = 1,
  DIAGNOSTIC = 2,
}

export interface ContractEventBody {
  v: number;
  v0?: ContractEventV0;
}

export interface ContractEventV0 {
  topics: ScVal[];
  data: ScVal;
}

export interface DiagnosticEvent {
  inSuccessfulContractCall: boolean;
  event: ContractEvent;
}
