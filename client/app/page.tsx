"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { hash_data, WasmMerkleTree } from "merkle-tree";
import ServerPanel from "@components/server-panel";
import { Client, CLIENT_COLORS, ClientInfo, Transaction, TransactionDraft, TreeStructure } from "@/lib/types";
import { Toaster } from "@/components/ui/sonner";
import { BookOpen, Plus, Server, Shield, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import ClientCard from "@/components/client-card";
import ProofDialog from "@/components/proof-dialog";
import InfoCard from "@/components/info-card";
import useMerkleTreeStore from "@/store/useMerkleTreeStore";

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export default function Home() {
  const [treeStructure, setTreeStructure] = useState<TreeStructure | null>(null);
  const [rootHash, setRootHash] = useState<string>('');
  const { server, setServer, transactions, setTransactions, clients, setClients } = useMerkleTreeStore();

  // New client dialog
  const [highlightedLeaf, setHighlightedLeaf] = useState<string>();
  const clientCounter = useRef(1);

  // Proof dialog state
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [selectedTxId, setSelectedTransaction] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    const structure = JSON.parse(server.get_tree_structure()) as TreeStructure;
    setTreeStructure(structure);
    setRootHash(structure.root_hash);
  }, [transactions]);

  // Add new client
  const handleAddClient = () => {
    const colorIndex = clients.length % CLIENT_COLORS.length;
    const newClient: Client = {
      id: generateId(),
      name: `Client ${clientCounter.current++}`,
      color: CLIENT_COLORS[colorIndex],
      createdAt: Date.now(),
    };

    setClients([...clients, newClient]);
  };

  // Remove a client
  const handleRemoveClient = useCallback((clientId: string) => {
    setClients(clients.filter((c) => c.id !== clientId));
    var newTransactions = transactions.filter((tx) => tx.client !== clientId);
    setTransactions(newTransactions);
    var server = new WasmMerkleTree(newTransactions.map((tx) => tx.id).join(','));
    setServer(server);
  }, [clients]);

  const handleAddTransaction = useCallback(
    (clientId: string, amount: number, recipientId: string) => {
      const client = clients.find((c) => c.id === clientId);
      if (!client) return;

      const transactionDraft: TransactionDraft = {
        amount,
        recipient: recipientId,
        timestamp: Date.now(),
        client: clientId,
      };

      const transaction: Transaction = {
        ...transactionDraft,
        id: hash_data(JSON.stringify(transactionDraft)),
      };

      const newServerTransactions = [...transactions.map((tx) => ({ ...tx, proof: undefined, proofRequested: false, verified: undefined })), transaction];
      setTransactions(newServerTransactions);

      server.add(transaction.id);
    },
    [clients, transactions]
  );

  const handleRequestProof = useCallback(
    (clientId: string, transactionId: string) => {

      let transaction = transactions.find((tx) => tx.id === transactionId && tx.client === clientId);
      let client = clients.find((c) => c.id === clientId);

      if (!transaction || !client) return;

      try {
        const proof = server.generate_proof(transaction.id);
        const parsedProof = JSON.parse(proof);

        setTransactions(
          transactions.map((tx) =>
            tx.id === transactionId
              ? { ...tx, proof: JSON.stringify(parsedProof, null, 2), proofRequested: true }
              : tx
          )
        );
      } catch (error) {
        console.error("Error generating proof:", error);
      }
    },
    [clients, transactions]
  );

  const handleVerifyProof = useCallback(
    (clientId: string, transactionId: string, proofJson: string) => {
      if (server == null) return;
      try {
        const isValid = server.verify_proof(proofJson);

        setTransactions(transactions.map((tx) =>
          clientId === tx.client &&
            tx.id === transactionId
            ? { ...tx, verified: isValid }
            : tx
        )
        );
      } catch (error) {
        console.error("Error verifying proof:", error);
      }
    },
    [transactions]
  );

  const handleDialogVerify = () => {
    if (!selectedTxId || !selectedClient) return false;
    var selectedTransaction = transactions.find(tx => tx.id === selectedTxId && tx.client === selectedClient.id);
    handleVerifyProof(selectedClient.id, selectedTxId || '', selectedTransaction?.proof || '');
  };

  const clientInfos: ClientInfo[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-violet-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-zinc-100">
                  Merkle Tree Visualizer
                </h1>
                <p className="text-xs text-zinc-500">
                  Trustless Cryptographic Verification with Merkle Trees
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Introduction Banner */}
        <div className="rounded-xl border border-zinc-700/50 bg-zinc-900/30 p-6 gradient-bg">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-violet-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-semibold text-zinc-100">
                How Verification Works
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-4xl">
                <span className="text-violet-400">Merkle trees</span> enable <span className="text-orange-400">cryptographic verification</span> without trusting a central server.
                Submit transactions, generate proofs, and verify them using hash math—proving your transaction is in the tree
                <span className="text-emerald-400"> independently of the server's honesty</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Server Section */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">Server</h2>
          </div>
          <ServerPanel
            treeStructure={treeStructure}
            transactions={transactions}
            rootHash={rootHash}
            highlightedLeaf={highlightedLeaf}
            clients={clientInfos}
          />
        </section>

        <div className="border-t border-zinc-800/50" />

        {/* Clients Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
                Clients ({clients.length})
              </h2>
            </div>

            <Button variant="outline" size="sm" className="h-8 border-zinc-700 text-zinc-300 hover:bg-zinc-800" onClick={handleAddClient}>
              <Plus className="w-4 h-4 mr-1" />
              Add Client
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clients.map((client: Client) => (
              <ClientCard
                key={client.id}
                client={client}
                allClients={clientInfos}
                serverTransactions={transactions}
                treeStructure={treeStructure}
                onAddTransaction={handleAddTransaction}
                onRequestProof={handleRequestProof}
                onRemoveClient={handleRemoveClient}
                openProofDialog={(transaction: Transaction) => {
                  setSelectedTransaction(transaction.id);
                  setSelectedClient(client);
                  setProofDialogOpen(true);
                }}
              />
            ))}
          </div>
        </section>

        {/* Footer Info */}
        <div className="border-t border-zinc-800/50 pt-6">
          <div className="rounded-xl bg-zinc-900/30 border border-zinc-700/30 p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <InfoCard
                icon={<Shield className="w-5 h-5 text-orange-400" />}
                title="Trustless Verification"
                description="Verify proofs using hash math. Even a malicious server cannot fake a valid proof."
              />
              <InfoCard
                icon={<Users className="w-5 h-5 text-violet-400" />}
                title="Privacy Preserving"
                description="Proofs reveal only your transaction and sibling hashes—other data stays private."
              />
              <InfoCard
                icon={<Wallet className="w-5 h-5 text-cyan-400" />}
                title="O(log n) Efficiency"
                description="Verify 1 million transactions with only ~20 hash operations."
              />
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center text-xs text-zinc-500 py-4 pb-10">
        Made with ❤️ by <a href="https://adityanithariya.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">@adityanithariya</a>. Source code on <a href="https://github.com/adityanithariya/merkle-tree" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">GitHub</a>.
      </footer>

      {/* Proof Dialog */}
      <ProofDialog
        open={proofDialogOpen}
        onOpenChange={setProofDialogOpen}
        transaction={transactions.find(tx => tx.id === selectedTxId && tx.client === selectedClient?.id) || null}
        client={selectedClient}
        allClients={clientInfos}
        onVerify={handleDialogVerify}
      />
    </div>
  );
}
