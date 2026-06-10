'use client';

import React, { useState } from 'react';
import {
  Send,
  Shield,
  Check,
  Trash2,
  Wallet,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@components/ui/scroll-area';
import { Client, ClientInfo, Transaction, TreeStructure } from '@lib/types';
import { cn } from '@lib/utils';

interface ClientCardProps {
  client: Client;
  allClients: ClientInfo[];
  serverTransactions: Transaction[];
  treeStructure: TreeStructure | null;
  onAddTransaction: (clientId: string, amount: number, recipientId: string) => void;
  onRequestProof: (clientId: string, transactionId: string) => void;
  onRemoveClient: (clientId: string) => void;
  openProofDialog: (transaction: Transaction) => void;
}

export type { ClientInfo };

export default function ClientCard({
  client,
  allClients,
  serverTransactions,
  treeStructure,
  onAddTransaction,
  onRequestProof,
  onRemoveClient,
  openProofDialog,
}: ClientCardProps) {
  const [amount, setAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSendTransaction = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !recipientId) return;

    onAddTransaction(client.id, amt, recipientId);
    setAmount('');
    setRecipientId('');
  };

  const clientTransactions = serverTransactions.filter((tx) => tx.client === client.id);
  const recipientOptions = allClients.filter((c) => c.id !== client.id);

  return (
    <Card className="bg-zinc-900/50 border-zinc-700/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
              style={{ backgroundColor: client.color }}
            >
              {client.name[0].toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg text-zinc-100">
                {client.name}
              </CardTitle>
              <p className="text-xs text-zinc-500">Client</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
                  onClick={() => onRemoveClient(client.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove Client</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Transaction Form */}
        <div className="space-y-3 rounded-lg bg-zinc-800/30 p-3 border border-zinc-700/30">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Transaction</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1">
              <Label htmlFor={`amount-${client.id}`} className="text-[10px] text-zinc-500">
                Amount
              </Label>
              <Input
                id={`amount-${client.id}`}
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-7 bg-zinc-900/50 border-zinc-600/50 text-zinc-200 placeholder:text-zinc-600 text-sm"
              />
            </div>

            <div className="grid gap-1">
              <Label htmlFor={`recipient-${client.id}`} className="text-[10px] text-zinc-500">
                To
              </Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger className="h-7 bg-zinc-900/50 border-zinc-600/50 text-zinc-200 text-xs">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700">
                  {recipientOptions.map((r) => (
                    <SelectItem
                      key={r.id}
                      value={r.id}
                      className="focus:bg-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-1.5 text-xs">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        <span>{r.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full h-7 text-xs"
            size="sm"
            onClick={handleSendTransaction}
            disabled={!amount || !recipientId}
          >
            <Send className="w-3 h-3 mr-1" />
            Send
          </Button>
        </div>

        {/* Transaction History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <FileText className="w-3 h-3 text-zinc-500" />
              <span>Sent ({clientTransactions.length})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px] text-zinc-500"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>

          {isExpanded && (
            <ScrollArea className="h-28 rounded-lg border border-zinc-700/30 bg-zinc-800/20">
              <div className="p-2 space-y-1">
                {clientTransactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-3 text-zinc-600">
                    <Wallet className="w-5 h-5 mb-1 opacity-30" />
                    <p className="text-[10px]">No transactions</p>
                  </div>
                ) : (
                  clientTransactions.map((tx) => (
                    <TransactionItem
                      key={tx.id}
                      transaction={tx}
                      serverTransactions={serverTransactions}
                      treeStructure={treeStructure}
                      onRequestProof={onRequestProof}
                      openProofDialog={openProofDialog}
                      clientId={client.id}
                      allClients={allClients}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionItem({
  transaction,
  serverTransactions,
  treeStructure,
  onRequestProof,
  openProofDialog,
  clientId,
  allClients,
}: {
  transaction: Transaction;
  serverTransactions: Transaction[];
  treeStructure: TreeStructure | null;
  onRequestProof: (clientId: string, transactionId: string) => void;
  openProofDialog: (transaction: Transaction) => void;
  clientId: string;
  allClients: ClientInfo[];
}) {
  const isIndexed = treeStructure?.leaves.includes(transaction.id);
  const recipient = allClients.find((c) => c.id === transaction.recipient);
  const proof = transaction.proof;
  const verified = transaction.verified;

  return (
    <div className="rounded bg-zinc-800/50 p-2 border border-zinc-700/20 space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-zinc-200 font-medium">${transaction.amount}</span>
          <ArrowRight className="w-2.5 h-2.5 text-zinc-600" />
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
            style={{ backgroundColor: recipient?.color || '#666' }}
          >
            {recipient?.name[0] || '?'}
          </div>
        </div>
        {verified !== undefined && (
          <span className={cn(
            'text-[10px]',
            verified ? 'text-green-400' : 'text-red-400'
          )}>
            {verified ? '✓' : '✗'}
          </span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        className={cn(
          'w-full h-6 text-[10px]',
          proof ?
            verified === true
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : verified === false
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-violet-500/10 border-violet-500/30 text-violet-400'
            : 'border-zinc-600/50 text-zinc-300'
        )}
        onClick={() => proof ? openProofDialog(transaction) : onRequestProof(clientId, transaction.id)}
        disabled={!isIndexed}
      >
        <Shield className="w-3 h-3 mr-1" />
        {proof ? 'View Proof' : 'Generate Proof'}
      </Button>
    </div>
  );
}
