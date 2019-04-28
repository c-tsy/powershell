"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = __importDefault(require("./index"));
(async () => {
    let p = new index_1.default();
    try {
        console.log(await p.cmd(`echo 1`));
        console.log(await p.cmd(`echo 2`));
        console.log(await p.cmd(`echo $True`));
        console.log(await p.cmd(`echo $False`));
    }
    catch (error) {
    }
    p.process.kill();
    process.exit();
})();
function timeout(n) {
    return new Promise((s) => setTimeout(s, n));
}
//# sourceMappingURL=test.js.map