window.onload = toggleFields;

function toggleFields() {
    let a = document.getElementById("algo").value;
    tqDiv.style.display = a==="rr"?"block":"none";
    priorityDiv.style.display = (a==="pnp"||a==="pp")?"block":"none";
}

function getData() {
    return {
        at: at.value.split(" ").map(Number),
        bt: bt.value.split(" ").map(Number),
        pr: pr.value.split(" ").map(Number)
    };
}

function solve(){
    let algo = algoSelect();
    let tq = parseInt(document.getElementById("tq").value)||1;
    let d = getData();

    if(algo==="fcfs") fcfs(d);
    else if(algo==="sjf") sjf(d);
    else if(algo==="srtf") srtf(d);
    else if(algo==="rr") rr(d,tq);
    else if(algo==="pnp") pnp(d);
    else if(algo==="pp") pp(d);
}

function algoSelect(){
    return document.getElementById("algo").value;
}

/* DISPLAY */
function display(res, gantt){
    table.innerHTML="";
    ganttDiv = document.getElementById("gantt");
    ganttDiv.innerHTML="";

    let t=0;
    gantt.forEach(g=>{
        let div=document.createElement("div");
        div.className="block";
        div.style.width=(g.time*40)+"px";
        div.innerHTML = g.p + `<div class="time-label">${g.end}</div>`;
        ganttDiv.appendChild(div);
    });

    res.forEach(p=>{
        table.innerHTML+=`
        <tr>
        <td>P${p.id}</td>
        <td>${p.at}</td>
        <td>${p.bt}</td>
        <td>${p.ct}</td>
        <td>${p.tat}</td>
        <td>${p.wt}</td>
        </tr>`;
    });
}

/* FCFS */
function fcfs({at,bt}){
    let time=0,res=[],gantt=[];
    for(let i=0;i<at.length;i++){
        time=Math.max(time,at[i]);
        let start=time;
        let end=time+bt[i];

        res.push({id:i,at:at[i],bt:bt[i],
        ct:end,tat:end-at[i],wt:end-at[i]-bt[i]});

        gantt.push({p:"P"+i,time:bt[i],end:end});
        time=end;
    }
    display(res,gantt);
}

/* SJF */
function sjf({at,bt}){
    let n=at.length,done=[],time=0,res=[],gantt=[];
    while(done.length<n){
        let idx=-1,min=1e9;
        for(let i=0;i<n;i++){
            if(!done.includes(i)&&at[i]<=time&&bt[i]<min){
                min=bt[i]; idx=i;
            }
        }
        if(idx==-1){time++;continue;}

        let end=time+bt[idx];
        res.push({id:idx,at:at[idx],bt:bt[idx],
        ct:end,tat:end-at[idx],wt:end-at[idx]-bt[idx]});

        gantt.push({p:"P"+idx,time:bt[idx],end:end});
        done.push(idx);
        time=end;
    }
    display(res,gantt);
}

/* SRTF */
function srtf({at,bt}){
    let n=at.length,rt=[...bt],time=0,done=0;
    let ct=Array(n).fill(0),gantt=[];

    while(done<n){
        let idx=-1,min=1e9;
        for(let i=0;i<n;i++){
            if(at[i]<=time&&rt[i]>0&&rt[i]<min){
                min=rt[i]; idx=i;
            }
        }
        if(idx==-1){time++;continue;}

        if(gantt.length && gantt[gantt.length-1].p==="P"+idx){
            gantt[gantt.length-1].time++;
            gantt[gantt.length-1].end=time+1;
        } else {
            gantt.push({p:"P"+idx,time:1,end:time+1});
        }

        rt[idx]--; time++;

        if(rt[idx]==0){ct[idx]=time;done++;}
    }

    let res=[];
    for(let i=0;i<n;i++){
        res.push({id:i,at:at[i],bt:bt[i],
        ct:ct[i],tat:ct[i]-at[i],wt:ct[i]-at[i]-bt[i]});
    }

    display(res,gantt);
}

/* RR */
function rr({at,bt},tq){
    let n=at.length,rt=[...bt],time=0,queue=[],ct=Array(n).fill(0);
    let visited=Array(n).fill(false),gantt=[];

    while(true){
        for(let i=0;i<n;i++){
            if(at[i]<=time&&!visited[i]){
                queue.push(i); visited[i]=true;
            }
        }
        if(queue.length===0){
            if(visited.every(v=>v)) break;
            time++; continue;
        }

        let i=queue.shift();
        let exec=Math.min(tq,rt[i]);

        gantt.push({p:"P"+i,time:exec,end:time+exec});

        time+=exec;
        rt[i]-=exec;

        for(let j=0;j<n;j++){
            if(at[j]<=time&&!visited[j]){
                queue.push(j); visited[j]=true;
            }
        }

        if(rt[i]>0) queue.push(i);
        else ct[i]=time;
    }

    let res=[];
    for(let i=0;i<n;i++){
        res.push({id:i,at:at[i],bt:bt[i],
        ct:ct[i],tat:ct[i]-at[i],wt:ct[i]-at[i]-bt[i]});
    }

    display(res,gantt);
}

/* Priority NP */
function pnp({at,bt,pr}){
    let n=at.length,done=[],time=0,res=[],gantt=[];
    while(done.length<n){
        let idx=-1,best=1e9;
        for(let i=0;i<n;i++){
            if(!done.includes(i)&&at[i]<=time&&pr[i]<best){
                best=pr[i]; idx=i;
            }
        }
        if(idx==-1){time++;continue;}

        let end=time+bt[idx];

        res.push({id:idx,at:at[idx],bt:bt[idx],
        ct:end,tat:end-at[idx],wt:end-at[idx]-bt[idx]});

        gantt.push({p:"P"+idx,time:bt[idx],end:end});
        done.push(idx);
        time=end;
    }
    display(res,gantt);
}

/* Priority P */
function pp({at,bt,pr}){
    let n=at.length,rt=[...bt],time=0,done=0;
    let ct=Array(n).fill(0),gantt=[];

    while(done<n){
        let idx=-1,best=1e9;
        for(let i=0;i<n;i++){
            if(at[i]<=time&&rt[i]>0&&pr[i]<best){
                best=pr[i]; idx=i;
            }
        }
        if(idx==-1){time++;continue;}

        if(gantt.length && gantt[gantt.length-1].p==="P"+idx){
            gantt[gantt.length-1].time++;
            gantt[gantt.length-1].end=time+1;
        } else {
            gantt.push({p:"P"+idx,time:1,end:time+1});
        }

        rt[idx]--; time++;

        if(rt[idx]==0){ct[idx]=time;done++;}
    }

    let res=[];
    for(let i=0;i<n;i++){
        res.push({id:i,at:at[i],bt:bt[i],
        ct:ct[i],tat:ct[i]-at[i],wt:ct[i]-at[i]-bt[i]});
    }

    display(res,gantt);
}
