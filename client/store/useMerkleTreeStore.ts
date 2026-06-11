import { Client, Transaction } from '@/lib/types';
import { WasmMerkleTree } from 'merkle-tree';
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface MerkleTreeState {
    server: WasmMerkleTree;
    transactions: Transaction[];
    clients: Client[];
    setServer: (server: WasmMerkleTree) => void;
    setTransactions: (transactions: Transaction[]) => void;
    setClients: (clients: Client[]) => void;
}

const useMerkleTreeStore = create<MerkleTreeState>()(
    persist(
        (set) => ({
            server: new WasmMerkleTree(""),
            transactions: [],
            clients: [],
            setServer: (server: WasmMerkleTree) => set({ server }),
            setTransactions: (transactions: Transaction[]) => set({ transactions }),
            setClients: (clients: Client[]) => set({ clients }),
        }),
        {
            name: 'due-tasks-order',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: (state) => {
                return (persistedState, error) => {
                    if (persistedState == null) return;
                    persistedState.server = new WasmMerkleTree("");
                    persistedState.transactions.forEach((tx) => persistedState.server.add(tx.id));
                    persistedState.transactions = persistedState.transactions.map((tx: Transaction) => ({ ...tx, proofRequested: false, proof: undefined, verified: undefined }));
                }
            }
        },
    ),
)

export default useMerkleTreeStore
