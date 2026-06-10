/* @ts-self-types="./merkle_tree.d.ts" */
import * as wasm from "./merkle_tree_bg.wasm";
import { __wbg_set_wasm } from "./merkle_tree_bg.js";

__wbg_set_wasm(wasm);
wasm.__wbindgen_start();
export {
    WasmMerkleTree, hash_data
} from "./merkle_tree_bg.js";
