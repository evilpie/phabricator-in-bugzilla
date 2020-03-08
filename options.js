document.querySelector("form").onsubmit = (event) => {
    event.preventDefault();
    browser.storage.local.set({apiKey: document.querySelector("#apiKey").value});
};

browser.storage.local.get("apiKey", ({apiKey}) => {
    if (apiKey) {
        document.querySelector("#apiKey").value = apiKey;
    }
})
