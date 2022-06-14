const API = "https://phabricator.services.mozilla.com/api/";

async function request(endpoint, apiToken, params) {
    let body = new URLSearchParams();
    body.append("api.token", apiToken);

    for (let [name, value] of params) {
        body.append(name, value);
    }

    var res = await fetch(API + endpoint, {method: "POST", body, credentials: "omit"})
    return await res.json();
}

async function revisionSearch(user_id, constraints) {
    let {apiToken} = await browser.storage.local.get("apiToken");

    if (!apiToken) {
        return {error_info: "Missing API Token go to add-on options."};
    }

    const account = await request("bmoexternalaccount.search", apiToken, [
        ["accountids[0]", user_id]
    ]);
    if (account.error_info) {
        return account;
    }

    const phid = account.result?.[0]?.phid;
    if (!phid) {
        return {error_info: `Could not find phabricator account for BMO user ${user_id}`};
    }

    return await request("differential.revision.search", apiToken, [
        [constraints, phid],
        ["constraints[statuses][0]", "accepted"],
        ["constraints[statuses][1]", "needs-review"],
        ["constraints[statuses][2]", "changes-planned"],
        ["constraints[statuses][3]", "needs-revision"],
        ["constraints[statuses][4]", "draft"],
    ]);
}

async function init() {
    browser.runtime.onMessage.addListener((data, sender) => {
        if (data.msg == 'revision.search') {
            return revisionSearch(data.user_id, data.constraints);
        }
    })
}

init();
