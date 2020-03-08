function format(title, data) {
    var div = document.createElement("div");
    var h3 = document.createElement("h3");
    h3.textContent = title;
    div.append(h3);

    var content = document.createElement("div");
    content.classList.add("yui3-datatable-content");
    div.append(content);

    var table = document.createElement("table");
    table.classList.add("yui3-datatable-table");
    content.append(table);

    var thead = document.createElement("thead");
    thead.classList.add("yui3-datatable-columns");

    {
        var tr = document.createElement("tr");

        var revision = document.createElement("td");
        revision.classList.add("yui3-datatable-header");
        revision.textContent = "Revision";

        var status = document.createElement("td");
        status.classList.add("yui3-datatable-header");
        status.textContent = "Status";

        var title = document.createElement("td");
        title.classList.add("yui3-datatable-header");
        title.textContent = "Title";

        tr.append(revision);
        tr.append(status);
        tr.append(title);

        thead.append(tr);
    }

    table.append(thead);

    var tbody = document.createElement("tbody");
    tbody.classList.add("yui3-datatable-data");
    table.append(tbody);

    data.sort((a, b) => {
        return a.fields.status.name.localeCompare(b.fields.status.name);
    })

    for (let rev of data) {
        var tr = document.createElement("tr");
        tr.classList.add("yui3-datatable-even");

        var revision = document.createElement("td");
        revision.classList.add("yui3-datatable-cell");

        var a = document.createElement("a");
        a.href = "https://phabricator.services.mozilla.com/D" + rev.id;
        a.textContent = `D${rev.id}`;
        a.target = "_blank";
        revision.append(a);

        var status = document.createElement("td");
        status.classList.add("yui3-datatable-cell");
        status.textContent = rev.fields.status.name;

        var title = document.createElement("td");
        title.classList.add("yui3-datatable-cell");
        title.textContent = rev.fields.title;

        tr.append(revision);
        tr.append(status);
        tr.append(title);
        tbody.append(tr);
    }

   document.querySelector("#right").append(div);
}

async function run() {
    let assigned = await browser.runtime.sendMessage({
        msg: "revision.search",
        constraints: "constraints[authorPHIDs][0]",
    });

    if (assigned.error_info) {
        alert("Phabricator in Bugzilla: " + assigned.error_info);
        return;
    }

    format("Phabricator: Your revisions", assigned.result.data);


    let reviewing = await browser.runtime.sendMessage({
        msg: "revision.search",
        constraints: "constraints[reviewerPHIDs][0]",
    });

    if (reviewing.error_info) {
        alert("Phabricator in Bugzilla: " + reviewing.error_info);
        return;
    }

    format("Phabricator: Review Requests", reviewing.result.data);
}
run();
