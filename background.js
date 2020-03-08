const API = "https://phabricator.services.mozilla.com/api/";

async function request(endpoint, apiKey, params) {
    let body = new URLSearchParams();
    body.append("api.token", apiKey);

    for (let [name, value] of params) {
        body.append(name, value);
    }

    var res = await fetch(API + endpoint, {method: "POST", body, credentials: "omit"})
    return await res.json();
}

async function revisionSearch() {
    let {apiKey} = await browser.storage.local.get("apiKey");

    if (!apiKey) {
        return {error_info: "Missing API key go to add-on options."};
    }

    const whoami = await request("user.whoami", apiKey, []);
    if (whoami.error_info) {
        return whoami;
    }

    const phid = whoami.result.phid;

    return await request("differential.revision.search", apiKey, [
        ["constraints[authorPHIDs][0]", phid]
    ]);
}

async function init() {
    browser.runtime.onMessage.addListener((data, sender) => {
        if (data.msg == 'revision.search') {
            return revisionSearch();
        }
    })
}

init();
