'use client';

import React, { useState, useRef, useEffect, ReactNode, ReactElement, HTMLAttributes } from 'react';
import {
  Server,
  Database,
  Hash,
  Shield,
  GitBranch,
  ChevronDown,
  Minimize2,
  Maximize2,
  Layers,
  Eye,
  EyeOff,
  Network,
  LucideProps,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import MerkleTreeVisualizer from './merkle-tree-visualizer';
import { TreeStructure, Transaction } from '@/lib/types';
import TransactionItem from './transaction-item';

interface ClientInfo {
  id: string;
  name: string;
  color: string;
}

interface ServerPanelProps {
  treeStructure: TreeStructure | null;
  transactions: Transaction[];
  rootHash: string | undefined;
  highlightedLeaf?: string;
  clients: ClientInfo[];
}

export default function ServerPanel({
  treeStructure,
  transactions,
  rootHash,
  highlightedLeaf,
  clients,
}: ServerPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 450 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(width - 40, 400),
          height: Math.max(450, Math.min(550, window.innerHeight * 0.4)),
        });
      }
    };
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const leafCount = treeStructure?.leaves_count || 0;
  const depth = treeStructure?.depth || 0;
  const totalTransactions = transactions.length;

  return (
    <Card className="bg-zinc-900/50 border-zinc-700/50 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/30 flex items-center justify-center border border-orange-500/30">
              <Server className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-zinc-100">Merkle Server</CardTitle>
                <Badge variant="secondary" className="h-5 text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30">
                  Aggregator
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">Builds Merkle tree from all transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-300"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isExpanded ? 'Minimize' : 'Expand'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-3">
            <StatsCard
              icon={<Database className="w-4 h-4" />}
              label="Transactions"
              value={totalTransactions.toString()}
              color="#22c55e"
              tooltip="Total transactions received from all clients"
            />
            <StatsCard
              icon={<Layers className="w-4 h-4" />}
              label="Leaves"
              value={leafCount.toString()}
              color="#8b5cf6"
              tooltip="Number of leaf nodes in the Merkle tree"
            />
            <StatsCard
              icon={<GitBranch className="w-4 h-4" />}
              label="Tree Depth"
              value={depth.toString()}
              color="#3b82f6"
              tooltip="Height of the tree (log2 of leaves rounded up)"
            />
            <StatsCard
              icon={<Hash className="w-4 h-4" />}
              label="Root Hash"
              value={rootHash ? `${rootHash.slice(0, 18)}...` : '—'}
              color="#f97316"
              tooltip="Unique fingerprint of all transactions"
              isHash
            />
          </div>

          {/* Root Hash Display */}
          {rootHash && leafCount > 0 && (
            <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-zinc-400">Merkle Root</span>
                </div>
                <span className="font-mono text-xs text-orange-400">
                  {rootHash}
                </span>
              </div>
            </div>
          )}

          {/* Tree Visualization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Network className="w-4 h-4" />
                <span>Tree Structure</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] text-zinc-500 hover:text-zinc-300"
                onClick={() => setShowTree(!showTree)}
              >
                {showTree ? (
                  <>
                    <EyeOff className="w-3 h-3 mr-1" />
                    Hide
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3 mr-1" />
                    Show
                  </>
                )}
              </Button>
            </div>

            {showTree && (
              <div ref={containerRef} className="rounded-lg border border-zinc-700/30 bg-zinc-800/20 overflow-hidden">
                <MerkleTreeVisualizer
                  treeStructure={treeStructure}
                  highlightedLeaf={highlightedLeaf}
                  dimensions={dimensions}
                  clients={clients}
                  transactions={transactions}
                />
              </div>
            )}
          </div>

          {/* Transaction List */}
          <Collapsible className="rounded-lg border border-zinc-700/50 bg-zinc-800/20">
            <CollapsibleTrigger className="w-full p-3 hover:bg-zinc-800/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Database className="w-4 h-4" />
                  <span>Stored Transactions ({transactions.length})</span>
                </div>
                <ChevronDown className="w-4 h-4 text-zinc-500 transition-transform ui-expanded:rotate-180" />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="h-40 px-3 pb-3">
                {transactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-zinc-600">
                    <Database className="w-8 h-8 mb-2 opacity-30" />
                    <p className="text-xs">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {transactions.map((tx) => <TransactionItem key={tx.id} tx={tx} clients={clients} />)}
                  </div>
                )}
              </ScrollArea>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  );
}

function StatsCard({
  icon,
  label,
  value,
  color,
  tooltip,
  isHash,
}: {
  icon: ReactElement<React.RefAttributes<SVGSVGElement> & HTMLAttributes<SVGElement>>;
  label: string;
  value: string;
  color: string;
  tooltip: string;
  isHash?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/30 p-3 hover:bg-zinc-800/50 transition-colors cursor-default">
      <div className="flex items-center gap-1.5 mb-1 text-zinc-500">
        {React.cloneElement(icon, {
          className: 'w-3.5 h-3.5',
          style: { color },
        })}
        <span className="text-[10px]">{label}</span>
      </div>
      <div
        className="text-base font-semibold truncate"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  );
}
