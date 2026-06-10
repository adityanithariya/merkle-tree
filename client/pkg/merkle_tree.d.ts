/* tslint:disable */
/* eslint-disable */

export class WasmMerkleTree {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Add a new element to the tree
     */
    add(data: string): void;
    /**
     * Generate a proof for a leaf
     */
    generate_proof(leaf: string): string;
    /**
     * Get all leaves (comma-separated)
     */
    get_leaves(): string;
    /**
     * Get the root hash
     */
    get_root_hash(): string | undefined;
    /**
     * Get tree structure as JSON with metadata
     */
    get_tree_structure(): string;
    /**
     * Create a new Merkle tree with initial data
     * Example: WasmMerkleTree.new("a,b,c,d")
     */
    constructor(data: string);
    /**
     * Verify a proof (JSON string format)
     */
    verify_proof(proof_json: string): boolean;
}

export function hash_data(data: string): string;
