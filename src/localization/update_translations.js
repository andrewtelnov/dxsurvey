/* eslint no-use-before-define: 0 */
/**
 * Finds missed (untranslated) strings in translation
 * Add missed strings as comments in translation
 * Example of running to update french.ts  and all translation files:
 * node update_translation french
 * node update_translation all
 */
// eslint-disable-next-line no-undef
const fs = require("fs");

const startStr = " = {";
const endStr = "};";
// eslint-disable-next-line no-undef
let arg = process.argv;
if(!Array.isArray(arg)) return;
if(arg.length < 3) {
  reportMessage("You should pass file name as parameter or 'all'");
  return;
}
let parameter = arg[2].toLocaleLowerCase();
if(parameter === "english") {
  reportMessage("You can't update english translation");
  return;
}
const englishJSON = readJson("english");
const languages = [];
if(parameter === "all") {
  fs.readdir(".", function (err, files) {
    if (err) {
      reportMessage("Unable to scan directory: " + err);
      return;
    }
    files.forEach(function (file) {
      if(file.indexOf(".ts") > 0 && file !== "english.ts") {
        updateTranslation(file);
      }
    });
  });
} else {
  if(!isTranslationExists(parameter)) {
    reportMessage("There is translation file: " + getTranslationFileName(parameter));
    return;
  }
  updateTranslation(parameter);
}
function reportMessage(msg) {
  // eslint-disable-next-line no-console
  console.log(msg);
}
function isTranslationExists(fileName) {
  return fs.existsSync(getTranslationFileName(fileName));
}
function getTranslationFileName(name) {
  if(name.indexOf(".ts") < 0) {
    name += ".ts";
  }
  return name;
}
function readFile(fileName) {
  return fs.readFileSync(getTranslationFileName(fileName), "utf8");
}
function readJson(name) {
  const text = readFile(name);
  const start = text.indexOf(startStr);
  const end = text.lastIndexOf(endStr);
  if(start < 0 || end < 0) return undefined;
  const content = text.substring(start + startStr.length, end);
  return eval("({" + content + "})");
}
function replaceText(name, newText, missedKeys) {
  const text = readFile(name);
  const start = text.indexOf(startStr);
  const end = text.lastIndexOf(endStr);
  let content = text.substring(0, start + startStr.length) +
    newText + text.substring(end);
  let missedKeysStr = "";
  if(missedKeys > 0) {
    missedKeysStr = "// This dictionary contains " + missedKeys + " untranslated or inherited localization strings.\n// These strings are commented out. Uncomment and edit them if you want to add your translations.\n";
  }
  const importIndex = content.indexOf("import {");
  if(importIndex > 0) {
    content = content.substring(importIndex);
  }
  fs.writeFileSync(getTranslationFileName(name), missedKeysStr + content);
}
function updateTranslation(name) {
  const json = readJson(name);
  if(!json) return;
  const lines = [];
  let missedKeys = 0;
  for(let key in englishJSON) {
    let hasValue = !!json[key];
    let value = hasValue ? json[key] : englishJSON[key];
    let line = key + ": " + JSON.stringify(value);
    if(!hasValue) {
      line = "// " + line;
      missedKeys ++;
    }
    lines.push(line);
  }
  for(let i = 0; i < lines.length; i ++) {
    let line = lines[i];
    if(i < lines.length - 1) {
      line = line + ",";
    }
    line = "\r\n  " + line;
    lines[i] = line;
  }
  lines.push("\r\n");
  if(missedKeys > 0) {
    replaceText(name, lines.join(""), missedKeys);
    reportMessage("Updated file: " + getTranslationFileName(name));
  } else {
    reportMessage("All strings are translated in file: " + getTranslationFileName(name));
  }
}