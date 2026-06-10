'use client';

import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Shield, Check, Hash } from 'lucide-react';
import { Button } from './ui/button';
import { Proof, ProofStep } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ProofDisplayProps {
  proofJson: string;
  onVerify?: () => boolean;
  verified?: boolean;
  clientColor?: string;
}

function parseProof(proofJson: string): Proof | null {
  try {
    return JSON.parse(proofJson);
  } catch {
    return null;
  }
}

export default function ProofDisplay({
  proofJson,
  onVerify,
  verified,
  clientColor = '#8b5cf6',
}: ProofDisplayProps) {
  const proof = parseProof(proofJson);

  if (!proof) {
    return (
      <div className="text-xs text-zinc-500 flex items-center gap-1">
        <Shield className="w-3 h-3" />
        <span>No proof</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Simple proof visualization */}
      <div className="text-xs text-zinc-400 mb-2">Proof Path:</div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Your transaction hash */}
        <div className="px-2 py-1.5 rounded bg-zinc-800 border border-zinc-700 font-mono text-xs truncate max-w-[100px]" style={{ borderColor: clientColor }}>
          {proof.leaf_hash.slice(0, 8)}...
        </div>

        {proof.proof.map((step, idx) => (
          <React.Fragment key={idx}>
            <ArrowRight className="w-3 h-3 text-zinc-600" />
            <ProofStepSimple step={step} />
          </React.Fragment>
        ))}

        <ArrowRight className="w-3 h-3 text-zinc-600" />

        {/* Root */}
        <div className="px-2 py-1.5 rounded bg-orange-500/10 border border-orange-500/30 font-mono text-xs text-orange-400 truncate max-w-[100px]">
          {proof.root_hash.slice(0, 8)}...
        </div>
      </div>

      {/* Verify button */}
      {onVerify && (
        <Button
          size="sm"
          className={cn(
            'w-full h-8 text-xs',
            verified === true && 'bg-green-600 hover:bg-green-700',
            verified === false && 'bg-red-600 hover:bg-red-700'
          )}
          onClick={onVerify}
        >
          {verified === true ? (
            <>
              <Check className="w-3 h-3 mr-1" />
              Valid Proof
            </>
          ) : verified === false ? (
            <>
              <X className="w-3 h-3 mr-1" />
              Invalid Proof
            </>
          ) : (
            <>
              <Shield className="w-3 h-3 mr-1" />
              Verify Mathematically
            </>
          )}
        </Button>
      )}
    </div>
  );
}

function ProofStepSimple({ step }: { step: ProofStep }) {
  return (
    <div className={cn(
      'px-2 py-1.5 rounded border font-mono text-xs truncate max-w-[100px]',
      step.direction === 'right'
        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
    )}>
      <span className="mr-1">
        {step.direction === 'right' ? <ArrowRight className="w-3 h-3 inline" /> : <ArrowLeft className="w-3 h-3 inline" />}
      </span>
      {step.hash.slice(0, 8)}...
    </div>
  );
}

import { X } from 'lucide-react';
