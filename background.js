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

async function revisionSearch(constraints) {
    let {apiToken} = await browser.storage.local.get("apiToken");

    if (!apiToken) {
        return {error_info: "Missing API key go to add-on options."};
    }

    const whoami = await request("user.whoami", apiToken, []);
    if (whoami.error_info) {
        return whoami;
    }

    const phid = whoami.result.phid;

    return await request("differential.revision.search", apiToken, [
        [constraints, phid],
        ["queryKey", "active"]
    ]);
}

async function init() {
    browser.runtime.onMessage.addListener((data, sender) => {
        if (data.msg == 'revision.search') {
            return revisionSearch(data.constraints);
        }
    })
}

init();
