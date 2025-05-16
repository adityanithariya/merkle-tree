use std::{fmt, vec};

use sha2::{Digest, Sha256};

#[derive(Debug, Clone)]
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
    pub left: Option<Box<Node<T>>>,
    pub right: Option<Box<Node<T>>>,
}

impl<T: Clone> Node<T> {
    pub fn new(
        content: T,
        hash: String,
        left: Option<Box<Node<T>>>,
        right: Option<Box<Node<T>>>,
    ) -> Self {
        Node {
            content,
            hash,
            left,
            right,
        }
    }
}

#[derive(Debug, Clone)]
pub struct MerkleTree {
    pub data: Vec<String>,
    pub root: Option<Node<String>>,
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

// Build Tree
impl MerkleTree {
    pub fn new(data: Vec<String>) -> Self {
        let mut tree = MerkleTree {
            data: vec![],
            root: None,
        };
        tree.build(data);
        tree
    }
    pub fn build(&mut self, data: Vec<String>) {
        if data.is_empty() {
            return;
        }
        self.data = data.clone();
        let nodes: Vec<Node<String>> = data
            .into_iter()
            .map(|content| {
                Node::new(
                    content.clone(),
                    MerkleTree::hash(content.as_bytes()),
                    None,
                    None,
                )
            })
            .collect();
        self.build_tree(nodes);
    }
    fn build_tree(&mut self, nodes: Vec<Node<String>>) {
        if nodes.len() == 1 {
            self.root = Some(nodes[0].clone());
            return;
        }
        let mut new_nodes = Vec::new();
        for i in (0..nodes.len()).step_by(2) {
            let left = &nodes[i];
            let right = nodes.get(i + 1);
            let content = if right.is_some() {
                format!("{}{}", left.hash, right.as_ref().unwrap().hash)
            } else {
                format!("{}{}", left.hash, left.hash)
            };
            let hash = MerkleTree::hash(content.as_bytes());
            new_nodes.push(Node {
                content,
                hash,
                left: Some(Box::new(left.clone())),
                right: if right.is_some() {
                    Some(Box::new(right.unwrap().clone()))
                } else {
                    None
                },
            });
        }
        self.build_tree(new_nodes);
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
    pub fn print_tree(&self, tree: &mut String, node: &Node<String>, level: usize) {
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

// Proof Generation
impl MerkleTree {
    pub fn generate_proof(&self, leaf: &str) -> MerkleProof {
        if self.root.is_none() {
            return MerkleProof {
                leaf: String::from(leaf),
                proof: vec![],
            };
        }
        let mut proof = MerkleProof {
            leaf: String::from(leaf),
            proof: vec![],
        };
        self.get_proofs(leaf, &mut proof.proof, self.root.as_ref().unwrap());
        proof
    }
    fn get_proofs(&self, leaf: &str, proof: &mut Vec<Proof>, curr: &Node<String>) -> bool {
        if curr.content == leaf {
            return true;
        }
        let mut found = false;
        if let Some(x) = curr.left.as_ref() {
            let fl = self.get_proofs(leaf, proof, &x);
            if fl {
                proof.push(Proof {
                    hash: if curr.right.is_some() {
                        curr.right.clone().unwrap().hash
                    } else {
                        curr.left.clone().unwrap().hash
                    },
                    direction: Direction::Right,
                });
                found = fl;
            }
        }
        if let Some(x) = curr.right.as_ref() {
            let fr = self.get_proofs(leaf, proof, &x);
            if fr {
                proof.push(Proof {
                    hash: curr.left.clone().unwrap().hash,
                    direction: Direction::Left,
                });
                found = fr;
            }
        }
        return found;
    }
}

// Proof Verification
impl MerkleTree {
    pub fn verify_proof(&self, proof: &MerkleProof) -> bool {
        if self.root.is_none() {
            return false;
        }
        let mut hash = MerkleTree::hash(proof.leaf.as_bytes());
        for i in &proof.proof {
            match i.direction {
                Direction::Left => {
                    hash = i.hash.clone() + &hash;
                }
                Direction::Right => {
                    hash = hash + &i.hash;
                }
            }
            hash = MerkleTree::hash(hash.as_bytes());
        }
        hash == self.get_root_hash().unwrap()
    }
}
