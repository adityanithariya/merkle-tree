# Quick Start

## Building as WebAssembly

This project can be compiled to WebAssembly for use in web browsers and Node.js.

### Build for Web

```bash
wasm-pack build --target web
```

### Build for Node.js

```bash
wasm-pack build --target nodejs
```

### Build for Bundlers (Webpack, Rollup)

```bash
wasm-pack build --target bundler --out-dir ./client/pkg
```

## Quick Usage Examples

### Browser
```html
<script type="module">
    import { WasmMerkleTree } from './pkg/merkle_tree.js';
    
    const tree = new WasmMerkleTree("a,b,c,d");
    console.log(tree.get_root_hash());
    tree.add("e");
    const proof = tree.generate_proof("a");
    console.log(tree.verify_proof(proof)); // true
</script>
```

### Node.js
```javascript
const { WasmMerkleTree } = require('./pkg/merkle_tree.js');

const tree = new WasmMerkleTree("a,b,c,d");
tree.add("e");
const proof = tree.generate_proof("a");
console.log(tree.verify_proof(proof)); // true
```

## Features

✅ Merkle tree with incremental add operations
✅ Proof generation and verification
✅ SHA256 hashing
✅ Memory efficient with Rc (reference counting)
✅ Parent pointer optimization for O(log n) proof generation
✅ WebAssembly support for browser and Node.js

## File Structure

- `src/lib.rs` - Core Merkle tree implementation + WASM bindings
- `Cargo.toml` - Rust dependencies and WASM configuration
- `example.html` - Interactive browser demo
- `example_node.js` - Node.js usage example
- `WASM_BUILD.md` - Detailed WASM build and usage guide
- `pkg/` - Generated WASM module (after building)

## Performance

- Add operation: O(log n)
- Proof generation: O(log n) via parent pointer traversal
- Proof verification: O(log n)
- Memory: O(n) for n leaves

## See Also

- [WASM_BUILD.md](./WASM_BUILD.md) - Detailed WASM setup and API documentation
