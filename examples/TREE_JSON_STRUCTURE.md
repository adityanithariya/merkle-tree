# Tree Structure JSON Output

The `get_tree_structure()` method now returns a properly structured JSON object that can be easily visualized in the UI.

## JSON Structure Format

```json
{
  "root_hash": "3615e586768e706351e326736e446554c49123d0e24c169d3ecf9b791a82636b",
  "leaves_count": 5,
  "leaves": ["a", "b", "c", "d", "e"],
  "depth": 4,
  "tree": {
    "hash": "3615e586768e706351e326736e446554c49123d0e24c169d3ecf9b791a82636b",
    "content": null,
    "level": 0,
    "left": {
      "hash": "58c89d709329eb37285837b042ab6ff72c7c8f74de0446b091b6a0131c102cfd",
      "content": null,
      "level": 1,
      "left": {
        "hash": "62af5c3cb8da3e4f25061e829ebeea5c7513c54949115b1acc225930a90154da",
        "content": null,
        "level": 2,
        "left": {
          "hash": "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
          "content": "a",
          "level": 3,
          "left": null,
          "right": null
        },
        "right": {
          "hash": "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d",
          "content": "b",
          "level": 3,
          "left": null,
          "right": null
        }
      },
      "right": {
        "hash": "d3a0f1c792ccf7f1708d5422696263e35755a86917ea76ef9242bd4a8cf4891a",
        "content": null,
        "level": 2,
        "left": {
          "hash": "2e7d2c03a9507ae265ecf5b5356885a53393a2029d241394997265a1a25aefc6",
          "content": "c",
          "level": 3,
          "left": null,
          "right": null
        },
        "right": {
          "hash": "18ac3e7343f016890c510e93f935261169d9e3f565436429830faf0934f4f8e4",
          "content": "d",
          "level": 3,
          "left": null,
          "right": null
        }
      }
    },
    "right": {
      "hash": "463bb9d8f7fe77a1f4ea68498899ecec274cdf238783a42cb448ce1e2d8cbb6a",
      "content": null,
      "level": 1,
      "left": {
        "hash": "1a98a2105977d77929b907710dfad6b5f9cdae2abbcaa989a9387ed62c706cd1",
        "content": null,
        "level": 2,
        "left": {
          "hash": "3f79bb7b435b05321651daefd374cdc681dc06faa65e374e38337b88ca046dea",
          "content": "e",
          "level": 3,
          "left": null,
          "right": null
        },
        "right": null
      },
      "right": null
    }
  }
}
```

## Field Descriptions

### Top Level (WasmTreeStructure)
- **root_hash**: The hash of the root node (also the Merkle root)
- **leaves_count**: Number of leaf nodes in the tree
- **leaves**: Array of all leaf data in order
- **depth**: Height/depth of the tree (root is level 0)
- **tree**: The root node of the tree structure

### Node Level (WasmTreeNode)
- **hash**: SHA256 hash of this node's content
- **content**: The data value (only present for leaf nodes, `null` for parent nodes)
- **level**: Depth level in the tree (0 = root)
- **left**: Left child node (null if no left child)
- **right**: Right child node (null if no right child)

## Usage Examples

### JavaScript/TypeScript in Browser

```typescript
import { WasmMerkleTree } from './pkg/merkle_tree.js';

const tree = new WasmMerkleTree("a,b,c,d,e");
const structure = JSON.parse(tree.get_tree_structure());

console.log("Root hash:", structure.root_hash);
console.log("Total leaves:", structure.leaves_count);
console.log("Tree depth:", structure.depth);
console.log("All leaves:", structure.leaves);

// Visualize the tree
function printTree(node, indent = "") {
    if (!node) return;
    
    const isLeaf = node.content !== null;
    console.log(indent + "├─ " + node.hash.slice(0, 8) + 
                (isLeaf ? ` (leaf: ${node.content})` : " (parent)"));
    
    if (node.left) printTree(node.left, indent + "│  ");
    if (node.right) printTree(node.right, indent + "│  ");
}

printTree(structure.tree);
```

### React Component Example

```typescript
import React, { useState } from 'react';
import { WasmMerkleTree } from './pkg/merkle_tree.js';

interface TreeNode {
    hash: string;
    content: string | null;
    level: number;
    left: TreeNode | null;
    right: TreeNode | null;
}

interface TreeStructure {
    root_hash: string;
    leaves_count: number;
    leaves: string[];
    depth: number;
    tree: TreeNode | null;
}

function TreeVisualizer() {
    const [tree, setTree] = useState<WasmMerkleTree | null>(null);
    const [structure, setStructure] = useState<TreeStructure | null>(null);

    const handleInitialize = (data: string) => {
        const newTree = new WasmMerkleTree(data);
        setTree(newTree);
        const treeStructure = JSON.parse(newTree.get_tree_structure());
        setStructure(treeStructure);
    };

    const renderNode = (node: TreeNode | null): React.ReactNode => {
        if (!node) return null;

        const isLeaf = node.content !== null;
        
        return (
            <div style={{ 
                marginLeft: 20, 
                padding: 10, 
                border: '1px solid #ddd', 
                borderRadius: 4,
                backgroundColor: isLeaf ? '#e3f2fd' : '#f5f5f5'
            }}>
                <div style={{ fontFamily: 'monospace', fontSize: 12 }}>
                    <strong>Hash:</strong> {node.hash.slice(0, 16)}...
                </div>
                {isLeaf && (
                    <div style={{ fontFamily: 'monospace', fontSize: 12, marginTop: 5 }}>
                        <strong>Content:</strong> {node.content}
                    </div>
                )}
                <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                    Level: {node.level}
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 10 }}>
                    {node.left && (
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Left</div>
                            {renderNode(node.left)}
                        </div>
                    )}
                    {node.right && (
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 5 }}>Right</div>
                            {renderNode(node.right)}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div>
            <input 
                type="text" 
                placeholder="Enter comma-separated data"
                onBlur={(e) => handleInitialize(e.target.value)}
            />
            
            {structure && (
                <div style={{ marginTop: 20 }}>
                    <h3>Tree Metadata</h3>
                    <p>Root Hash: <code>{structure.root_hash}</code></p>
                    <p>Leaves: {structure.leaves.join(', ')}</p>
                    <p>Tree Depth: {structure.depth}</p>
                    
                    <h3>Tree Structure</h3>
                    {renderNode(structure.tree)}
                </div>
            )}
        </div>
    );
}

export default TreeVisualizer;
```

### Vue 3 Component Example

```vue
<template>
    <div>
        <input 
            v-model="inputData" 
            placeholder="Enter comma-separated data"
            @blur="initializeTree"
        />
        
        <div v-if="structure" style="margin-top: 20px">
            <h3>Tree Metadata</h3>
            <p>Root Hash: <code>{{ structure.root_hash }}</code></p>
            <p>Leaves: {{ structure.leaves.join(', ') }}</p>
            <p>Tree Depth: {{ structure.depth }}</p>
            
            <h3>Tree Structure</h3>
            <TreeNode :node="structure.tree" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { WasmMerkleTree } from './pkg/merkle_tree.js';
import TreeNode from './TreeNode.vue';

const inputData = ref('a,b,c,d,e');
const structure = ref(null);

function initializeTree() {
    const tree = new WasmMerkleTree(inputData.value);
    structure.value = JSON.parse(tree.get_tree_structure());
}
</script>
```

### TreeNode.vue Component

```vue
<template>
    <div v-if="node" :style="containerStyle">
        <div :style="hashStyle">
            <strong>Hash:</strong> {{ node.hash.slice(0, 16) }}...
        </div>
        <div v-if="node.content" :style="contentStyle">
            <strong>Content:</strong> {{ node.content }}
        </div>
        <div :style="levelStyle">Level: {{ node.level }}</div>
        
        <div v-if="node.left || node.right" :style="childrenStyle">
            <div v-if="node.left" :style="childStyle">
                <div :style="labelStyle">Left</div>
                <TreeNode :node="node.left" />
            </div>
            <div v-if="node.right" :style="childStyle">
                <div :style="labelStyle">Right</div>
                <TreeNode :node="node.right" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const props = defineProps();

const isLeaf = () => props.node?.content !== null;

const containerStyle = {
    marginLeft: '20px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: isLeaf() ? '#e3f2fd' : '#f5f5f5'
};

const hashStyle = { fontFamily: 'monospace', fontSize: '12px' };
const contentStyle = { fontFamily: 'monospace', fontSize: '12px', marginTop: '5px' };
const levelStyle = { fontSize: '12px', color: '#666', marginTop: '5px' };
const childrenStyle = { display: 'flex', gap: '20px', marginTop: '10px' };
const childStyle = { flex: 1 };
const labelStyle = { fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' };
</script>
```

## Benefits

✅ **Well-structured JSON** - Easy to parse and traverse  
✅ **Metadata included** - Root hash, depth, and leaf count  
✅ **Recursive structure** - Faithful representation of the tree  
✅ **UI-ready** - Perfect for visualizations and debugging  
✅ **Serializable** - Works seamlessly with serde_json  
✅ **No manual parsing** - All data accessible via standard JSON

## Integration

Simply call:
```javascript
const treeStructure = JSON.parse(tree.get_tree_structure());
```

And use the resulting object directly in your UI components for rendering, debugging, or analysis.
