use merkle_tree::MerkleTree;

fn main() {
    let initial_data = vec![
        "a".to_string(),
        "b".to_string(),
        "c".to_string(),
        "d".to_string(),
    ];

    let mut tree = MerkleTree::new(initial_data.clone());
    println!("Initial Tree with 4 nodes:\n{}", tree);
    println!("Root hash: {}\n", tree.get_root_hash().unwrap());

    // Verify initial proofs
    println!("=== Initial Proofs ===");
    for data in &initial_data {
        let proof = tree.generate_proof(data);
        let verified = if tree.verify_proof(&proof) {
            "✓ Verified"
        } else {
            "✗ Not Verified"
        };
        println!("{}: {}", data, verified);
    }

    // Incrementally add new nodes
    println!("\n=== Adding 'e' incrementally ===");
    tree.add("e".to_string());
    println!("Tree after adding 'e':\n{}", tree);
    println!("New root hash: {}\n", tree.get_root_hash().unwrap());

    println!("=== Proofs after adding 'e' ===");
    let all_data = vec!["a", "b", "c", "d", "e"];
    for data in &all_data {
        let proof = tree.generate_proof(data);
        let verified = if tree.verify_proof(&proof) {
            "✓ Verified"
        } else {
            "✗ Not Verified"
        };
        println!("{}: {}", data, verified);
    }

    // Add another node
    println!("\n=== Adding 'f' incrementally ===");
    tree.add("f".to_string());
    println!("Tree after adding 'f':\n{}", tree);
    println!("New root hash: {}\n", tree.get_root_hash().unwrap());

    println!("=== Proofs after adding 'f' ===");
    let all_data = vec!["a", "b", "c", "d", "e", "f"];
    for data in &all_data {
        let proof = tree.generate_proof(data);
        let verified = if tree.verify_proof(&proof) {
            "✓ Verified"
        } else {
            "✗ Not Verified"
        };
        println!("{}: {}", data, verified);
    }
}
