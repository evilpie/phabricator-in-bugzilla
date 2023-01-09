// Copied from:
// https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time-eg-2-seconds-ago-one-week-ago-etc-best
// Modified to use const instead of var, jfx2006.
function timeDifference(current, previous) {

    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    const msPerMonth = msPerDay * 30;
    const msPerYear = msPerDay * 365;

    const elapsed = current - previous;

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

function createElement(tag, props={}, text="") {
    const isSubset = (haystack, needles) =>
        needles.every((needle) => haystack.includes(needle));

    if (!["a", "div", "h2", "table", "tbody", "thead", "td", "th", "tr"].includes(tag)) {
        throw new Error(`Element type ${tag} unknown!`);
    }

    if (!isSubset(["class", "href", "target", "title"], Object.keys(props))) {
        throw new Error(`Unknown property found in ${props}!`);
    }

    const el = document.createElement(tag);
    for (const [property, value] of Object.entries(props)) {
        el.setAttribute(property, value);
    }

    if (text) {
        el.innerText = text;
    }
    return el;
}

function mk_table(table_title) {
    const div = createElement("div", {"class": "requests"});
    const h2 = createElement("h2", {"class": "query_heading"}, table_title);
    div.append(h2);

    const content = createElement("div", {"class": "yui3-datatable-content"});
    div.append(content);

    const table = createElement("table", {"class": "yui3-datatable-table"});
    content.append(table);

    const thead = createElement("thead", {"class": "yui3-datatable-columns"});

    {
        const tr = createElement("tr");

        const revision = createElement("th", {"class": "yui3-datatable-header"}, "Revision");
        const updated = createElement("th", {"class": "yui3-datatable-header"}, "Updated");
        const status = createElement("th", {"class": "yui3-datatable-header"}, "Status");
        const title = createElement("th", {"class": "yui3-datatable-header"}, "Title");

        tr.append(revision);
        tr.append(updated);
        tr.append(status);
        tr.append(title);

        thead.append(tr);
    }

    table.append(thead);

    const tbody = createElement("tbody", {"class": "yui3-datatable-data"});
    table.append(tbody);

    return div;
}

function fill_data(div, data) {
    const tbody = div.querySelector("tbody");

    data.sort((a, b) => {
        return b.fields.dateModified - a.fields.dateModified;
    })

    for (let rev of data) {
        const tr = createElement("tr", {"class": "yui3-datatable-data"});

        const revision = createElement("td", {class: "yui3-datatable-cell"});
        const a = createElement(
            "a",
            {href: `https://phabricator.services.mozilla.com/D${rev.id}`, target: "_blank"},
            `D${rev.id}`
        );
        revision.append(a);

        const updated = createElement(
            "td",
            {
                class: "yui3-datatable-cell",
                title: new Date(rev.fields.dateModified * 1000).toString(),
            },
            timeDifference(Date.now(), rev.fields.dateModified * 1000)
        );

        const status = createElement("td", {class: "yui3-datatable-cell"}, rev.fields.status.name);
        const title = createElement("td", {class: "yui3-datatable-cell"});

        // Linkify "Bug XXX - "
        const match = /^(?<before>.*)?(?<title>[Bb]ug (?<id>\d+))(?<after>.*)?/.exec(rev.fields.title)
        if (match) {
            if (match.groups.before) {
                title.append(match.groups.before);
            }

            const bug = document.createElement("a");
            bug.href = `https://bugzilla.mozilla.org/show_bug.cgi?id=${match.groups.id}`;
            bug.textContent = match.groups.title;
            bug.target = "_blank";
            title.append(bug);

            if (match.groups.after) {
                title.append(match.groups.after);
            }
        } else {
            title.textContent = rev.fields.title;
        }

        tr.append(revision);
        tr.append(updated);
        tr.append(status);
        tr.append(title);
        tbody.append(tr);
    }
}

function error(msg) {
    alert(`Phabricator in Bugzilla: ${msg}`)
}

async function run() {
    const profile = document.querySelector("#header-account a[href^='/user_profile?user_id=']");
    if (!profile) {
        error(`Could not find "My Profile" link on page`)
        return;
    }

    let remove_heading = document.querySelector("#right > h2.query_heading.requests");
    if (remove_heading) {
        remove_heading.remove();
    }

    const user_id = new URL(profile.href).searchParams.get("user_id");

    const assigned = await browser.runtime.sendMessage({
        msg: "revision.search",
        user_id: user_id,
        constraints: "constraints[authorPHIDs][0]",
    });

    if (assigned.error_info) {
        error(assigned.error_info);
        return;
    }

    const assigned_div = mk_table("Phabricator: Your revisions");
    fill_data(assigned_div, assigned.result.data);
    document.querySelector("#left").append(assigned_div);

    const reviewing = await browser.runtime.sendMessage({
        msg: "revision.search",
        user_id: user_id,
        constraints: "constraints[reviewerPHIDs][0]",
    });

    if (reviewing.error_info) {
        alert("Phabricator in Bugzilla: " + reviewing.error_info);
        return;
    }

    const reviewing_div = mk_table("Phabricator: Review Requests");
    fill_data(reviewing_div, reviewing.result.data);
    document.querySelector("#right").append(reviewing_div);
}
run();
