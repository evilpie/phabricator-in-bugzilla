document.querySelector("form").onsubmit = async (event) => {
    event.preventDefault();
    browser.storage.local.set({apiToken: document.querySelector("#apiToken").value});
    document.querySelector("button").textContent = "Saved";
};

browser.storage.local.get("apiToken", ({apiToken}) => {
    if (apiToken) {
        document.querySelector("#apiToken").value = apiToken;
    }
})
