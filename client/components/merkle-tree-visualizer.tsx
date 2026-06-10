'use client';

import React, { useMemo } from 'react';
import Tree from 'react-d3-tree';
import { TreeNode, TreeStructure, Transaction } from '@/lib/types';
import CustomNode from './custom-node';

interface ClientInfo {
  id: string;
  name: string;
  color: string;
}

export interface TreeNodeData {
  name: string;
  hash: string;
  isLeaf: boolean;
  content?: string;
  sender?: ClientInfo;
  receiver?: ClientInfo;
  amount?: number;
  attributes?: {
    level: number;
    content?: string;
    hash: string;
    isLeaf: boolean;
    highlighted?: boolean;
    isRoot?: boolean;
    clientColor?: string;
  };
  children?: TreeNodeData[];
}

interface MerkleTreeVisualizerProps {
  treeStructure: TreeStructure | null;
  highlightedLeaf?: string;
  dimensions?: { width: number; height: number };
  clients?: ClientInfo[];
  transactions?: Transaction[];
}

function convertTreeToD3(
  node: TreeNode | null,
  highlightedLeaf?: string,
  isRoot: boolean = true,
  txIdToTxMap?: Map<string, Transaction>,
  clientIdToClientMap?: Map<string, ClientInfo>
): TreeNodeData | null {
  if (!node) return null;

  const isLeaf = node.content !== null;
  const isHighlighted = isLeaf && node.content === highlightedLeaf;
  var txData = isLeaf && node.content && txIdToTxMap ? txIdToTxMap.get(node.content) : undefined;

  const children: TreeNodeData[] = [];

  if (node.left) {
    const leftChild = convertTreeToD3(node.left, highlightedLeaf, false, txIdToTxMap, clientIdToClientMap);
    if (leftChild) children.push(leftChild);
  }

  if (node.right) {
    const rightChild = convertTreeToD3(node.right, highlightedLeaf, false, txIdToTxMap, clientIdToClientMap);
    if (rightChild) children.push(rightChild);
  }

  var offset = isLeaf ? 6 : 4;

  return {
    name: `${node.hash.slice(0, offset)}..${node.hash.slice(-offset)}`,
    hash: node.hash,
    isLeaf,
    content: node.content || undefined,
    sender: txData?.client ? clientIdToClientMap?.get(txData.client) : undefined,
    receiver: txData?.recipient ? clientIdToClientMap?.get(txData.recipient) : undefined,
    amount: txData?.amount,
    attributes: {
      level: node.level,
      content: node.content || undefined,
      hash: node.hash,
      isLeaf,
      highlighted: isHighlighted,
      isRoot,
    },
    children: children.length > 0 ? children : undefined,
  };
}

export default function MerkleTreeVisualizer({
  treeStructure,
  highlightedLeaf,
  dimensions,
  clients = [],
  transactions = [],
}: MerkleTreeVisualizerProps) {
  // Build map from transaction data to client color
  const txIdToTxMap = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactions.forEach((tx) => {
      map.set(tx.id, tx);
    });
    return map;
  }, [transactions]);
  const clientIdToClientMap = useMemo(() => {
    const map = new Map<string, ClientInfo>();
    clients.forEach((client) => {
      map.set(client.id, client);
    });
    return map;
  }, [clients, transactions]);

  const d3TreeData = useMemo(() => {
    if (!treeStructure?.tree) return null;
    return convertTreeToD3(treeStructure.tree, highlightedLeaf, true, txIdToTxMap, clientIdToClientMap);
  }, [treeStructure, highlightedLeaf, txIdToTxMap, clientIdToClientMap]);

  if (!d3TreeData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50">
        <div className="text-center text-zinc-500">
          <Network className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-sm">No Tree Structure</p>
          <p className="text-xs mt-1">Add transactions to build the tree</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-xl border border-zinc-700/50 bg-zinc-900/30 overflow-hidden"
      style={{ height: dimensions?.height || 500 }}
    >
      <Tree
        data={d3TreeData}
        renderCustomNodeElement={(rd3tProps) => (
          <CustomNode nodeData={(rd3tProps.nodeDatum as unknown) as TreeNodeData} />
        )}
        orientation="vertical"
        pathFunc="diagonal"
        translate={{ x: 100, y: (dimensions?.height || 500) / 2 }}
        scaleExtent={{ min: 0.3, max: 2 }}
        initialDepth={10}
        zoom={0.8}
        separation={{ siblings: 2, nonSiblings: 3 }}
        transitionDuration={300}
        svgClassName="merkle-tree-svg"
      />
    </div>
  );
}

function Network({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
    </svg>
  );
}
