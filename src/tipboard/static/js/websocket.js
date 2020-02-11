/**
 * Return the Js func for a specific tile_template
 * @param tileType tile_template name
 * @returns {Function} js func to update html tile
 */
function getUpdateFunction(tileType) {
    switch (tileType) {
        case "vbar_chart":
            tileType = "bar_chart";
            break;
        case "doughnut_chart":
            tileType = "radar_chart";
            break;
        case "half_doughnut_chart":
            tileType = "radar_chart";
            break;
        case "cumulative_flow":
            tileType = "line_chart";
            break;
    }
    return Tipboard.updateFunctions[tileType.toString()];
}

/**
 * Destroy previous tile and create a new to refresh value
 * @param tileData
 * @param dashboardname
 */
function updateTile(tileData, dashboardname) {
    let chartId = `${dashboardname}-${tileData['id']}`;
    let tile = $("#" + chartId)[0];
    try {
        getUpdateFunction(tileData['tile_template'])(tileData, dashboardname);
        $.each([".tile-content"], function (idx, klass) {
            let node = $(tile).find(klass);
            if (node.length > 1) {
                $(node[1]).remove();
                $(node[0]).show();
            }
        });
    } catch (err) {
        onTileError(err, tile, chartId);
    }
}

/**
 * Test in Loop if Api is alive, when alive start a new Websocket connection
 */
let testApiIsBack = function () {
    let Http = new XMLHttpRequest();
    Http.open("GET", window.location.protocol + "/api/info");
    Http.onload = () => {
        if (Http.status === 200) { // TODO: avant ici
            Tipboard.log("testApiIsBack Http.status 200");
            initWebSocketManager();
        }
    };
    Http.onerror = () => {
        Tipboard.log("testApiIsBack error");
        setTimeout(testApiIsBack, 5000);
    };
    Http.send();
};

/**
 * Config the WebSocket Object & start a connection
 */
function initWebSocketManager() {
    let protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    let websocket = new WebSocket(protocol + window.location.host + "/communication/websocket");
    websocket.onopen = function () {
        Tipboard.log("[LOG] ");
        //websocket.send("first_connection:" + window.location.pathname);
    };
    websocket.onclose = function () { // Handler to detect when API is back alive to reset websocket connection every 5s
        if (Tipboard === "undefined") {
            Tipboard.log("[WARNING] Websocket Tipboard is not build");
        } else {
            Tipboard.log("Closing WS");
            setTimeout(testApiIsBack, 5000);
        }
    };
    websocket.sendmessage = function(nextDashboardPath) {
        Tipboard.websocket.send("first_connection:" + nextDashboardPath);
        websocket.lastDashboard = nextDashboardPath.substring(1);
    };
    websocket.onmessage = function (evt) {
        let tileData = JSON.parse(evt.data);
        console.log("Web socket received data: ", tileData);
        updateTile(tileData, websocket.lastDashboard);
    };
    websocket.onerror = function (evt) {
        Tipboard.log("WebSocket error: ", evt.data);
    };
    Tipboard.websocket = websocket;
    Tipboard.log("WebSocket object is init ");
}
