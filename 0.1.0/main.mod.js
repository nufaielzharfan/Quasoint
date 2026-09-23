window.PolyTrackMods.register({
    id: "quasoint",

    activate(api) {
        api.log("Quasoint loaded!");

        api.injectStyle(`
            #quasoint-status {
                position: fixed;
                right: 20px;
                bottom: 20px;
                z-index: 999999;
                padding: 10px 14px;
                background: rgba(0, 0, 0, 0.75);
                color: white;
                border-radius: 6px;
                font-family: sans-serif;
                font-size: 14px;
                pointer-events: none;
            }
        `);

        const box = document.createElement("div");
        box.id = "quasoint-status";
        box.textContent = "QUASOINT LOADED";
        document.body.appendChild(box);

        setTimeout(() => {
            box.remove();
        }, 3000);
    },

    deactivate(api) {
        document.getElementById("quasoint-status")?.remove();
        api.log("Quasoint unloaded.");
    }
});
