use merkle_tree::MerkleTree;

fn main() {
    let data = vec![
        "a".to_string(),
        "b".to_string(),
        "c".to_string(),
        "d".to_string(),
        "e".to_string(),
    ];

    let tree = MerkleTree::new(data.clone());
    println!("Tree: \n{}", tree);
    for i in data {
        let proof = tree.generate_proof(&i);
        println!(
            "{:?}: {}\n",
            proof,
            if tree.verify_proof(&proof) {
                "Verified"
            } else {
                "Not Verified"
            }
        );
    }
}
