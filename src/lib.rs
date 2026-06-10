use std::{cell::RefCell, collections::HashMap, fmt, rc::Rc};

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Direction {
    Left,
    Right,
}

#[derive(Debug, Clone)]
pub struct Proof {
    pub hash: String,
    pub direction: Direction,
}

#[derive(Debug, Clone)]
pub struct MerkleProof {
    pub leaf: String,
    pub proof: Vec<Proof>,
}

#[derive(Debug, Clone)]
pub struct Node<T: Clone> {
    pub content: T,
    pub hash: String,
    pub left: Option<Rc<Node<T>>>,
    pub right: Option<Rc<Node<T>>>,
    pub parent: RefCell<Option<Rc<Node<T>>>>,
}

impl<T: Clone> Node<T> {
    pub fn new(
        content: T,
        hash: String,
        left: Option<Rc<Node<T>>>,
        right: Option<Rc<Node<T>>>,
    ) -> Self {
        Node {
            content,
            hash,
            left,
            right,
            parent: RefCell::new(None),
        }
    }
}

#[derive(Debug, Clone)]
pub struct MerkleTree {
    pub data: Vec<String>,
    pub root: Option<Rc<Node<String>>>,
    pub leaf_map: HashMap<String, Rc<Node<String>>>,
}

impl fmt::Display for MerkleTree {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        if let Some(root) = &self.root {
            let mut res = String::new();
            self.print_tree(&mut res, root, 0);
            write!(f, "{}", res)
        } else {
            write!(f, "Merkle Tree is empty")
        }
    }
}

impl MerkleTree {
    fn print_tree(&self, tree: &mut String, node: &Rc<Node<String>>, level: usize) {
        for _ in 0..level {
            tree.push_str("  ");
        }
        tree.push_str(&format!("|-- {}", node.hash));
        if node.left.is_none() && node.right.is_none() {
            tree.push_str(&format!(", {}", node.content));
        }
        tree.push_str("\n");
        if let Some(left) = &node.left {
            self.print_tree(tree, left, level + 1);
        }
        if let Some(right) = &node.right {
            self.print_tree(tree, right, level + 1);
        }
    }
}

// Build Tree
impl MerkleTree {
    pub fn new(data: Vec<String>) -> Self {
        let mut tree = MerkleTree {
            data: vec![],
            root: None,
            leaf_map: HashMap::new(),
        };
        tree.build(data);
        tree
    }

    pub fn build(&mut self, data: Vec<String>) {
        if data.is_empty() {
            return;
        }
        self.data = data.clone();
        let nodes: Vec<Rc<Node<String>>> = data
            .into_iter()
            .map(|content| {
                let node = Rc::new(Node::new(
                    content.clone(),
                    Self::hash(content.as_bytes()),
                    None,
                    None,
                ));
                self.leaf_map.insert(content, Rc::clone(&node));
                node
            })
            .collect();
        self.build_tree(nodes, true);
    }

    fn build_tree(&mut self, nodes: Vec<Rc<Node<String>>>, is_leaf: bool) {
        if !is_leaf && nodes.len() == 1 {
            self.root = Some(Rc::clone(&nodes[0]));
            return;
        }

        let mut new_nodes = Vec::new();
        for i in (0..nodes.len()).step_by(2) {
            let left = &nodes[i];
            let right = nodes.get(i + 1);

            let content = if let Some(right_node) = right {
                format!("{}{}", left.hash, right_node.hash)
            } else {
                format!("{}{}", left.hash, left.hash)
            };

            let hash = Self::hash(content.as_bytes());
            let parent = Rc::new(Node {
                content,
                hash,
                left: Some(Rc::clone(left)),
                right: right.map(Rc::clone),
                parent: RefCell::new(None),
            });

            // Set parent pointers
            *left.parent.borrow_mut() = Some(Rc::clone(&parent));
            if let Some(r) = right {
                *r.parent.borrow_mut() = Some(Rc::clone(&parent));
            }

            new_nodes.push(parent);
        }
        self.build_tree(new_nodes, false);
    }
}

// Update Tree
impl MerkleTree {
    pub fn add(&mut self, data: String) {
        if self.root.is_none() {
            // First leaf
            self.build(vec![data]);
            return;
        }

        self.data.push(data.clone());

        let new_leaf = Rc::new(Node {
            content: data.clone(),
            hash: Self::hash(data.as_bytes()),
            left: None,
            right: None,
            parent: RefCell::new(None),
        });

        self.leaf_map.insert(data, new_leaf);

        // Rebuild only from the affected leaf level upward
        // This is more efficient than full rebuild
        self.rebuild_from_level_efficient();
    }

    fn rebuild_from_level_efficient(&mut self) {
        if self.data.is_empty() {
            self.root = None;
            return;
        }

        // Get all current leaves in order
        let current_level: Vec<Rc<Node<String>>> = self
            .data
            .iter()
            .filter_map(|data_item| self.leaf_map.get(data_item).cloned())
            .collect();

        if current_level.is_empty() {
            return;
        }

        if current_level.len() == 1 {
            *current_level[0].parent.borrow_mut() = None;
            self.root = Some(Rc::clone(&current_level[0]));
            return;
        }

        // Build upward from leaves, reusing leaf nodes
        self.build_parents_from_level(current_level);
    }

    fn build_parents_from_level(&mut self, mut current_level: Vec<Rc<Node<String>>>) {
        loop {
            let mut next_level = Vec::new();

            for i in (0..current_level.len()).step_by(2) {
                let left = &current_level[i];
                let right = current_level.get(i + 1);

                // Only create parent if children don't already have matching parent
                let existing_parent = left.parent.borrow().clone();

                let parent = if let Some(existing) = existing_parent {
                    // Check if this parent still matches our tree structure
                    if right.is_some() {
                        // We have a right sibling, verify parent matches
                        let right_node = right.unwrap();
                        let is_correct = existing
                            .right
                            .as_ref()
                            .map(|r| Rc::ptr_eq(r, right_node))
                            .unwrap_or(false);

                        if is_correct {
                            // Parent is still valid, reuse it
                            Rc::clone(&existing)
                        } else {
                            // Parent doesn't match, create new one
                            self.create_new_parent(left, right)
                        }
                    } else {
                        // No right sibling, need new parent for left duplication
                        self.create_new_parent(left, None)
                    }
                } else {
                    // No existing parent, create new one
                    self.create_new_parent(left, right)
                };

                *left.parent.borrow_mut() = Some(Rc::clone(&parent));
                if let Some(r) = right {
                    *r.parent.borrow_mut() = Some(Rc::clone(&parent));
                }

                next_level.push(parent);
            }

            if next_level.len() == 1 {
                self.root = Some(Rc::clone(&next_level[0]));
                break;
            }

            current_level = next_level;
        }
    }

    fn create_new_parent(
        &self,
        left: &Rc<Node<String>>,
        right: Option<&Rc<Node<String>>>,
    ) -> Rc<Node<String>> {
        let content = if let Some(right_node) = right {
            format!("{}{}", left.hash, right_node.hash)
        } else {
            format!("{}{}", left.hash, left.hash)
        };

        let hash = Self::hash(content.as_bytes());
        Rc::new(Node {
            content,
            hash,
            left: Some(Rc::clone(left)),
            right: right.map(|r| Rc::clone(r)),
            parent: RefCell::new(None),
        })
    }
}

// Utility functions
impl MerkleTree {
    pub fn hash(data: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data);
        let result = hasher.finalize();
        hex::encode(result)
    }

    pub fn get_root_hash(&self) -> Option<String> {
        self.root.as_ref().map(|node| node.hash.clone())
    }
}

// Proof Generation
impl MerkleTree {
    pub fn generate_proof(&self, leaf: &str) -> MerkleProof {
        if !self.leaf_map.contains_key(leaf) {
            return MerkleProof {
                leaf: leaf.to_string(),
                proof: vec![],
            };
        }

        let mut proof = MerkleProof {
            leaf: leaf.to_string(),
            proof: vec![],
        };

        // Get leaf node from leaf_map and traverse to root
        if let Some(leaf_node) = self.leaf_map.get(leaf) {
            proof.proof = self.collect_proof_from_leaf(leaf_node);
        }

        proof
    }

    fn collect_proof_from_leaf(&self, leaf_node: &Rc<Node<String>>) -> Vec<Proof> {
        let mut current = Some(Rc::clone(leaf_node));
        let mut proof: Vec<Proof> = vec![];

        while let Some(node) = current {
            if let Some(parent) = &*node.parent.borrow() {
                // Determine if current node is left or right child
                let is_left_child = parent
                    .left
                    .as_ref()
                    .map(|l| Rc::ptr_eq(l, &node))
                    .unwrap_or(false);

                if is_left_child {
                    // Current is left child
                    if let Some(sibling) = &parent.right {
                        // Has right sibling
                        proof.push(Proof {
                            hash: sibling.hash.clone(),
                            direction: Direction::Right,
                        });
                    } else {
                        // No right sibling, use current node's hash (it's duplicated)
                        proof.push(Proof {
                            hash: node.hash.clone(),
                            direction: Direction::Right,
                        });
                    }
                } else {
                    // Current is right child
                    if let Some(sibling) = &parent.left {
                        // Has left sibling
                        proof.push(Proof {
                            hash: sibling.hash.clone(),
                            direction: Direction::Left,
                        });
                    }
                }

                current = Some(Rc::clone(parent));
            } else {
                // Reached root
                break;
            }
        }
        return proof;
    }
}

// Proof Verification
impl MerkleTree {
    pub fn verify_proof(&self, proof: &MerkleProof) -> bool {
        if self.root.is_none() {
            return false;
        }

        let mut hash = Self::hash(proof.leaf.as_bytes());

        for p in &proof.proof {
            match p.direction {
                Direction::Left => {
                    hash = p.hash.clone() + &hash;
                }
                Direction::Right => {
                    hash = hash + &p.hash;
                }
            }
            hash = Self::hash(hash.as_bytes());
        }

        hash == self.get_root_hash().unwrap()
    }
}

// WebAssembly bindings
#[cfg(target_arch = "wasm32")]
pub mod wasm {
    use super::*;
    use serde::{Deserialize, Serialize};
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    pub struct WasmMerkleTree {
        tree: MerkleTree,
    }

    #[derive(Serialize, Deserialize)]
    pub struct WasmProof {
        pub leaf: String,
        pub proof: Vec<WasmProofItem>,
        pub root_hash: String,
        pub leaf_hash: String,
    }

    #[derive(Serialize, Deserialize)]
    pub struct WasmProofItem {
        pub hash: String,
        pub direction: String,
    }

    /// Serializable tree node for JSON output
    #[derive(Serialize, Deserialize, Debug)]
    pub struct WasmTreeNode {
        pub hash: String,
        pub content: Option<String>,
        pub level: usize,
        pub left: Option<Box<WasmTreeNode>>,
        pub right: Option<Box<WasmTreeNode>>,
    }

    /// Complete tree structure with metadata
    #[derive(Serialize, Deserialize, Debug)]
    pub struct WasmTreeStructure {
        pub root_hash: Option<String>,
        pub leaves_count: usize,
        pub leaves: Vec<String>,
        pub tree: Option<WasmTreeNode>,
        pub depth: usize,
    }

    impl WasmTreeNode {
        fn from_node(node: &Rc<Node<String>>, level: usize) -> Self {
            let is_leaf = node.left.is_none() && node.right.is_none();

            WasmTreeNode {
                hash: node.hash.clone(),
                content: if is_leaf {
                    Some(node.content.clone())
                } else {
                    None
                },
                level,
                left: node
                    .left
                    .as_ref()
                    .map(|n| Box::new(WasmTreeNode::from_node(n, level + 1))),
                right: node
                    .right
                    .as_ref()
                    .map(|n| Box::new(WasmTreeNode::from_node(n, level + 1))),
            }
        }

        fn calculate_depth(&self) -> usize {
            let left_depth = self.left.as_ref().map(|n| n.calculate_depth()).unwrap_or(0);
            let right_depth = self
                .right
                .as_ref()
                .map(|n| n.calculate_depth())
                .unwrap_or(0);
            1 + std::cmp::max(left_depth, right_depth)
        }
    }

    #[wasm_bindgen]
    impl WasmMerkleTree {
        /// Create a new Merkle tree with initial data
        /// Example: WasmMerkleTree.new("a,b,c,d")
        #[wasm_bindgen(constructor)]
        pub fn new(data: String) -> WasmMerkleTree {
            let data_vec: Vec<String> = if data.len() == 0 {
                vec![]
            } else {
                data.split(',').map(|s| s.trim().to_string()).collect()
            };

            WasmMerkleTree {
                tree: MerkleTree::new(data_vec),
            }
        }

        /// Add a new element to the tree
        #[wasm_bindgen]
        pub fn add(&mut self, data: String) {
            self.tree.add(data);
        }

        /// Get the root hash
        #[wasm_bindgen]
        pub fn get_root_hash(&self) -> Option<String> {
            self.tree.get_root_hash()
        }

        /// Generate a proof for a leaf
        #[wasm_bindgen]
        pub fn generate_proof(&self, leaf: &str) -> String {
            let proof = self.tree.generate_proof(leaf);
            let wasm_proof = WasmProof {
                leaf: proof.leaf,
                proof: proof
                    .proof
                    .iter()
                    .map(|p| WasmProofItem {
                        hash: p.hash.clone(),
                        direction: match p.direction {
                            Direction::Left => "Left".to_string(),
                            Direction::Right => "Right".to_string(),
                        },
                    })
                    .collect(),
                root_hash: self.tree.get_root_hash().unwrap_or_default(),
                leaf_hash: MerkleTree::hash(leaf.as_bytes()),
            };
            serde_json::to_string(&wasm_proof).unwrap()
        }

        /// Verify a proof (JSON string format)
        #[wasm_bindgen]
        pub fn verify_proof(&self, proof_json: &str) -> bool {
            if let Ok(wasm_proof) = serde_json::from_str::<WasmProof>(proof_json) {
                let proof = MerkleProof {
                    leaf: wasm_proof.leaf,
                    proof: wasm_proof
                        .proof
                        .iter()
                        .map(|p| Proof {
                            hash: p.hash.clone(),
                            direction: if p.direction == "Left" {
                                Direction::Left
                            } else {
                                Direction::Right
                            },
                        })
                        .collect(),
                };
                return self.tree.verify_proof(&proof);
            }
            false
        }

        /// Get all leaves (comma-separated)
        #[wasm_bindgen]
        pub fn get_leaves(&self) -> String {
            format!("[{}]", self.tree.data.join(","))
        }

        /// Get tree structure as JSON with metadata
        #[wasm_bindgen]
        pub fn get_tree_structure(&self) -> String {
            let tree_node = self
                .tree
                .root
                .as_ref()
                .map(|root| WasmTreeNode::from_node(root, 0));

            let depth = tree_node.as_ref().map(|n| n.calculate_depth()).unwrap_or(0);

            let structure = WasmTreeStructure {
                root_hash: self.tree.get_root_hash(),
                leaves_count: self.tree.data.len(),
                leaves: self.tree.data.clone(),
                tree: tree_node,
                depth,
            };

            serde_json::to_string(&structure).unwrap_or_else(|_| "{}".to_string())
        }
    }

    #[wasm_bindgen]
    pub fn hash_data(data: &str) -> String {
        MerkleTree::hash(data.as_bytes())
    }
}
