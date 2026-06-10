import { Client, Transaction } from '@/lib/types';
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface MerkleTreeState {
    transactions: Transaction[];
    clients: Client[];
    setTransactions: (transactions: Transaction[]) => void;
    setClients: (clients: Client[]) => void;
}

const useMerkleTreeStore = create<MerkleTreeState>()(
    persist(
        (set) => ({
            transactions: [],
            clients: [],
            setTransactions: (transactions: Transaction[]) => set({ transactions }),
            setClients: (clients: Client[]) => set({ clients }),
        }),
        {
            name: 'due-tasks-order',
            storage: createJSONStorage(() => localStorage),
        },
    ),
)

export default useMerkleTreeStore
