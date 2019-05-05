"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const execa = require("execa");
const iconv_1 = require("iconv");
const g2u = new iconv_1.Iconv('GB2312', 'UTF-8');
const u2g = new iconv_1.Iconv('GB2312', 'UTF-8');
class PowerShell {
    constructor() {
        this._promise = { d: "", t: 0, i: 0 };
        this._wait = [];
        this.id = 0;
        this.started = -2;
        this.endStr = "";
        this.str = "";
        this.endStr = `PS ${process.cwd()}> `;
        this.process = execa('powershell.exe', [], { cwd: process.cwd() });
        this.process.stdout.on('data', (data) => {
            this.str = this.str + g2u.convert(data).toString('utf8');
            this.data();
        });
        this.process.stderr.on('data', (data) => {
            this.str = this.str + data.toString('utf8');
            this.error(data);
        });
    }
    data() {
        if (this.started < 0) {
            if (this.str.indexOf('\r\n\r\n') > -1) {
                this.started = 1;
            }
            this.str = "";
            return;
        }
        if (!this.str.endsWith(this.endStr)) {
            return;
        }
        let index = this.str.split(this.endStr);
        if (index.length > 1 && index[index.length - 2].length > 0) {
            this.str = index[index.length - 2].substr(this._promise.d.length).replace(/[\r\n]{1,}/, '').replace(/[\r\n]{1,}$/, '');
            if (this.str.indexOf('At line') > 10) {
                this.reject(this.str, this._promise.i);
            }
            else {
                this.resolve(this.str);
            }
            this.str = "";
        }
    }
    error(data) {
        if (this.str.endsWith(this.endStr)) {
            let r = this.str.substr(this._promise.d.length, this.str.length - this.endStr.length - this._promise.d.length);
            this.reject(r, this._promise.i);
            this.str = "";
        }
    }
    exit() {
        this.process.kill();
    }
    resolve(data) {
        if (this._promise.s) {
            this._promise.s(data);
        }
        this.next();
    }
    reject(data, i) {
        if (this._promise.j && this._promise.i == i) {
            this._promise.j(data);
        }
        this.next();
    }
    next() {
        if (this._wait.length > 0) {
            this._promise = this._wait.shift();
            this.write(this._promise.d);
            if (this._promise.t) {
                setTimeout(() => {
                    this.reject('Timeout', this._promise.i);
                });
            }
        }
    }
    write(s) {
        this.process.stdin.write(u2g.convert(Buffer.from(s)));
    }
    cmd(cmd, timeout = 0) {
        if (!cmd.endsWith('\n')) {
            cmd = cmd + '\r\n';
        }
        if (this._promise.s) {
            return new Promise((s, j) => {
                this._wait.push({ i: this.id++, d: cmd, s, j, t: timeout });
            });
        }
        return new Promise((s, j) => {
            this._promise = { i: this.id++, d: cmd, s, j, t: timeout };
            this.write(cmd);
        });
    }
}
exports.default = PowerShell;
//# sourceMappingURL=index.js.map