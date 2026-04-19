window.onload = toggleFields;

function toggleFields() {
    let algo = document.getElementById("algo").value;
    document.getElementById("tqDiv").style.display = (algo === "rr") ? "block" : "none";
    document.getElementById("priorityDiv").style.display =
        (algo === "pnp" || algo === "pp") ? "block" : "none";
}

function getData() {
    return {
        at: document.getElementById("at").value.trim().split(/\s+/).map(Number),
        bt: document.getElementById("bt").value.trim().split(/\s+/).map(Number),
        pr: document.getElementById("pr").value.trim().split(/\s+/).map(Number)
    };
}

function solve() {
    let algo = document.getElementById("algo").value;
    let tq = parseInt(document.getElementById("tq").value) || 1;
    let data = getData();

    if (algo === "fcfs") fcfs(data);
    else if (algo === "sjf") sjf(data);
    else if (algo === "srtf") srtf(data);
    else if (algo === "rr") rr(data, tq);
    else if (algo === "pnp") priorityNP(data);
    else if (algo === "pp") priorityP(data);
}

function display(res, gantt, name) {
    let table = document.getElementById("table");
    let blocks = document.getElementById("ganttBlocks");
    let times = document.getElementById("ganttTime");

    table.innerHTML = "";
    blocks.innerHTML = "";
    times.innerHTML = "";

    document.getElementById("badge").innerText = name;

    let tatSum = 0, wtSum = 0;

    res.forEach(p => {
        tatSum += p.tat;
        wtSum += p.wt;

        table.innerHTML += `
        <tr>
            <td>P${p.id}</td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td>${p.ct}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
        </tr>`;
    });

    table.innerHTML += `
    <tr>
        <td colspan="4"><b>Avg</b></td>
        <td>${(tatSum/res.length).toFixed(2)}</td>
        <td>${(wtSum/res.length).toFixed(2)}</td>
    </tr>`;

    let time = 0;
    times.innerHTML = `<div class="time">0</div>`;

    gantt.forEach((p, i) => {
        setTimeout(() => {
            let block = document.createElement("div");
            block.className = "gantt-block";
            block.innerText = p;
            blocks.appendChild(block);

            time++;
            let t = document.createElement("div");
            t.className = "time";
            t.innerText = time;
            times.appendChild(t);
        }, i * 300);
    });
}

/* ALGORITHMS (same logic, but push per unit time) */

function fcfs({at, bt}) {
    let time = 0, res = [], gantt = [];
    for (let i = 0; i < at.length; i++) {
        time = Math.max(time, at[i]);
        let ct = time + bt[i];

        res.push({id:i, at:at[i], bt:bt[i], ct,
            tat:ct-at[i], wt:ct-at[i]-bt[i]});

        for(let j=0;j<bt[i];j++) gantt.push("P"+i);
        time = ct;
    }
    display(res, gantt, "FCFS");
}

function sjf({at, bt}) {
    let n=at.length, done=[], time=0, res=[], gantt=[];
    while(done.length<n){
        let idx=-1, min=Infinity;
        for(let i=0;i<n;i++){
            if(!done.includes(i)&&at[i]<=time&&bt[i]<min){
                min=bt[i]; idx=i;
            }
        }
        if(idx==-1){ time++; continue; }

        let ct=time+bt[idx];
        res.push({id:idx,at:at[idx],bt:bt[idx],ct,
            tat:ct-at[idx],wt:ct-at[idx]-bt[idx]});

        for(let j=0;j<bt[idx];j++) gantt.push("P"+idx);
        done.push(idx);
        time=ct;
    }
    display(res,gantt,"SJF");
}

function srtf({at, bt}) {
    let n=at.length, rt=[...bt], ct=Array(n).fill(0);
    let time=0, completed=0, gantt=[];
    while(completed<n){
        let idx=-1, min=Infinity;
        for(let i=0;i<n;i++){
            if(at[i]<=time && rt[i]>0 && rt[i]<min){
                min=rt[i]; idx=i;
            }
        }
        if(idx==-1){ time++; continue; }

        rt[idx]--; gantt.push("P"+idx); time++;

        if(rt[idx]==0){ ct[idx]=time; completed++; }
    }
    let res=[];
    for(let i=0;i<n;i++){
        res.push({id:i,at:at[i],bt:bt[i],ct:ct[i],
            tat:ct[i]-at[i],wt:ct[i]-at[i]-bt[i]});
    }
    display(res,gantt,"SRTF");
}

function rr({at, bt}, tq) {
    let n=at.length, rt=[...bt], ct=Array(n).fill(0);
    let time=0, queue=[], visited=Array(n).fill(false), gantt=[];

    while(true){
        for(let i=0;i<n;i++){
            if(at[i]<=time&&!visited[i]){
                queue.push(i); visited[i]=true;
            }
        }
        if(queue.length==0){
            if(visited.every(v=>v)) break;
            time++; continue;
        }

        let i=queue.shift();

        if(rt[i]>tq){
            for(let j=0;j<tq;j++) gantt.push("P"+i);
            time+=tq; rt[i]-=tq;
        } else {
            for(let j=0;j<rt[i];j++) gantt.push("P"+i);
            time+=rt[i]; rt[i]=0; ct[i]=time;
        }

        for(let j=0;j<n;j++){
            if(at[j]<=time&&!visited[j]){
                queue.push(j); visited[j]=true;
            }
        }

        if(rt[i]>0) queue.push(i);
    }

    let res=[];
    for(let i=0;i<n;i++){
        res.push({id:i,at:at[i],bt:bt[i],ct:ct[i],
            tat:ct[i]-at[i],wt:ct[i]-at[i]-bt[i]});
    }
    display(res,gantt,"Round Robin");
}

function priorityNP({at, bt, pr}) {
    let n=at.length, done=[], time=0, res=[], gantt=[];
    while(done.length<n){
        let idx=-1, best=Infinity;
        for(let i=0;i<n;i++){
            if(!done.includes(i)&&at[i]<=time&&pr[i]<best){
                best=pr[i]; idx=i;
            }
        }
        if(idx==-1){ time++; continue; }

        let ct=time+bt[idx];
        res.push({id:idx,at:at[idx],bt:bt[idx],ct,
            tat:ct-at[idx],wt:ct-at[idx]-bt[idx]});

        for(let j=0;j<bt[idx];j++) gantt.push("P"+idx);

        done.push(idx);
        time=ct;
    }
    display(res,gantt,"Priority NP");
}

function priorityP({at, bt, pr}) {
    let n=at.length, rt=[...bt], ct=Array(n).fill(0);
    let time=0, completed=0, gantt=[];
    while(completed<n){
        let idx=-1, best=Infinity;
        for(let i=0;i<n;i++){
            if(at[i]<=time&&rt[i]>0&&pr[i]<best){
                best=pr[i]; idx=i;
            }
        }
        if(idx==-1){ time++; continue; }

        rt[idx]--; gantt.push("P"+idx); time++;

        if(rt[idx]==0){ ct[idx]=time; completed++; }
    }

    let res=[];
    for(let i=0;i<n;i++){
        res.push({id:i,at:at[i],bt:bt[i],ct:ct[i],
            tat:ct[i]-at[i],wt:ct[i]-at[i]-bt[i]});
    }
    display(res,gantt,"Priority P");
}
