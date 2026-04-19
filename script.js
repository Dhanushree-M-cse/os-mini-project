window.onload = toggleFields;

/* ---------- UI CONTROL ---------- */
function toggleFields() {
    const algo = document.getElementById("algo").value;

    document.getElementById("tqDiv").style.display =
        (algo === "rr") ? "block" : "none";

    document.getElementById("priorityDiv").style.display =
        (algo === "pnp" || algo === "pp") ? "block" : "none";
}

/* ---------- INPUT ---------- */
function getData() {
    return {
        at: document.getElementById("at").value.trim().split(/\s+/).map(Number),
        bt: document.getElementById("bt").value.trim().split(/\s+/).map(Number),
        pr: document.getElementById("pr").value.trim().split(/\s+/).map(Number)
    };
}

/* ---------- MAIN ---------- */
function solve() {
    try {
        const algo = document.getElementById("algo").value;
        const tq = parseInt(document.getElementById("tq").value) || 1;
        const data = getData();

        // CLEAR OLD OUTPUT
        document.getElementById("table").innerHTML = "";
        document.getElementById("gantt").innerHTML = "";

        if (algo === "fcfs") fcfs(data);
        else if (algo === "sjf") sjf(data);
        else if (algo === "srtf") srtf(data);
        else if (algo === "rr") rr(data, tq);
        else if (algo === "pnp") priorityNP(data);
        else if (algo === "pp") priorityP(data);

    } catch (err) {
        console.error(err);
        alert("Error! Check your input values.");
    }
}

/* ---------- DISPLAY ---------- */
function display(res, gantt) {
    const table = document.getElementById("table");
    const ganttDiv = document.getElementById("gantt");

    table.innerHTML = "";
    ganttDiv.innerHTML = "";

    let tatSum = 0, wtSum = 0;

    // TABLE
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

    // AVERAGE
    table.innerHTML += `
    <tr style="font-weight:bold;background:#fef3c7;">
        <td colspan="4">Average</td>
        <td>${(tatSum / res.length).toFixed(2)}</td>
        <td>${(wtSum / res.length).toFixed(2)}</td>
    </tr>`;

    // GANTT CHART
    gantt.forEach(g => {
        const block = document.createElement("div");
        block.className = "block";
        block.style.width = (g.time * 40) + "px";

        block.innerHTML = `
            ${g.p}
            <div class="time-label">${g.end}</div>
        `;

        ganttDiv.appendChild(block);
    });
}

/* ---------- FCFS ---------- */
function fcfs({at, bt}) {
    let time = 0, res = [], gantt = [];

    for (let i = 0; i < at.length; i++) {
        time = Math.max(time, at[i]);
        let end = time + bt[i];

        res.push({
            id: i,
            at: at[i],
            bt: bt[i],
            ct: end,
            tat: end - at[i],
            wt: end - at[i] - bt[i]
        });

        gantt.push({p: "P" + i, time: bt[i], end: end});
        time = end;
    }

    display(res, gantt);
}

/* ---------- SJF (NON-PREEMPTIVE) ---------- */
function sjf({at, bt}) {
    let n = at.length, done = [], time = 0, res = [], gantt = [];

    while (done.length < n) {
        let idx = -1, min = Infinity;

        for (let i = 0; i < n; i++) {
            if (!done.includes(i) && at[i] <= time && bt[i] < min) {
                min = bt[i];
                idx = i;
            }
        }

        if (idx === -1) {
            time++;
            continue;
        }

        let end = time + bt[idx];

        res.push({
            id: idx,
            at: at[idx],
            bt: bt[idx],
            ct: end,
            tat: end - at[idx],
            wt: end - at[idx] - bt[idx]
        });

        gantt.push({p: "P" + idx, time: bt[idx], end: end});

        done.push(idx);
        time = end;
    }

    display(res, gantt);
}

/* ---------- SRTF ---------- */
function srtf({at, bt}) {
    let n = at.length, rt = [...bt], time = 0, completed = 0;
    let ct = Array(n).fill(0), gantt = [];

    while (completed < n) {
        let idx = -1, min = Infinity;

        for (let i = 0; i < n; i++) {
            if (at[i] <= time && rt[i] > 0 && rt[i] < min) {
                min = rt[i];
                idx = i;
            }
        }

        if (idx === -1) {
            time++;
            continue;
        }

        if (gantt.length && gantt[gantt.length - 1].p === "P" + idx) {
            gantt[gantt.length - 1].time++;
            gantt[gantt.length - 1].end = time + 1;
        } else {
            gantt.push({p: "P" + idx, time: 1, end: time + 1});
        }

        rt[idx]--;
        time++;

        if (rt[idx] === 0) {
            ct[idx] = time;
            completed++;
        }
    }

    let res = [];
    for (let i = 0; i < n; i++) {
        res.push({
            id: i,
            at: at[i],
            bt: bt[i],
            ct: ct[i],
            tat: ct[i] - at[i],
            wt: ct[i] - at[i] - bt[i]
        });
    }

    display(res, gantt);
}

/* ---------- ROUND ROBIN ---------- */
function rr({at, bt}, tq) {
    let n = at.length, rt = [...bt], ct = Array(n).fill(0);
    let time = 0, queue = [], visited = Array(n).fill(false), gantt = [];

    while (true) {
        for (let i = 0; i < n; i++) {
            if (at[i] <= time && !visited[i]) {
                queue.push(i);
                visited[i] = true;
            }
        }

        if (queue.length === 0) {
            if (visited.every(v => v)) break;
            time++;
            continue;
        }

        let i = queue.shift();
        let exec = Math.min(tq, rt[i]);

        gantt.push({p: "P" + i, time: exec, end: time + exec});

        time += exec;
        rt[i] -= exec;

        for (let j = 0; j < n; j++) {
            if (at[j] <= time && !visited[j]) {
                queue.push(j);
                visited[j] = true;
            }
        }

        if (rt[i] > 0) queue.push(i);
        else ct[i] = time;
    }

    let res = [];
    for (let i = 0; i < n; i++) {
        res.push({
            id: i,
            at: at[i],
            bt: bt[i],
            ct: ct[i],
            tat: ct[i] - at[i],
            wt: ct[i] - at[i] - bt[i]
        });
    }

    display(res, gantt);
}

/* ---------- PRIORITY NON-PREEMPTIVE ---------- */
function priorityNP({at, bt, pr}) {
    let n = at.length, done = [], time = 0, res = [], gantt = [];

    while (done.length < n) {
        let idx = -1, best = Infinity;

        for (let i = 0; i < n; i++) {
            if (!done.includes(i) && at[i] <= time && pr[i] < best) {
                best = pr[i];
                idx = i;
            }
        }

        if (idx === -1) {
            time++;
            continue;
        }

        let end = time + bt[idx];

        res.push({
            id: idx,
            at: at[idx],
            bt: bt[idx],
            ct: end,
            tat: end - at[idx],
            wt: end - at[idx] - bt[idx]
        });

        gantt.push({p: "P" + idx, time: bt[idx], end: end});

        done.push(idx);
        time = end;
    }

    display(res, gantt);
}

/* ---------- PRIORITY PREEMPTIVE ---------- */
function priorityP({at, bt, pr}) {
    let n = at.length, rt = [...bt], time = 0, completed = 0;
    let ct = Array(n).fill(0), gantt = [];

    while (completed < n) {
        let idx = -1, best = Infinity;

        for (let i = 0; i < n; i++) {
            if (at[i] <= time && rt[i] > 0 && pr[i] < best) {
                best = pr[i];
                idx = i;
            }
        }

        if (idx === -1) {
            time++;
            continue;
        }

        if (gantt.length && gantt[gantt.length - 1].p === "P" + idx) {
            gantt[gantt.length - 1].time++;
            gantt[gantt.length - 1].end = time + 1;
        } else {
            gantt.push({p: "P" + idx, time: 1, end: time + 1});
        }

        rt[idx]--;
        time++;

        if (rt[idx] === 0) {
            ct[idx] = time;
            completed++;
        }
    }

    let res = [];
    for (let i = 0; i < n; i++) {
        res.push({
            id: i,
            at: at[i],
            bt: bt[i],
            ct: ct[i],
            tat: ct[i] - at[i],
            wt: ct[i] - at[i] - bt[i]
        });
    }

    display(res, gantt);
}
