"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const execa = require("execa");
class PowerShell {
    constructor() {
        this.promise = { d: 0 };
        this.started = -2;
        this.endStr = "";
        this.str = "";
        this.endStr = `PS ${process.cwd()}> `;
        this.process = execa('powershell.exe', [], { cwd: process.cwd() });
        this.process.stdout.on('data', (data) => {
            this.str = this.str + data.toString('utf8');
            this.data(data);
        });
        this.process.stderr.on('data', (data) => {
            this.str = this.str + data.toString('utf8');
            this.error(data);
        });
        this.process.stdin.write('');
    }
    data(data) {
        if (this.started < 0) {
            this.started++;
            this.str = "";
            return;
        }
        let index = this.str.indexOf(this.endStr);
        if (index > -1) {
            if (this.promise.s instanceof Function) {
                let r = this.str.substr(this.promise.d, this.str.length - this.endStr.length - this.promise.d);
                this.promise.s(r);
                this.promise = { d: 0 };
            }
            this.str = "";
        }
    }
    error(data) {
        if (this.str.endsWith(this.endStr)) {
            if (this.promise.s instanceof Function) {
                let r = this.str.substr(this.promise.d, this.str.length - this.endStr.length - this.promise.d);
                this.promise.j(r);
                this.promise = { d: 0 };
            }
            this.str = "";
        }
    }
    exit() {
        this.process.kill();
    }
    cmd(cmd) {
        if (this.promise.s) {
            throw new Error('Busy');
        }
        return new Promise((s, j) => {
            if (!cmd.endsWith('\n')) {
                cmd = cmd + '\r\n';
            }
            this.promise = { s, j, d: cmd.length, o: cmd };
            this.process.stdin.write(cmd);
        });
    }
}
exports.default = PowerShell;
//# sourceMappingURL=index.js.map