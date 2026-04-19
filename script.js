window.onload = toggleFields;

function toggleFields() {
    let algo = document.getElementById("algo").value;
    document.getElementById("tqDiv").style.display = (algo === "rr") ? "block" : "none";
    document.getElementById("priorityDiv").style.display =
        (algo === "pnp" || algo === "pp") ? "block" : "none";
}

function getData() {
    return {
        at: document.getElementById("at").value.split(" ").map(Number),
        bt: document.getElementById("bt").value.split(" ").map(Number),
        pr: document.getElementById("pr").value.split(" ").map(Number)
    };
}

function solve() {
    let algo = document.getElementById("algo").value;
    let tq = parseInt(document.getElementById("tq").value) || 1;
    let data = getData();

    if (algo === "fcfs") fcfs(data);
}

/* DISPLAY (CORRECT GANTT) */
function display(res, gantt) {
    let table = document.getElementById("table");
    let blocks = document.getElementById("ganttBlocks");
    let times = document.getElementById("ganttTime");

    table.innerHTML = "";
    blocks.innerHTML = "";
    times.innerHTML = "";

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

    /* COMPRESS GANTT */
    let compressed = [];
    let prev = gantt[0], count = 1;

    for (let i = 1; i < gantt.length; i++) {
        if (gantt[i] === prev) count++;
        else {
            compressed.push({p: prev, time: count});
            prev = gantt[i];
            count = 1;
        }
    }
    compressed.push({p: prev, time: count});

    /* DRAW */
    let currentTime = 0;
    times.innerHTML += `<div class="time">0</div>`;

    compressed.forEach(item => {
        let block = document.createElement("div");
        block.className = "gantt-block";
        block.innerText = item.p;
        block.style.width = (item.time * 40) + "px";

        blocks.appendChild(block);

        currentTime += item.time;
        times.innerHTML += `<div class="time">${currentTime}</div>`;
    });
}

/* FCFS */
function fcfs({at, bt}) {
    let time = 0, res = [], gantt = [];

    for (let i = 0; i < at.length; i++) {
        time = Math.max(time, at[i]);

        let ct = time + bt[i];

        res.push({
            id: i,
            at: at[i],
            bt: bt[i],
            ct: ct,
            tat: ct - at[i],
            wt: ct - at[i] - bt[i]
        });

        for (let j = 0; j < bt[i]; j++) {
            gantt.push("P" + i);
        }

        time = ct;
    }

    display(res, gantt);
}
