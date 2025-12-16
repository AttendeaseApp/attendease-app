// Learn more https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add ESM/CJS support
config.resolver.sourceExts.push("mjs", "cjs");

// Alias tslib to its ESM entry for Framer Motion/Moti web resolution
const ALIASES = {
    tslib: require.resolve("tslib/tslib.es6.js"),
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
    const aliased = ALIASES[moduleName];
    if (aliased) {
        return context.resolveRequest(context, aliased, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
