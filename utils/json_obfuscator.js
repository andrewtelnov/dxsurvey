// eslint-disable-next-line no-undef
const fs = require("fs");
// eslint-disable-next-line no-undef
const path = require("path");

const Survey = require("../build/survey-core/survey.core");
// eslint-disable-next-line no-undef
let args = process.argv;
if(!Array.isArray(args)) return;
if(args.length < 3) {
  // eslint-disable-next-line no-console
  console.error("Please provide link to the survey JSON file");
  return;
}
const fileName = args[2];
fs.readFile(fileName, (err, data) => {
    if (err) {
        // eslint-disable-next-line no-console
        console.error("Unable to read the file: " + err);
        return;
    }
    const newJSON = obfuscateJSON(data);
    const ext = path.extname(fileName);
    const newFileName = fileName.substring(0, fileName.length - ext.length) + ".obf" + ext;
    fs.writeFile(newFileName, newJSON, err => {
        if (err) {
            // eslint-disable-next-line no-console
            console.error(err);
        } else {
            // eslint-disable-next-line no-console
            console.log("File generated correctly: " + newFileName);
        }
    });
});

function obfuscateJSON(data) {
    const model = new Survey.Model(JSON.parse(data));
    let index = 0;
    model.getAllPanels().forEach(panel => {
        panel.name = "panel" + (++index);
    });
    const containers = [model];
    model.pages.forEach(page => containers.push(page));
    model.getAllPanels().forEach(panel => containers.push(panel));
    const propsToObs = ["title", "description", "requiredErrorText"];
    containers.forEach(container => obfuscatePropsText(container, propsToObs));

    let questions = model.getAllQuestions();
    questions.forEach( q => {
        if(q.getType() === "html") {
            q.delete();
            return;
        }
        obfuscatePropsText(q, propsToObs);
        ["choices", "columns", "rows", "validators"].forEach(name => {
            obfuscateArrayText(q[name]);
        });
    });
    questions = model.getAllQuestions();
    const qNames = [];
    index = 0;
    questions.forEach(q => {
        const newName = "q" + (++index);
        const oldName = q.name;
        q.name = newName;
        qNames.push({ oldName: oldName, newName: newName });
    });
    let json = JSON.stringify(model.toJSON(), null, 2);
    qNames.forEach(item => {
        ["{", "{panel.", "{row."].forEach(prefix =>
            json = renameQuestionInExpression(json, prefix + item.oldName, prefix + item.newName, ["}", ".", "["])
        );
    });
    return json;
}
function obfuscatePropsText(el, props) {
    props.forEach(
        prop => {
            if(!!el[prop]) el[prop] = obfuscateText(el[prop]);
        }
    );
}
function obfuscateArrayText(items) {
    if(Array.isArray(items)) {
        items.forEach(item => {
            if(item.text) {
                item.text = obfuscateText(item.text);
            }
            if(item.title) {
                item.title = obfuscateText(item.title);
            }
        });
    }
}
function obfuscateText(text) {
    if(!text) return text;
    let newText = "";
    for(let i = 0; i < text.length; i ++) {
        const ch = text[i];
        let newCh = ch;
        if(ch >= "a" && ch <= "z") newCh = getRandomChar("a", "z"); 
        if(ch >= "A" && ch <= "Z") newCh = getRandomChar("A", "Z");
        newText += newCh;
    };
    return newText;
}
function getRandomChar(min, max) {
    const minI = min.codePointAt(0);
    const maxI = max.codePointAt(0)
    const val = Math.floor(Math.random() * (maxI - minI + 1)) + minI;
    return String.fromCharCode(val);
}
function renameQuestionInExpression(json, oldName, newName, postFixes) {
  postFixes.forEach(post => {
    const re = new RegExp(oldName + "\\" + post, "gi");
    json = json.replace(re, newName + post);
  });
  return json;
}