const fs = require("fs");
const MikeThemes = require("./themes.json");
var themes = {};
var articleFontSettings = {};

const _dirPath = "./src/themes/";
const displayNameMap = {
  "default": "Default",
  "contrast": "Sharp",
  "plain": "Borderless",
  "simple": "Flat",
  "blank": "Plain",
  "double": "DoubleBorder",
  "bulk": "Layered",
  "pseudo3d": "Solid",
  "playful": "ThreeDimensional",
  "ultra": "Contrast"
};
// const themeNames = ["default", "contrast", "plain", "simple", "blank", "double", "bulk", "pseudo-3d", "playful", "ultra"];
const themeNames = Object.keys(displayNameMap).map(oldThemeName => displayNameMap[oldThemeName]);

function getDisplayName(themeName) {
  if (themeName.indexOf("pseudo-3d") !== -1) {
    themeName = themeName.replace("pseudo-3d", "pseudo3d");
  }
  const baseThemeName = themeName.split("-")[0];
  if (!displayNameMap[baseThemeName]) return themeName;

  return themeName.replace(baseThemeName, displayNameMap[baseThemeName].toLowerCase());
}

function createBoxShadow(value) {
  return value.map((val => `${val["type"] === "innerShadow" ? "inset " : ""}${val.x}px ${val.y}px ${val.radius}px ${val.spread}px ${val.color}`
  )).join(",");
}
function getShadowSettings(shadowGroup, isReset = false) {
  let result = [];
  const parseShadowSettings = (settings => {
    const _result = {};
    Object.keys(settings)
      .filter(shadowPropery => { return (shadowPropery !== "category" && shadowPropery !== "exportKey"); })
      .forEach(shadowPropery => {
        if (shadowPropery === "offset") {
          _result["x"] = settings[shadowPropery]["x"]["value"];
          _result["y"] = settings[shadowPropery]["y"]["value"];
        } else {
          _result[shadowPropery] = settings[shadowPropery]["value"];
        }
      });
    return _result;
  });
  if (!!shadowGroup["0"]) {
    result = Object.keys(shadowGroup)
      .filter(shadowPropery => { return (shadowPropery !== "category" && shadowPropery !== "exportKey"); })
      .map(key => shadowGroup[key]).map(item => parseShadowSettings(item));
  } else {
    result = [parseShadowSettings(shadowGroup)];
  }
  if (isReset) {
    result = createBoxShadowReset(result);
  }
  return createBoxShadow(result);
}

function createBoxShadowReset(result) {
  result.forEach((valueItem) => {
    valueItem.x = 0;
    valueItem.y = 0;
    valueItem.radius = 0;
    valueItem.spread = 0;
  });

  return result;
}

if (!!MikeThemes["article"] && Object.keys(MikeThemes["article"]).length > 0) {
  const allowedSettings = ["textDecoration", "fontWeight", "fontStyle", "fontStretch", "letterSpacing", "lineHeight", "paragraphIndent", "textCase"];
  Object.keys(MikeThemes["article"]).forEach(fontSettingsName => {
    const fontSettings = MikeThemes["article"][fontSettingsName];
    if (!!fontSettings && Object.keys(fontSettings).length > 0) {
      Object.keys(fontSettings).filter(key => allowedSettings.indexOf(key) !== -1).forEach(key => {
        let value = fontSettings[key]["value"];
        if (value !== undefined) {
          value = value + ((fontSettings[key]["type"] === "number" && fontSettings[key]["unit"] === "pixel") ? "px" : "");
        }
        articleFontSettings["--sjs-article-font-" + fontSettingsName + "-" + key] = value;
      });
    }
  });
}

Object.keys(MikeThemes).filter(key => ["light", "dark", "ui", "article"].indexOf(key) === -1).forEach(function (themeName) {
  console.log(themeName);

  const generalGroup = MikeThemes[themeName]["general"];
  const primaryGroup = MikeThemes[themeName]["primary"];
  const secondaryGroup = MikeThemes[themeName]["secondary"];
  const shadowGroup = MikeThemes[themeName]["shadow"];
  const bordersGroup = MikeThemes[themeName]["borders"];
  const specialGroup = MikeThemes[themeName]["special"];

  const displayThemeName = getDisplayName(themeName);
  themes[displayThemeName] = {};

  if (!!generalGroup) {
    themes[displayThemeName] = {
      "--sjs-general-backcolor": generalGroup["backcolor"] ? generalGroup["backcolor"]["value"] : undefined,
      "--sjs-general-backcolor-dark": generalGroup["backcolor-dark"] ? generalGroup["backcolor-dark"]["value"] : undefined,
      "--sjs-general-backcolor-dim": generalGroup["dim-backcolor"] ? generalGroup["dim-backcolor"]["value"] : undefined,
      "--sjs-general-backcolor-dim-light": generalGroup["dim-backcolor-light"] ? generalGroup["dim-backcolor-light"]["value"] : undefined,
      "--sjs-general-backcolor-dim-dark": generalGroup["dim-backcolor-dark"] ? generalGroup["dim-backcolor-dark"]["value"] : undefined,
      "--sjs-general-forecolor": generalGroup.forecolor ? generalGroup.forecolor["value"] : undefined,
      "--sjs-general-forecolor-light": generalGroup["forecolor-light"] ? generalGroup["forecolor-light"]["value"] : undefined,
      "--sjs-general-dim-forecolor": generalGroup["dim-forecolor"] ? generalGroup["dim-forecolor"]["value"] : undefined,
      "--sjs-general-dim-forecolor-light": generalGroup["dim-forecolor-light"] ? generalGroup["dim-forecolor-light"]["value"] : undefined,
    };
  }
  if (!!primaryGroup) {
    themes[displayThemeName]["--sjs-primary-backcolor"] = primaryGroup["backcolor"] ? primaryGroup["backcolor"]["value"] : undefined;
    themes[displayThemeName]["--sjs-primary-backcolor-light"] = primaryGroup["backcolor-light"] ? primaryGroup["backcolor-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-primary-backcolor-dark"] = primaryGroup["backcolor-dark"] ? primaryGroup["backcolor-dark"]["value"] : undefined;
    themes[displayThemeName]["--sjs-primary-forecolor"] = primaryGroup["forecolor"] ? primaryGroup["forecolor"]["value"] : undefined;
    themes[displayThemeName]["--sjs-primary-forecolor-light"] = primaryGroup["forecolor-light"] ? primaryGroup["forecolor-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-base-unit"] = "8px";
    themes[displayThemeName]["--sjs-corner-radius"] = "4px";
  }
  if (!!secondaryGroup) {
    themes[displayThemeName]["--sjs-secondary-backcolor"] = secondaryGroup["backcolor"] ? secondaryGroup["backcolor"]["value"] : undefined;
    themes[displayThemeName]["--sjs-secondary-backcolor-light"] = secondaryGroup["backcolor-light"] ? secondaryGroup["backcolor-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-secondary-backcolor-semi-light"] = secondaryGroup["backcolor-semi-light"] ? secondaryGroup["backcolor-semi-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-secondary-forecolor"] = secondaryGroup["forecolor"] ? secondaryGroup["forecolor"]["value"] : undefined;
    themes[displayThemeName]["--sjs-secondary-forecolor-light"] = secondaryGroup["forecolor-light"] ? secondaryGroup["forecolor-light"]["value"] : undefined;
  }
  if (!!shadowGroup) {
    themes[displayThemeName]["--sjs-shadow-small"] = shadowGroup["small"] ? getShadowSettings(shadowGroup["small"]) : undefined;
    themes[displayThemeName]["--sjs-shadow-small-reset"] = shadowGroup["small"] ? getShadowSettings(shadowGroup["small"], true) : undefined;
    themes[displayThemeName]["--sjs-shadow-medium"] = shadowGroup["medium"] ? getShadowSettings(shadowGroup["medium"]) : undefined;
    themes[displayThemeName]["--sjs-shadow-large"] = shadowGroup["large"] ? getShadowSettings(shadowGroup["large"]) : undefined;
    themes[displayThemeName]["--sjs-shadow-inner"] = shadowGroup["inner"] ? getShadowSettings(shadowGroup["inner"]) : undefined;
    themes[displayThemeName]["--sjs-shadow-inner-reset"] = shadowGroup["inner"] ? getShadowSettings(shadowGroup["inner"], true) : undefined;
  }
  if (!!bordersGroup) {
    themes[displayThemeName]["--sjs-border-light"] = bordersGroup["light-border"] ? bordersGroup["light-border"]["value"] : undefined;
    themes[displayThemeName]["--sjs-border-default"] = bordersGroup["default-border"] ? bordersGroup["default-border"]["value"] : undefined;
    themes[displayThemeName]["--sjs-border-inside"] = bordersGroup["inside-border"] ? bordersGroup["inside-border"]["value"] : undefined;
  }
  if (!!specialGroup) {
    themes[displayThemeName]["--sjs-special-red"] = specialGroup["red"] ? specialGroup["red"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-red-light"] = specialGroup["red-light"] ? specialGroup["red-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-red-forecolor"] = specialGroup["red-forecolor"] ? specialGroup["red-forecolor"]["value"] : undefined;

    themes[displayThemeName]["--sjs-special-green"] = specialGroup["green"] ? specialGroup["green"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-green-light"] = specialGroup["green-light"] ? specialGroup["green-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-green-forecolor"] = specialGroup["green-forecolor"] ? specialGroup["green-forecolor"]["value"] : undefined;

    themes[displayThemeName]["--sjs-special-blue"] = specialGroup["blue"] ? specialGroup["blue"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-blue-light"] = specialGroup["blue-light"] ? specialGroup["blue-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-blue-forecolor"] = specialGroup["blue-forecolor"] ? specialGroup["blue-forecolor"]["value"] : undefined;

    themes[displayThemeName]["--sjs-special-yellow"] = specialGroup["yellow"] ? specialGroup["yellow"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-yellow-light"] = specialGroup["yellow-light"] ? specialGroup["yellow-light"]["value"] : undefined;
    themes[displayThemeName]["--sjs-special-yellow-forecolor"] = specialGroup["yellow-forecolor"] ? specialGroup["yellow-forecolor"]["value"] : undefined;
  }
  themes[displayThemeName] = Object.assign(themes[displayThemeName], articleFontSettings);
});

const predefinedThemesContent = JSON.stringify(themes, null, 4);
fs.writeFileSync(_dirPath + "predefined-themes.json", predefinedThemesContent);
const predefinedThemes = JSON.parse(predefinedThemesContent);

function getThemeObject(themeName, isPanelless, isDarkMode) {
  var getFullThemeName = (_themeName, isDarkMode) => {
    return isDarkMode ? (_themeName + "-dark") : _themeName;
  };

  var newTheme = {};
  Object.assign(newTheme, predefinedThemes[getFullThemeName("default", isDarkMode)], predefinedThemes[getFullThemeName(themeName, isDarkMode)]);
  if (isPanelless) {
    Object.assign(newTheme, predefinedThemes[getFullThemeName(themeName, isDarkMode) + "-lw"]);
  }
  return { themeName, colorPalette: isDarkMode ? "dark" : "light", isPanelless, cssVariables: newTheme };
}
const exportedNames = [];
function writeTheme(themeName, isPanelless, isDarkMode) {
  const themeNameLowerCase = themeName.toLowerCase();
  const fileName = themeNameLowerCase + "-" + (isDarkMode ? "dark" : "light") + (isPanelless ? "-panelless" : "");
  const theme = getThemeObject(themeNameLowerCase, isPanelless, isDarkMode);
  const variableName = [themeName, (isDarkMode ? "Dark" : "Light"), (isPanelless ? "Panelless" : "")].join("");
  const themeJson = JSON.stringify(theme, null, 2);
  const result = `export default ${themeJson};`;
  fs.writeFileSync(_dirPath + fileName + ".ts", result);
  exportedNames.push(variableName);
  return `import ${variableName} from "./${fileName}";\n`;
}

let indexFileContent = "";
themeNames.forEach(themeName => {
  console.log(themeName);
  indexFileContent += writeTheme(themeName, false, false);
  indexFileContent += writeTheme(themeName, false, true);
  indexFileContent += writeTheme(themeName, true, false);
  indexFileContent += writeTheme(themeName, true, true);
});
indexFileContent += "const __surveyjs_internal_themes_hash = true;\n";
exportedNames.push("__surveyjs_internal_themes_hash");
indexFileContent += `export { ${exportedNames.join(", ")} };\n`;
indexFileContent += `export default { ${exportedNames.join(", ")} };`;
fs.writeFileSync(_dirPath + "index.ts", indexFileContent);