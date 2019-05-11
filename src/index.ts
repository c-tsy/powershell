import execa = require("execa");
import { Iconv } from 'iconv'
const g2u = new Iconv('GB2312', 'UTF-8')
const u2g = new Iconv('GB2312', 'UTF-8')
export default class PowerShell {
    process: execa.ExecaChildProcess;
    protected _promise: {i:number, s?: Function, j?: Function, d: string,t:number } = { d: "",t:0 ,i:-1};
    
    protected _wait: { i: number, d: string, s: Function, j: Function, t: number }[] = [];
    id: number = 0;
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
        if (!this.str.endsWith(this.endStr)) { return;}
        let index = this.str.split(this.endStr);
        if (index.length > 1 && index[index.length - 2].length > 0) {
            this.str = index[index.length - 2].substr(this._promise.d.length).replace(/[\r\n]{1,}/, '').replace(/[\r\n]{1,}$/, '')
            if (this.str.indexOf('At line') > 10) {
                this.reject(this.str,this._promise.i)
            } else {
                this.resolve(this.str)
            }
            this.str = "";
        }
    }
    protected error(data) {
        if (this.str.endsWith(this.endStr)) {
            let r = this.str.substr(this._promise.d.length, this.str.length - this.endStr.length - this._promise.d.length)
            this.reject(r,this._promise.i)
            this.str = "";
        }
    }
    exit() {
        this.process.kill()
    }
    /**
     * 成功
     * @param data 
     */
    resolve(data: any) {
        if (this._promise.s) {
            this._promise.s(data);
        }
        this.next()
    }
    /**
     * 失败
     * @param data 
     * @param i 
     */
    reject(data: any,i) {
        if (this._promise.j&&this._promise.i==i) {
            this._promise.j(data);
        }
        this.next()
    }
    /**
     * 切换到wait中的下一个
     */
    next() {        
        if (this._wait.length > 0) {
            this._promise = this._wait.shift();        
            this.write(this._promise.d)
            if (this._promise.t) {
                setTimeout(() => {
                    this.reject('Timeout',this._promise.i)
                },this._promise.t)
            }
        } else {
            this._promise = { i: -1, d: '', t: 0 }
        }
    }
    /**
     * 发送命令
     * @param s 
     */
    write(s: string) {
        this.process.stdin.write(u2g.convert(Buffer.from(s)))
    }
    /**
     * 发送cmd命令
     * @param cmd 
     * @param timeout 
     */
    cmd(cmd: string,timeout=0) {
        if (!cmd.endsWith('\n')) {
            cmd = cmd + '\r\n'
        }
        let i = this.id++;
        if (this._promise.s) {
            return new Promise((s, j) => {
                this._wait.push({ i, d: cmd, s, j, t: timeout })
            })
        }
        return new Promise((s, j) => {
            this._promise = { i, d: cmd, s, j, t: timeout }
            this.write(cmd)
            if (timeout) {
                setTimeout(() => {
                    this.reject('Timeout',i)
                },timeout)
            }
        })
    }
}