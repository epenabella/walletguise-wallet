import {
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  type PublicKey,
  type Connection,
  type TransactionInstruction
} from "@solana/web3.js"

interface TransferInfo {
  recipient: string;
  amount: string;
  type: 'SOL' | 'SPL';
}

interface TransactionInfo {
  transfers: TransferInfo[];
  feePayer: string;
}

interface TransactionDetails {
  feePayer: string;
  recentBlockhash: string;
  instructionCount: number;
  programs: string[];
  estimatedFee: string;
}

interface ParsedTransaction {
  transfers: TransferInfo[];
  details: TransactionDetails;
}

interface TransferAmount {
  amount: string;
  type: 'SOL' | 'SPL';
  recipient?: string; // Optional, in case you need it
}

export function parseTransactionForDisplay(data: any): ParsedTransaction {
  try {
    // Handle different input formats
    let transaction: Transaction;

    if (data instanceof Transaction) {
      transaction = data;
    } else if (data?.type === "Buffer" && data?.data) {
      transaction = Transaction.from(data.data);
    } else if (data instanceof Uint8Array || Array.isArray(data)) {
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      transaction = Transaction.from(bytes);
    } else {
      throw new Error('Invalid transaction data format');
    }

    // Parse transfers
    const transfers: TransferInfo[] = [];

    for (const instruction of transaction.instructions) {
      // Check for SOL transfers (SystemProgram)
      if (instruction.programId.equals(SystemProgram.programId)) {
        const instructionData = instruction.data;

        // SystemProgram.transfer has instruction type 2
        if (instructionData.length >= 4 && instructionData[0] === 2) {
          // Extract lamports (next 8 bytes after instruction type)
          const lamports = instructionData.readBigUInt64LE(4);
          const solAmount = (Number(lamports) / LAMPORTS_PER_SOL).toFixed(6);

          // Get recipient from accounts (index 1 is usually 'to' account)
          const recipient = instruction.keys[1]?.pubkey.toBase58() || 'Unknown';

          transfers.push({
            recipient,
            amount: solAmount,
            type: 'SOL'
          });
        }
      }

      // Add SPL token transfer parsing here if needed
    }

    // Parse general transaction details
    const programIds = [...new Set(transaction.instructions.map(ix => ix.programId.toBase58()))];
    const programNames = programIds.map(id => {
      const PROGRAM_NAMES: { [key: string]: string } = {
        [SystemProgram.programId.toBase58()]: 'System Program',
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'SPL Token Program',
        'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
      };

      return PROGRAM_NAMES[id] || `${id.slice(0, 8)}...${id.slice(-8)}`;
    });

    const details: TransactionDetails = {
      feePayer: transaction.feePayer ?
        `${transaction.feePayer.toBase58().slice(0, 8)}...${transaction.feePayer.toBase58().slice(-8)}` :
        'Unknown',
      recentBlockhash: transaction.recentBlockhash ?
        `${transaction.recentBlockhash.slice(0, 8)}...${transaction.recentBlockhash.slice(-8)}` :
        'Unknown',
      instructionCount: transaction.instructions.length,
      programs: programNames,
      estimatedFee: ((5000 * transaction.instructions.length) / 1e9).toFixed(6)
    };

    return { transfers, details };
  } catch (error) {
    console.error('Error parsing transaction:', error);
    return {
      transfers: [],
      details: {
        feePayer: 'Unknown',
        recentBlockhash: 'Unknown',
        instructionCount: 0,
        programs: [],
        estimatedFee: '0.000000'
      }
    };
  }
}

export function formatDisplayData(data: any): string {
  if (!data) return "";

  if (data instanceof Uint8Array || Array.isArray(data)) {
    // For byte arrays, show as hex string
    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    if (hex.length <= 12) return hex;
    return `${hex.substring(0, 6)}...${hex.substring(hex.length - 4)}`;
  }

  // For regular strings
  const str = String(data);
  if (str.length <= 24) return str;
  return `${str.substring(0, 12)}...${str.substring(str.length - 8)}`;
}

export function getTransactionAmounts(transaction: Transaction): TransferAmount[] {
  try {
    const amounts: TransferAmount[] = [];

    for (const instruction of transaction.instructions) {
      // Check for SOL transfers (SystemProgram)
      if (instruction.programId.equals(SystemProgram.programId)) {
        const instructionData = instruction.data;

        // SystemProgram.transfer has instruction type 2
        if (instructionData.length >= 4 && instructionData[0] === 2) {
          // Extract lamports (next 8 bytes after instruction type)
          const lamports = instructionData.readBigUInt64LE(4);
          const solAmount = (Number(lamports) / LAMPORTS_PER_SOL).toFixed(6);

          amounts.push({
            amount: solAmount,
            type: 'SOL',
            recipient: instruction.keys[1]?.pubkey.toBase58()
          });
        }
      }

      // Add SPL token transfer parsing here if needed
      // if (instruction.programId.equals(TOKEN_PROGRAM_ID)) {
      //   // SPL token parsing logic
      // }
    }

    return amounts;
  } catch (error) {
    console.error('Error extracting transaction amounts:', error);
    return [];
  }
}

export function getTotalSolAmount(transaction: Transaction): number {
  const amounts = getTransactionAmounts(transaction);
  const solTransfers = amounts.filter(transfer => transfer.type === 'SOL');

  if (solTransfers.length === 0) return 0;

  const total = solTransfers.reduce((sum, transfer) => {
    return sum + parseFloat(transfer.amount);
  }, 0);

  return total;
}

export function getPrimaryTransferAmount(transaction: Transaction): string | null {
  const amounts = getTransactionAmounts(transaction);
  return amounts.length > 0 ? amounts[0].amount : null;
}