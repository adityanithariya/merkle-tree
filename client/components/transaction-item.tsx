
import React from 'react'
import { ClientInfo, Transaction } from '@/lib/types';

const TransactionItem = ({ tx, clients }: { tx: Transaction, clients: ClientInfo[] }) => {
    const sender = clients.find(c => c.id === tx.client);
    const recipient = clients.find(c => c.id === tx.recipient);
    return (
        <div
            key={tx.id}
            className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-zinc-800/50 border border-zinc-700/20"
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: sender?.color || '#666' }}
                >
                    {sender?.name[0] || '?'}
                </div>
                <span className="text-zinc-300">${tx.amount}</span>
                <span className="text-zinc-600">→</span>
                <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    style={{ backgroundColor: recipient?.color || '#666' }}
                >
                    {recipient?.name[0] || '?'}
                </div>
            </div>
            <div className="flex font-mono text-[10px] text-zinc-600 max-w-20 gap-2.5">
                <span>{tx.id.slice(0, 12)}</span>
                <span>...</span>
            </div>
        </div>
    );
}

export default TransactionItem
