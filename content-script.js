// Copied from:
// https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
         return Math.round(elapsed/1000) + ' seconds ago';
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';
    }
}

function format(title, data) {
    var div = document.createElement("div");
    var h3 = document.createElement("h2");
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

        var updated = document.createElement("td");
        updated.classList.add("yui3-datatable-header");
        updated.textContent = "Updated";

        var status = document.createElement("td");
        status.classList.add("yui3-datatable-header");
        status.textContent = "Status";

        var title = document.createElement("td");
        title.classList.add("yui3-datatable-header");
        title.textContent = "Title";

        tr.append(revision);
        tr.append(updated);
        tr.append(status);
        tr.append(title);

        thead.append(tr);
    }

    table.append(thead);

    var tbody = document.createElement("tbody");
    tbody.classList.add("yui3-datatable-data");
    table.append(tbody);

    data.sort((a, b) => {
        return b.fields.dateModified - a.fields.dateModified;
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

        var updated = document.createElement("td");
        updated.classList.add("yui3-datatable-cell");
        updated.textContent = timeDifference(Date.now(), rev.fields.dateModified * 1000);
        updated.title = new Date(rev.fields.dateModified * 1000);

        var status = document.createElement("td");
        status.classList.add("yui3-datatable-cell");
        status.textContent = rev.fields.status.name;

        var title = document.createElement("td");
        title.classList.add("yui3-datatable-cell");

        // Linkify "Bug XXX - "
        var match = /^[Bb]ug (\d+) (.*)/.exec(rev.fields.title)
        if (match) {
            var bug = document.createElement("a");
            bug.href = "https://bugzilla.mozilla.org/show_bug.cgi?id=" + match[1];
            bug.textContent = "Bug " + match[1];
            bug.target = "_blank";

            var desc = document.createElement("span");
            desc.textContent = " " + match[2];

            title.append(bug);
            title.append(desc);
        } else {
            title.textContent = rev.fields.title;
        }

        tr.append(revision);
        tr.append(updated);
        tr.append(status);
        tr.append(title);
        tbody.append(tr);
    }

   document.querySelector("#left").append(div);
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
