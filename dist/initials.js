"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvatar = void 0;
const core_1 = require("@dicebear/core");
const collection_1 = require("@dicebear/collection");
const getAvatar = (name) => {
    const avatar = (0, core_1.createAvatar)(collection_1.initials, {
        seed: name
    });
    return avatar.toString();
};
exports.getAvatar = getAvatar;
//# sourceMappingURL=initials.js.map