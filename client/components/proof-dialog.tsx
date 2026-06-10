'use client';

import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  GitBranch,
} from 'lucide-react';
import { Proof, ProofStep, Transaction, Client, Direction } from '@lib/types';
import { cn } from '@/lib/utils';
import { hash_data } from 'merkle-tree';
import TruncatedHash from './ui/truncated-hash';

interface ProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
  client: Client | null;
  allClients: { id: string; name: string; color: string }[];
  onVerify: () => void;
}

function parseProof(proofJson: string): Proof | null {
  try {
    return JSON.parse(proofJson);
  } catch {
    return null;
  }
}

export default function ProofDialog({
  open,
  onOpenChange,
  transaction,
  client,
  allClients,
  onVerify,
}: ProofDialogProps) {
  const proof = transaction?.proof;
  const proofData = proof ? parseProof(proof) : null;
  const verified = proofData ? transaction?.verified : undefined;

  const recipient = transaction
    ? allClients.find((c) => c.id === transaction.recipient)
    : null;

  if (!transaction || !proofData || !client) return null;

  // Calculate the computed hash at each step
  const stepHashes: string[] = [proofData.leaf_hash];
  let currentHash = proofData.leaf_hash;
  for (let i = 0; i < proofData.proof.length; i++) {
    const step = proofData.proof[i];
    if (step.direction === Direction.Right) {
      currentHash = hashCombine(currentHash, step.hash);
    } else {
      currentHash = hashCombine(step.hash, currentHash);
    }
    stepHashes.push(currentHash);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            Verify Proof
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Info */}
          <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
            <div className="text-xs text-zinc-500 mb-2">Transaction</div>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: client.color }}
              >
                {client.name[0]}
              </div>
              <div className="text-zinc-200">
                <span className="font-medium">${transaction.amount}</span>
                <span className="text-zinc-500 mx-2">→</span>
                <span
                  className="inline-flex items-center gap-1"
                  style={{ color: recipient?.color }}
                >
                  {recipient?.name || 'Unknown'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-zinc-600 font-mono truncate">
              Data: {transaction.id}
            </div>
            <div className="mt-2 text-xs text-zinc-600 font-mono flex items-center gap-1">
              Transaction Hash:
              <TruncatedHash hash={proofData.leaf_hash} length={10} className="font-mono" />
            </div>
          </div>

          {/* Proof Path Visualization */}
          <div className="rounded-lg bg-zinc-800/30 border border-zinc-700/50 p-4">
            <div className="text-xs text-zinc-500 mb-3">Proof Path</div>

            {/* Steps */}
            <div className="space-y-3">
              {proofData.proof.length === 0 ? (
                <div className="text-center text-zinc-500 text-sm py-4">
                  Single transaction proof - directly matches root
                </div>
              ) : (
                proofData.proof.map((step, idx) => {
                  return (
                    <ProofStepRow
                      key={idx}
                      step={step}
                      stepIndex={idx}
                      yourHash={stepHashes[idx]}
                      resultHash={stepHashes[idx + 1]}
                    />
                  );
                })
              )}
            </div>

            {/* Final Comparison */}
            <div className="mt-4 pt-4 border-t border-zinc-700/50">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Computed: </span>
                  <TruncatedHash hash={stepHashes[stepHashes.length - 1]} length={16} className="font-mono text-zinc-300" />
                </div>
                <div className="text-zinc-600">
                  {stepHashes[stepHashes.length - 1] === proofData.root_hash ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-zinc-500">Expected: </span>
                  <TruncatedHash hash={proofData.root_hash} length={16} className="font-mono text-orange-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Verify Button */}
          <Button
            className={cn(
              'w-full',
              verified === true && 'bg-green-600 hover:bg-green-700',
              verified === false && 'bg-red-600 hover:bg-red-700'
            )}
            onClick={onVerify}
            disabled={verified !== undefined}
          >
            {verified === true ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Proof Verified - Transaction is Included
              </>
            ) : verified === false ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Proof Invalid - Verification Failed
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Verify Proof Mathematically
              </>
            )}
          </Button>

          {/* Explanation */}
          <div className="text-xs text-zinc-500 bg-zinc-800/30 rounded-lg p-3">
            <strong className="text-zinc-400">How it works:</strong> Each step combines your hash
            with a sibling hash. If the final computed hash matches the root, your transaction
            is mathematically proven to be in the tree—no trust needed.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProofStepRow({
  step,
  stepIndex,
  yourHash,
  resultHash,
}: {
  step: ProofStep;
  stepIndex: number;
  yourHash: string;
  resultHash: string;
}) {
  var left = step.direction === Direction.Left ? step.hash : yourHash;
  var right = step.direction === Direction.Right ? step.hash : yourHash;
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="text-zinc-600 w-6">{stepIndex + 1}.</div>

      {/* Your hash (left side) */}
      <div
        className={cn(
          'px-2 py-1 rounded border font-mono truncate max-w-[80px]',
          step.direction === Direction.Right
            ? 'bg-zinc-700/50 border-zinc-600'
            : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
        )}
      >
        {left.slice(0, 8)}...
      </div>

      {/* Direction arrow */}
      <div
        className={cn(
          'flex items-center gap-1 px-2 py-1 rounded border',
          step.direction === Direction.Right
            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        )}
      >
        {step.direction === Direction.Right ? (
          <>
            <span className="text-[10px]">+R</span>
            <ArrowRight className="w-3 h-3" />
          </>
        ) : (
          <>
            <ArrowLeft className="w-3 h-3" />
            <span className="text-[10px]">L+</span>
          </>
        )}
      </div>

      {/* Sibling hash */}
      <div
        className={cn(
          'px-2 py-1 rounded border font-mono truncate max-w-[80px]',
          step.direction === Direction.Left
            ? 'bg-zinc-700/50 border-zinc-600'
            : 'bg-blue-500/5 border-blue-500/20 text-blue-300'
        )}
      >
        {right.slice(0, 8)}...
      </div>

      <ArrowRight className="w-3 h-3 text-zinc-600" />

      {/* Result */}
      <div className="px-2 py-1 rounded bg-zinc-800 border border-zinc-700 font-mono truncate max-w-[80px] text-zinc-300">
        {resultHash.slice(0, 8)}...
      </div>
    </div>
  );
}

// Simple hash function for demonstration
function hashCombine(a: string, b: string): string {
  return hash_data(a + b);
}
