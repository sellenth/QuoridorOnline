export var Orientation;
(function (Orientation) {
    Orientation[Orientation["Horizontal"] = 1] = "Horizontal";
    Orientation[Orientation["Vertical"] = 2] = "Vertical";
    Orientation[Orientation["Flat"] = 3] = "Flat";
})(Orientation || (Orientation = {}));
export var MessageType;
(function (MessageType) {
    MessageType[MessageType["GameState"] = 0] = "GameState";
    MessageType[MessageType["Identity"] = 1] = "Identity";
    MessageType[MessageType["GameOver"] = 2] = "GameOver";
    MessageType[MessageType["Cameras"] = 3] = "Cameras";
    MessageType[MessageType["ClientCameraPos"] = 4] = "ClientCameraPos";
    MessageType[MessageType["ClientAction"] = 5] = "ClientAction";
})(MessageType || (MessageType = {}));
;
//# sourceMappingURL=types.js.map