#!/usr/bin/env node

// Example Node.js usage of Merkle Tree WASM

const { WasmMerkleTree, hash_data } = require('./pkg/merkle_tree.js');

console.log('🌳 Merkle Tree WASM - Node.js Example\n');

// Create tree with initial data
console.log('📦 Creating tree with data: a, b, c, d');
const tree = new WasmMerkleTree("a,b,c,d");
console.log('✓ Root hash:', tree.get_root_hash());
console.log('✓ Leaves:', tree.get_leaves());

// Generate and verify proofs for existing nodes
console.log('\n🔍 Verifying initial proofs:');
['a', 'b', 'c', 'd'].forEach(leaf => {
    const proof = tree.generate_proof(leaf);
    const isValid = tree.verify_proof(proof);
    console.log(`  ${leaf}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});

// Add new data incrementally
console.log('\n➕ Adding new data incrementally:');
['e', 'f', 'g'].forEach(data => {
    tree.add(data);
    console.log(`  Added '${data}' - Root hash: ${tree.get_root_hash()}`);
});

// Verify all proofs after additions
console.log('\n🔍 Verifying all proofs after additions:');
tree.get_leaves().split(',').forEach(leaf => {
    const proof = tree.generate_proof(leaf);
    const isValid = tree.verify_proof(proof);
    console.log(`  ${leaf}: ${isValid ? '✓ Valid' : '✗ Invalid'}`);
});

// Hash example
console.log('\n🔐 Hash examples:');
const testData = ['hello', 'world', 'merkle-tree'];
testData.forEach(data => {
    const hash = hash_data(data);
    console.log(`  SHA256("${data}"): ${hash.slice(0, 32)}...`);
});

console.log('\n✓ All examples completed!');
