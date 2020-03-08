document.querySelector("form").onsubmit = (event) => {
    event.preventDefault();
    browser.storage.local.set({apiToken: document.querySelector("#apiToken").value});
};

browser.storage.local.get("apiToken", ({apiToken}) => {
    if (apiToken) {
        document.querySelector("#apiToken").value = apiToken;
    }
})
