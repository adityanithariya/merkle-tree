import { WasmMerkleTree } from "merkle-tree";

export interface TransactionDraft {
  client: string;
  recipient: string;
  amount: number;
  timestamp: number;
}

export interface Transaction extends TransactionDraft {
  id: string;
  proofRequested?: boolean;
  proof?: string;
  verified?: boolean;
}

export interface Client {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface ClientInfo {
  id: string;
  name: string;
  color: string;
}

export interface ServerState {
  merkleTree: WasmMerkleTree | null;
  transactions: Transaction[];
  rootHash: string;
  treeStructure: TreeStructure | null;
}

export const CLIENT_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f43f5e', // rose
];

export interface TreeNode {
  hash: string;
  content: string;
  level: number;
  left: TreeNode | null;
  right: TreeNode | null;
}

export interface TreeStructure {
  root_hash: string;
  leaves_count: number;
  leaves: string[];
  depth: number;
  tree: TreeNode | null;
}

export enum Direction {
  Left = 'Left',
  Right = 'Right',
}

export interface ProofStep {
  hash: string;
  direction: Direction;
}

export interface Proof {
  leaf: string;
  leaf_hash: string;
  proof: ProofStep[];
  root_hash: string;
}