import execa = require("execa");
import { Iconv } from 'iconv'
const g2u = new Iconv('GB2312', 'UTF-8')
const u2g = new Iconv('GB2312', 'UTF-8')
export default class PowerShell {
    process: execa.ExecaChildProcess;
    protected _promise: { s?: Function, j?: Function, d: number, o?: string } = { d: 0 };
    get promise() {
        return this._promise;
    }
    set promise(v) {
        if (!v.s && this._wait.length > 0) {
            let cmd = this._wait.shift();
            this._promise = { d: cmd.d.length, o: cmd.d, s: cmd.s, j: cmd.s }
            this.process.stdin.write(cmd);
        } else {
            this._promise = v;
        }
    }
    protected _wait: { d: string, s: Function, j: Function }[] = [];
    started: number = -2;
    endStr: string = "";
    str: string = "";
    constructor() {
        this.endStr = `PS ${process.cwd()}> `
        // this.endStr.
        this.process = execa('powershell.exe', [], { cwd: process.cwd() })
        this.process.stdout.on('data', (data) => {
            this.str = this.str + g2u.convert(data).toString('utf8')
            this.data();
        })
        this.process.stderr.on('data', (data) => {
            this.str = this.str + data.toString('utf8')
            this.error(data)
        })
        // this.process.stdin.write('\r\n')
    }
    protected data() {
        if (this.started < 0) {
            if (this.str.indexOf('\r\n\r\n') > -1) {
                this.started = 1
            }
            this.str = "";
            return;
        }
        // let c = this.endStr + this._promise.o.substr(0, this._promise.d - 2);
        let index = this.str.split(this.endStr);
        if (index.length > 1 && index[index.length - 2].length > 0) {
            if (this.promise.s instanceof Function) {
                this.str = index[index.length - 2].substr(this.promise.d).replace(/[\r\n]{1,}/, '').replace(/[\r\n]{1,}$/, '')
                if (this.str.indexOf('At line') > 10) {
                    this.promise.j(this.str)
                } else {
                    // let r = this.str.substr(this.promise.d + 2, this.str.length - this.promise.d)
                    // setTimeout(() => {
                    this.promise.s(this.str);
                }
                this.promise = { d: 0 };
                // }, 1)
            }
            this.str = "";
        }
    }
    protected error(data) {
        if (this.str.endsWith(this.endStr)) {
            if (this.promise.s instanceof Function) {
                let r = this.str.substr(this.promise.d, this.str.length - this.endStr.length - this.promise.d)
                this.promise.j(r);
                this.promise = { d: 0 };
            }
            this.str = "";
        }
    }
    exit() {
        this.process.kill()
    }
    write(s: string) {
        this.process.stdin.write(u2g.convert(Buffer.from(s)))
    }
    cmd(cmd: string) {
        if (!cmd.endsWith('\n')) {
            cmd = cmd + '\r\n'
        }
        if (this.promise.s) {
            return new Promise((s, j) => {
                this._wait.push({ d: cmd, s, j })
            })
        }
        return new Promise((s, j) => {
            this.promise = { s, j, d: cmd.length, o: cmd }
            this.write(cmd)
        })
    }
}