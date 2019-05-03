import PowerShell from './index';
(async () => {
    let p = new PowerShell()
    try {
        console.log(await p.cmd(`echo 2`))
        console.log(await p.cmd(`echo $True`))
        console.log(await p.cmd(`echo $False`))
        console.log(await p.cmd(`echo 2`))
        console.log(await p.cmd(`echo $True`))
        console.log(await p.cmd(`echo $False`))
        console.log(await p.cmd(`echo 2`))
        console.log(await p.cmd(`echo $True`))
        console.log(await p.cmd(`echo $False`))
        console.log(await p.cmd(`wmic printer get * /FORMAT:csv`))
    } catch (error) {

    }
    p.process.kill()
    process.exit();
})()
function timeout(n: number) {
    return new Promise((s) => setTimeout(s, n))
}