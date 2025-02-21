"use strict";

const webpackCommonConfig = require("./webpack.config");
const { merge } = require("webpack-merge");
var path = require("path");

const config = {
  output: {
    path: __dirname + "/build/themes"
  },
  entry: {
    "default-light": path.resolve(__dirname, "./src/themes/default-light.ts"),
    "default-dark": path.resolve(__dirname, "./src/themes/default-dark.ts"),
    "default-light-panelless": path.resolve(__dirname, "./src/themes/default-light-panelless.ts"),
    "default-dark-panelless": path.resolve(__dirname, "./src/themes/default-dark-panelless.ts"),
    "sharp-light": path.resolve(__dirname, "./src/themes/sharp-light.ts"),
    "sharp-dark": path.resolve(__dirname, "./src/themes/sharp-dark.ts"),
    "sharp-light-panelless": path.resolve(__dirname, "./src/themes/sharp-light-panelless.ts"),
    "sharp-dark-panelless": path.resolve(__dirname, "./src/themes/sharp-dark-panelless.ts"),
    "borderless-light": path.resolve(__dirname, "./src/themes/borderless-light.ts"),
    "borderless-dark": path.resolve(__dirname, "./src/themes/borderless-dark.ts"),
    "borderless-light-panelless": path.resolve(__dirname, "./src/themes/borderless-light-panelless.ts"),
    "borderless-dark-panelless": path.resolve(__dirname, "./src/themes/borderless-dark-panelless.ts"),
    "flat-light": path.resolve(__dirname, "./src/themes/flat-light.ts"),
    "flat-dark": path.resolve(__dirname, "./src/themes/flat-dark.ts"),
    "flat-light-panelless": path.resolve(__dirname, "./src/themes/flat-light-panelless.ts"),
    "flat-dark-panelless": path.resolve(__dirname, "./src/themes/flat-dark-panelless.ts"),
    "plain-light": path.resolve(__dirname, "./src/themes/plain-light.ts"),
    "plain-dark": path.resolve(__dirname, "./src/themes/plain-dark.ts"),
    "plain-light-panelless": path.resolve(__dirname, "./src/themes/plain-light-panelless.ts"),
    "plain-dark-panelless": path.resolve(__dirname, "./src/themes/plain-dark-panelless.ts"),
    "doubleborder-light": path.resolve(__dirname, "./src/themes/doubleborder-light.ts"),
    "doubleborder-dark": path.resolve(__dirname, "./src/themes/doubleborder-dark.ts"),
    "doubleborder-light-panelles": path.resolve(__dirname, "./src/themes/doubleborder-light-panelless.ts"),
    "doubleborder-dark-panelless": path.resolve(__dirname, "./src/themes/doubleborder-dark-panelless.ts"),
    "layered-light": path.resolve(__dirname, "./src/themes/layered-light.ts"),
    "layered-dark": path.resolve(__dirname, "./src/themes/layered-dark.ts"),
    "layered-light-panelless": path.resolve(__dirname, "./src/themes/layered-light-panelless.ts"),
    "layered-dark-panelless": path.resolve(__dirname, "./src/themes/layered-dark-panelless.ts"),
    "solid-light": path.resolve(__dirname, "./src/themes/solid-light.ts"),
    "solid-dark": path.resolve(__dirname, "./src/themes/solid-dark.ts"),
    "solid-light-panelless": path.resolve(__dirname, "./src/themes/solid-light-panelless.ts"),
    "solid-dark-panelless": path.resolve(__dirname, "./src/themes/solid-dark-panelless.ts"),
    "three-dimensional-light": path.resolve(__dirname, "./src/themes/threedimensional-light.ts"),
    "three-dimensional-dark": path.resolve(__dirname, "./src/themes/threedimensional-dark.ts"),
    "three-dimensional-light-panelless": path.resolve(__dirname, "./src/themes/threedimensional-light-panelless.ts"),
    "three-dimensional-dark-panelless": path.resolve(__dirname, "./src/themes/threedimensional-dark-panelless.ts"),
    "contrast-light": path.resolve(__dirname, "./src/themes/contrast-light.ts"),
    "contrast-dark": path.resolve(__dirname, "./src/themes/contrast-dark.ts"),
    "contrast-light-panelless": path.resolve(__dirname, "./src/themes/contrast-light-panelless.ts"),
    "contrast-dark-panelless": path.resolve(__dirname, "./src/themes/contrast-dark-panelless.ts"),
    "index": path.resolve(__dirname, "./src/themes/index.ts"),
  },
};
function patchEntries(config) {
  Object.keys(config.entry).forEach(key => {
    if (key == "index") return;
    const importEntry = config.entry[key];
    const umdName = key.replace(/([_-]\w|^\w)/g, k => (k[1] ?? k[0]).toUpperCase());
    config.entry[key] = {
      import: importEntry,
      library: {
        type: "umd",
        export: "default",
        umdNamedDefine: true,
        name: {
          root: ["SurveyThemes", umdName],
          amd: "[dashedname]",
          commonjs: "[dashedname]",
        },
      }
    };
  });
}
module.exports = function (options) {
  options.platform = "";
  options.libraryName = "SurveyThemes";
  options.tsConfigFile = path.resolve(__dirname, "./tsconfig.themes.json");
  const mainConfig = webpackCommonConfig(options);
  mainConfig.entry = {};
  patchEntries(config);
  return merge(mainConfig, config);
};
