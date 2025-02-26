import { SurveyModel } from "../src/survey";
import { QuestionSelectBase } from "../src/question_baseselect";
import { settings } from "../src/settings";
import { QuestionRadiogroupModel } from "../src/question_radiogroup";
import { QuestionCheckboxModel } from "../src/question_checkbox";
import { QuestionDropdownModel } from "../src/question_dropdown";
import { Serializer } from "../src/jsonobject";
import { QuestionPanelDynamicModel } from "../src/question_paneldynamic";
import { defaultCss } from "../src/defaultCss/defaultCss";
import { IAction } from "../src/actions/action";
import { surveyLocalization } from "../src/surveyStrings";
import { Base } from "../src/base";
import { QuestionMatrixDynamicModel } from "../src/question_matrixdynamic";
import { setOldTheme } from "./oldTheme";
import { ItemValue } from "../src/itemvalue";

export default QUnit.module("baseselect");

function getValuesInColumns(question: QuestionSelectBase) {
  return question.columns.map((column) => column.map((choice) => choice.id));
}

QUnit.test("Check QuestionSelectBase columns property", function (assert) {
  const json = {
    questions: [
      {
        type: "checkbox",
        name: "Question 1",
        choices: ["Item1", "Item2", "Item3", "Item4", "Item5"],
        colCount: 3,
      },
    ],
  };
  const survey = new SurveyModel(json);

  settings.itemFlowDirection = "row";
  const question = <QuestionSelectBase>survey.getAllQuestions()[0];
  let columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item4"], ["Item2", "Item5"], ["Item3"]],
    "check itemFlowDirection row"
  );
  settings.itemFlowDirection = "column";
  columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item2"], ["Item3", "Item4"], ["Item5"]],
    "check itemFlowDirection column"
  );
});
QUnit.test("Check QuestionSelectBase columns property and creator V2", function (assert) {
  var json = {
    questions: [
      {
        type: "checkbox",
        name: "Question 1",
        colCount: 2,
      },
    ],
  };

  var survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON(json);
  const question = <QuestionSelectBase>survey.getAllQuestions()[0];
  let columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [[], []],
    "one column"
  );
  let headItems = question.headItems.map((item) => item.id);
  let footItems = question.footItems.map((item) => item.id);

  assert.deepEqual(
    headItems,
    ["selectall"],
    "check head items"
  );
  assert.deepEqual(
    footItems,
    ["newitem", "none", "other"],
    "check foot items"
  );
});

QUnit.test("Check QuestionSelectBase head and foot items property", function (assert) {
  var json = {
    questions: [
      {
        type: "checkbox",
        name: "Question 1",
        choices: ["Item1", "Item2", "Item3", "Item4", "Item5"],
        colCount: 3,
      },
    ],
  };
  var survey = new SurveyModel(json);

  var question = <QuestionSelectBase>survey.getAllQuestions()[0];
  assert.notOk(question.hasHeadItems);
  assert.notOk(question.hasFootItems);

  settings.itemFlowDirection = "column";
  let columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item2"], ["Item3", "Item4"], ["Item5"]],
    "check itemFlowDirection col - runtime"
  );

  survey.setDesignMode(true);

  (<any>question).updateVisibleChoices();
  assert.ok(question.hasHeadItems);
  assert.ok(question.hasFootItems);
  columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item2"], ["Item3", "Item4"], ["Item5"]],
    "check itemFlowDirection col - design"
  );
  let headItems = question.headItems.map((item) => item.id);
  let footItems = question.footItems.map((item) => item.id);

  assert.deepEqual(
    headItems,
    ["selectall"],
    "check head items"
  );
  assert.deepEqual(
    footItems,
    ["newitem", "none", "other"],
    "check foot items"
  );
  settings.itemFlowDirection = "row";
});

QUnit.test("Check QuestionSelectBase head and foot items property vs refuse and dontknow properties", function (assert) {
  const refuseProp = Serializer.findProperty("selectbase", "showRefuseItem");
  const dontKnowProp = Serializer.findProperty("selectbase", "showDontKnowItem");
  refuseProp.visible = true;
  dontKnowProp.visible = true;
  const json = {
    questions: [
      {
        type: "checkbox",
        name: "Question 1",
        choices: ["Item1", "Item2", "Item3", "Item4", "Item5"],
        colCount: 3,
      },
    ],
  };
  const survey = new SurveyModel(json);

  var question = <QuestionSelectBase>survey.getAllQuestions()[0];
  assert.notOk(question.hasHeadItems);
  assert.notOk(question.hasFootItems);

  settings.itemFlowDirection = "column";
  let columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item2"], ["Item3", "Item4"], ["Item5"]],
    "check itemFlowDirection col - runtime"
  );

  survey.setDesignMode(true);

  (<any>question).updateVisibleChoices();
  assert.ok(question.hasHeadItems);
  assert.ok(question.hasFootItems);
  columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item2"], ["Item3", "Item4"], ["Item5"]],
    "check itemFlowDirection col - design"
  );
  let headItems = question.headItems.map((item) => item.id);
  let footItems = question.footItems.map((item) => item.id);

  assert.deepEqual(
    headItems,
    ["selectall"],
    "check head items"
  );
  assert.deepEqual(
    footItems,
    ["newitem", "none", "refused", "dontknow", "other"],
    "check foot items"
  );
  settings.itemFlowDirection = "row";
  refuseProp.visible = false;
  dontKnowProp.visible = false;
});

QUnit.test("Check QuestionSelectBase and separateSpecialChoices option", function (assert) {
  var json = {
    questions: [
      {
        type: "checkbox",
        name: "Question 1",
        choices: ["Item1", "Item2"],
        hasOther: true,
        hasSelectAll: true,
        showNoneItem: true,
        colCount: 2
      },
    ],
  };
  var survey = new SurveyModel(json);

  var question = <QuestionSelectBase>survey.getAllQuestions()[0];
  question.separateSpecialChoices = false;
  assert.notOk(question.hasHeadItems);
  assert.notOk(question.hasFootItems);

  let columns = getValuesInColumns(question);
  settings.itemFlowDirection = "column";
  assert.deepEqual(
    columns,
    [["selectall", "Item2", "other"], ["Item1", "none"]],
    "check columns with no separateSpecialChoices"
  );

  question.separateSpecialChoices = true;
  assert.ok(question.hasHeadItems);
  assert.ok(question.hasFootItems);

  columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1"], ["Item2"]],
    "check columns with separateSpecialChoices"
  );
  let headItems = question.headItems.map((item) => item.id);
  let footItems = question.footItems.map((item) => item.id);

  assert.deepEqual(
    headItems,
    ["selectall"],
    "check head items"
  );
  assert.deepEqual(
    footItems,
    ["none", "other"],
    "check foot items"
  );
  settings.itemFlowDirection = "row";
});
QUnit.test("settings.noneItemValue", function (assert) {
  settings.noneItemValue = "n/a";
  const json = {
    questions: [
      { name: "q1", type: "dropdown", choices: [1, 2, 3], showNoneItem: true },
      { name: "q1", type: "checkbox", choices: [1, 2, 3], showNoneItem: true }
    ],
  };
  const survey = new SurveyModel(json);
  const q1 = <QuestionSelectBase>survey.getAllQuestions()[0];
  q1.value = "n/a";
  assert.equal(q1.isNoneSelected, true, "dropdown none is selected");
  const q2 = <QuestionSelectBase>survey.getAllQuestions()[1];
  q2.value = ["n/a"];
  assert.equal(q2.isNoneSelected, true, "checkbox none is selected");
  settings.noneItemValue = "none";
});

QUnit.test("Set ", function (assert) {
  var json = {
    questions: [
      {
        type: "checkbox",
        name: "q1",
        choicesByUrl: {
          path: "path1",
          valueName: "val1",
        },
      },
      {
        type: "checkbox",
        name: "q2",
        choicesByUrl: {
          path: "path2",
          titleName: "title1",
        },
      },
    ],
  };
  var survey = new SurveyModel(json);
  var q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  var q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  q2.choicesByUrl = q1.choicesByUrl;
  assert.equal(q2.choicesByUrl.path, "path1", "path set correctly");
  assert.equal(q2.choicesByUrl.valueName, "val1", "valueName set correctly");
  assert.equal(q2.choicesByUrl.titleName, "", "titleName is cleard");
});
QUnit.test("check allowhover class in design mode", (assert) => {
  var json = {
    questions: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["Item 1"],
      },
    ],
  };
  const survey = new SurveyModel(json);
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  q1.cssClasses.itemHover = "sv_q_checkbox_hover";
  const item = q1.visibleChoices[0];
  assert.ok(q1.getItemClass(item).indexOf("sv_q_checkbox_hover") != -1);
  survey.setDesignMode(true);
  assert.ok(q1.getItemClass(item).indexOf("sv_q_checkbox_hover") == -1);
});
QUnit.test("check item value type", (assert) => {
  const survey = new SurveyModel({
    questions: [
      {
        type: "dropdown",
        name: "q1",
        choices: ["Item 1"],
      },
      {
        type: "imagepicker",
        name: "q2",
        choices: ["Item 1"],
      },
      {
        type: "buttongroup",
        name: "q3",
        choices: ["Item 1"],
      },
    ],
  });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  const q3 = <QuestionSelectBase>survey.getQuestionByName("q3");
  assert.equal(q1.choices[0].getType(), "itemvalue", "load dropdown");
  assert.equal(q1.choices[0].value, "Item 1", "load dropdown, value");
  assert.equal(q2.choices[0].getType(), "imageitemvalue", "load imagepicker");
  assert.equal(q2.choices[0].value, "Item 1", "load imagepicker value");
  assert.equal(q3.choices[0].getType(), "buttongroupitemvalue", "load buttongroup");
  assert.equal(q3.choices[0].value, "Item 1", "load buttongroup value");
  assert.equal(q1.createItemValue(1).getType(), "itemvalue", "create dropdown item");
  assert.equal(q1.createItemValue(1).value, 1, "create dropdown, value");
  assert.equal(q2.createItemValue(1).getType(), "imageitemvalue", "create imagepicker item");
  assert.equal(q2.createItemValue(1).value, 1, "create imagepicker, value");
  assert.equal(q3.createItemValue(1).getType(), "buttongroupitemvalue", "create buttongroup item");
  assert.equal(q3.createItemValue(1).value, 1, "create buttongroup, value");
});

QUnit.test("check item locstring owner and name", (assert) => {
  const survey = new SurveyModel({
    questions: [
      {
        type: "radiogroup",
        name: "q1",
        choices: ["Item 1"],
      }]
  });

  var question = survey.getQuestionByName("q1") as any;
  assert.equal(question.locTitle.owner.getType(), "radiogroup", "Owner for radio question title is radiogroup");
  assert.equal(question.locTitle.name, "title", "Name for radio question title is title");
  var itemValue = (question.choices[0]);
  assert.equal(itemValue.locText.owner.getType(), "itemvalue", "Owner for radio question item text is itemvalue");
  assert.equal(itemValue.locText.name, "text", "Name for radio question item text is text");
});

QUnit.test("check onShowingChoiceItem event", (assert) => {
  const survey = new SurveyModel({
    questions: [
      {
        type: "radiogroup",
        name: "q1",
        choices: [{ value: "Item1", visibleIf: "1 = 2" }, "Item2", "Item3"],
        showNoneItem: true,
        hasOther: true
      }]
  });

  const question = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  assert.equal(question.visibleChoices.length, 4);
  assert.equal(question.visibleChoices[0].value, "Item2");
  assert.equal(question.visibleChoices[1].value, "Item3");
  assert.equal(question.visibleChoices[2].value, "none");
  assert.equal(question.visibleChoices[3].value, "other");

  survey.onShowingChoiceItem.add((sender, options) => {
    if (options.question.name !== "q1") return;
    options.visible = ["Item1", "Item2"].indexOf(options.item.value) > -1;
  });

  assert.equal(question.visibleChoices.length, 2);
  assert.equal(question.visibleChoices[0].value, "Item1");
  assert.equal(question.visibleChoices[1].value, "Item2");
});
QUnit.test("check onShowingChoiceItem event & showRefuseItem & showDontKnowItem", (assert) => {
  const survey = new SurveyModel({
    questions: [
      {
        type: "radiogroup",
        name: "q1",
        choices: [{ value: "Item1", visibleIf: "1 = 2" }, "Item2", "Item3"],
        showNoneItem: true,
        showRefuseItem: true,
        showDontKnowItem: true,
        hasOther: true
      }]
  });

  const question = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  assert.equal(question.visibleChoices.length, 6);
  assert.equal(question.visibleChoices[0].value, "Item2");
  assert.equal(question.visibleChoices[1].value, "Item3");
  assert.equal(question.visibleChoices[2].value, "none");
  assert.equal(question.visibleChoices[3].value, "refused");
  assert.equal(question.visibleChoices[4].value, "dontknow");
  assert.equal(question.visibleChoices[5].value, "other");

  survey.onShowingChoiceItem.add((sender, options) => {
    if (options.question.name !== "q1") return;
    options.visible = ["Item1", "Item2"].indexOf(options.item.value) > -1;
  });

  assert.equal(question.visibleChoices.length, 2);
  assert.equal(question.visibleChoices[0].value, "Item1");
  assert.equal(question.visibleChoices[1].value, "Item2");
});

QUnit.test("check focus comment of other select", (assert) => {
  const survey = new SurveyModel({
    questions: [
      {
        type: "checkbox",
        name: "q1",
        hasOther: true,
        choices: ["item1"]
      }
    ]
  });
  let counter = 0;
  const q = survey.getQuestionByName("q1");
  q["focusOtherComment"] = () => {
    counter++;
  };
  assert.equal(counter, 0);
  q.value = ["other"];
  assert.equal(counter, 1);
  q.value = ["other", "item1"];
  assert.equal(counter, 1);
  q.value = ["item1"];
  assert.equal(counter, 1);
  q.value = ["item1", "other"];
  assert.equal(counter, 2);
});
QUnit.test("check separateSpecialChoices property visibility", (assert) => {
  assert.notOk(Serializer.findProperty("selectbase", "separateSpecialChoices").visible);
  assert.ok(Serializer.findProperty("checkbox", "separateSpecialChoices").visible);
  assert.ok(Serializer.findProperty("radiogroup", "separateSpecialChoices").visible);
  assert.notOk(Serializer.findProperty("imagepicker", "separateSpecialChoices").visible);
  assert.notOk(Serializer.findProperty("dropdown", "separateSpecialChoices").visible);
});
QUnit.test("check focus comment of other select", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
      },
      {
        type: "radiogroup",
        name: "q2",
        choices: [
          "item1",
          {
            value: "item2",
            visibleIf: "{q1} = ['apple']",
          },
          "item3",
        ],
        hasOther: true,
      },
    ],
  });
  survey.data = {
    q2: "item2",
    q1: ["apple"],
  };
  const q = <QuestionRadiogroupModel>survey.getQuestionByName("q2");
  assert.notEqual(q.value, q.otherItem.value, "Other is not selected");
  assert.equal(q.value, "item2", "item2 is selected");
});
QUnit.test("checkbox and valuePropertyName", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.valuePropertyName = "fruit";
  q.renderedValue = ["apple"];
  assert.deepEqual(q.value, [{ fruit: "apple" }], "#1");
  assert.deepEqual(q.renderedValue, ["apple"], "#2");
  assert.equal(q.isItemSelected(q.choices[0]), true, "#2.1");
  assert.equal(q.isItemSelected(q.choices[1]), false, "#2.2");
  assert.equal(q.isItemSelected(q.choices[2]), false, "#2.3");
  q.value = [{ fruit: "apple" }, { fruit: "orange" }];
  assert.deepEqual(q.renderedValue, ["apple", "orange"], "#3");
  assert.deepEqual(survey.data, { q1: [{ fruit: "apple" }, { fruit: "orange" }] }, "convert to data correctly, #4");
  assert.equal(q.isItemSelected(q.choices[0]), true, "#3.1");
  assert.equal(q.isItemSelected(q.choices[1]), false, "#3.2");
  assert.equal(q.isItemSelected(q.choices[2]), true, "#3.3");
  survey.doComplete();
  assert.deepEqual(survey.data, { q1: [{ fruit: "apple" }, { fruit: "orange" }] }, "survey.data is correct on complete, #5");
});
QUnit.test("checkbox valuePropertyName and shared data vs panel dynamic ", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        valueName: "data",
        valuePropertyName: "fruit",
        choices: ["apple", "banana", "orange"],
      },
      {
        type: "paneldynamic",
        name: "q2",
        panelCount: 0,
        valueName: "data",
        templateElements: [
          {
            type: "text",
            name: "name"
          }
        ]
      }
    ]
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionPanelDynamicModel>survey.getQuestionByName("q2");
  q1.renderedValue = ["apple", "orange"];
  assert.equal(q2.panelCount, 2, "#1, Panel count is changed");
  q2.panels[0].getQuestionByName("name").value = "text1";
  q2.panels[1].getQuestionByName("name").value = "text2";
  assert.deepEqual(survey.data, {
    data: [
      { fruit: "apple", name: "text1" },
      { fruit: "orange", name: "text2" }]
  }, "#2, combine results");
  q1.renderedValue = ["apple"];
  assert.deepEqual(survey.data, {
    data: [
      { fruit: "apple", name: "text1" }]
  }, "#3, keep results");
  q1.renderedValue = ["apple", "orange"];
  assert.deepEqual(survey.data, {
    data: [
      { fruit: "apple", name: "text1" },
      { fruit: "orange" }]
  }, "#4, add new value");
  q2.removePanel(0);
  assert.deepEqual(survey.data, {
    data: [
      { fruit: "orange" }]
  }, "#5, remove panel, data");
  assert.deepEqual(q1.renderedValue, ["orange"], "#6, remove panel, renderedValue");
});
QUnit.test("checkbox vs valuePropertyName, check selectAll and none", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        showNoneItem: true,
        hasSelectAll: true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.toggleSelectAll();
  assert.deepEqual(q.renderedValue, ["apple", "banana", "orange"], "#1");
  assert.deepEqual(q.value, [{ fruit: "apple" }, { fruit: "banana" }, { fruit: "orange" }], "#2");
  assert.equal(q.isAllSelected, true, "#3, all is selected");
  q.clickItemHandler(q.noneItem, true);
  assert.deepEqual(q.value, [{ fruit: "none" }], "#4");
  assert.equal(q.isAllSelected, false, "#5, all is not selected");
});
QUnit.test("checkbox vs valuePropertyName, check selectAll and none & refuse & dontknow", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        showNoneItem: true,
        showRefuseItem: true,
        showDontKnowItem: true,
        hasSelectAll: true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.toggleSelectAll();
  assert.deepEqual(q.renderedValue, ["apple", "banana", "orange"], "#1");
  assert.deepEqual(q.value, [{ fruit: "apple" }, { fruit: "banana" }, { fruit: "orange" }], "#2");
  assert.equal(q.isAllSelected, true, "#3, all is selected");
  q.clickItemHandler(q.refuseItem, true);
  assert.deepEqual(q.value, [{ fruit: "refused" }], "#4");
  assert.equal(q.isAllSelected, false, "#5, all is not selected");
  q.clickItemHandler(q.selectAllItem, true);
  assert.deepEqual(q.renderedValue, ["apple", "banana", "orange"], "#6");
  q.clickItemHandler(q.dontKnowItem, true);
  assert.deepEqual(q.value, [{ fruit: "dontknow" }], "#7");
  q.clickItemHandler(q.refuseItem, true);
  assert.deepEqual(q.value, [{ fruit: "refused" }], "#8");
  q.clickItemHandler(q.noneItem, true);
  assert.deepEqual(q.value, [{ fruit: "none" }], "#9");
  q.clickItemHandler(q.choices[0], true);
  assert.deepEqual(q.value, [{ fruit: "apple" }], "#10");
  q.renderedValue = ["refused"];
  assert.deepEqual(q.value, [{ fruit: "refused" }], "#11");
  q.clickItemHandler(q.choices[0], true);
  assert.deepEqual(q.value, [{ fruit: "apple" }], "#12");

  q.renderedValue = ["apple", "none"];
  assert.deepEqual(q.value, [{ fruit: "none" }], "#13");
  q.renderedValue = ["none", "refused"];
  assert.deepEqual(q.value, [{ fruit: "refused" }], "#14");
  q.renderedValue = ["refused", "dontknow"];
  assert.deepEqual(q.value, [{ fruit: "dontknow" }], "#15");
  q.renderedValue = ["dontknow", "none"];
  assert.deepEqual(q.value, [{ fruit: "none" }], "#16");
  q.renderedValue = ["none", "apple"];
  assert.deepEqual(q.value, [{ fruit: "apple" }], "#17");
});
QUnit.test("checkbox:readonly:clickItemHandler", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        showNoneItem: true,
        defaultValue: ["banana"],
        readOnly: true,
        hasSelectAll: true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.clickItemHandler(q.choices[2], true);
  assert.deepEqual(q.value, [{ fruit: "banana" }], "nothing changed");
});
QUnit.test("checkbox vs valuePropertyName, check hasOther", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        hasOther: true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(q.getStoreOthersAsComment(), false, "It becomes false because of valuePropertyName");
  q.renderedValue = ["other"];
  assert.deepEqual(q.value, [{ fruit: "other" }], "#1");
  q.comment = "text1";
  assert.deepEqual(survey.data, { q1: [{ fruit: "text1" }] }, "2");
});
QUnit.test("checkbox vs valuePropertyName, getDisplayValue", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: [{ value: 1, text: "apple" }, { value: 2, text: "banana" }, { value: 3, text: "orange" }],
        valuePropertyName: "fruit"
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.value = [1, 3];
  assert.deepEqual(q.getDisplayValue(false, [{ fruit: 1 }, { fruit: 3 }]), "apple, orange", "display value for all values");
  //assert.deepEqual(q.getDisplayValue(false, [{ fruite: 1 }]), ["apple", "orange"], "display value for all values");
  //assert.deepEqual(q.getDisplayValue(false), ["apple", "orange"], "display value for all values");
});
QUnit.test("checkbox vs valuePropertyName, check hasOther vs storeOthersAsComment", (assert) => {
  const survey = new SurveyModel({
    storeOthersAsComment: false,
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        hasOther: true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.renderedValue = ["other"];
  assert.deepEqual(q.value, [{ fruit: "other" }], "#1");
  q.comment = "text1";
  assert.deepEqual(q.value, [{ fruit: "text1" }], "#2");
  assert.deepEqual(survey.data, { q1: [{ fruit: "text1" }] }, "#3");
});
QUnit.test("checkbox vs valuePropertyName, check hasOther vs storeOthersAsComment & matrix", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        hasOther: true
      },
      {
        type: "matrixdynamic",
        name: "q2",
        valueName: "q1",
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "expression", name: "col2", expression: "{row.fruit}" }
        ]
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(q.getStoreOthersAsComment(), false, "it is false valuePropertyName is not empty");
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q2");
  q.renderedValue = ["apple", "other"];
  const rows = matrix.visibleRows;
  assert.equal(rows.length, 2, "matrix rows");
  q.comment = "text1";
  assert.equal(rows.length, 2, "matrix rows");
  assert.equal(rows[0].cells[1].question.value, "apple", "rows[0]");
  assert.equal(rows[1].cells[1].question.value, "text1", "rows[1]");
  assert.deepEqual(survey.data, { q1: [{ fruit: "apple", col2: "apple" }, { fruit: "text1", col2: "text1" }] }, "survey.data");
});
QUnit.test("checkbox vs valuePropertyName, use in expression", (assert) => {
  const survey = new SurveyModel({
    storeOthersAsComment: false,
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit"
      },
      {
        type: "text",
        name: "q2",
        visibleIf: "{q1-unwrapped} allof ['apple', 'orange']"
      }
    ]
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const conds: any = [];
  q1.addConditionObjectsByContext(conds, undefined);
  assert.equal(conds[0].name, "q1-unwrapped", "use filtered name");
  const q2 = survey.getQuestionByName("q2");
  assert.equal(q2.isVisible, false, "#1");
  q1.renderedValue = ["apple", "orange"];
  assert.deepEqual(q1.value, [{ fruit: "apple" }, { fruit: "orange" }], "q1.value. #1");
  assert.equal(q2.isVisible, true, "#2");
  q1.renderedValue = ["orange"];
  assert.deepEqual(q1.value, [{ fruit: "orange" }], "q1.value. #2");
  assert.equal(q2.isVisible, false, "#3");
});

QUnit.test("checkbox vs valuePropertyName & defaultValue, Bug#8973", (assert) => {
  const survey = new SurveyModel({
    storeOthersAsComment: false,
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        defaultValue: ["apple", "orange"]
      }
    ]
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q1.renderedValue = ["apple", "orange"];
  assert.deepEqual(q1.value, [{ fruit: "apple" }, { fruit: "orange" }], "q1.value");
});
QUnit.test("checkbox vs valuePropertyName & defaultValueExpression, Bug#8973", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        defaultValueExpression: "{q2}"
      },
      {
        type: "checkbox",
        name: "q2",
        choices: ["apple", "banana", "orange"]
      }
    ]
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  q2.renderedValue = ["apple", "orange"];
  assert.deepEqual(q2.value, ["apple", "orange"], "q2.value");
  assert.deepEqual(q1.value, [{ fruit: "apple" }, { fruit: "orange" }], "q1.value");
});
QUnit.test("checkbox vs valuePropertyName & setValueExpression, Bug#8973", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        valuePropertyName: "fruit",
        setValueExpression: "{q2}"
      },
      {
        type: "checkbox",
        name: "q2",
        choices: ["apple", "banana", "orange"]
      }
    ]
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  q2.renderedValue = ["apple", "orange"];
  assert.deepEqual(q2.value, ["apple", "orange"], "q2.value, #1");
  assert.deepEqual(q1.value, [{ fruit: "apple" }, { fruit: "orange" }], "q1.value, #2");
  q2.renderedValue = ["banana", "orange"];
  assert.deepEqual(q2.value, ["banana", "orange"], "q2.value, #2");
  assert.deepEqual(q1.value, [{ fruit: "banana" }, { fruit: "orange" }], "q1.value, #2");
});

QUnit.test("check radiogroup title actions", (assert) => {
  let survey = new SurveyModel({
    questions: [
      {
        type: "radiogroup",
        name: "q1",
        choices: ["Item 1"],
        allowClear: true
      }]
  });
  setOldTheme(survey);
  let question = <QuestionRadiogroupModel>survey.getAllQuestions()[0];
  assert.deepEqual(question.getTitleActions(), []);
  assert.ok(question.showClearButtonInContent);

  survey = new SurveyModel({
    questions: [
      {
        type: "radiogroup",
        name: "q1",
        choices: ["Item 1"],
        showClearButton: true
      }]
  });
  survey.css = defaultCss;
  question = <QuestionRadiogroupModel>survey.getAllQuestions()[0];
  const action = <IAction>question.getTitleActions()[0];
  assert.notOk(question.showClearButtonInContent);
  assert.equal(action.title, "Clear");
  assert.ok(action.visible);

  question.allowClear = false;
  assert.notOk(action.visible);
});

QUnit.test("checkbox and radio css", (assert) => {
  let survey = new SurveyModel({
    questions: [
      {
        type: "radiogroup",
        name: "q1",
        choices: ["Item 1"],
        showNoneItem: true
      },
      {
        type: "checkbox",
        name: "q2",
        choices: ["Item 1"],
        showClearButton: true,
        hasSelectAll: true,
        showNoneItem: true
      }]
  });
  let question1 = <QuestionRadiogroupModel>survey.getAllQuestions()[0];
  let question2 = <QuestionCheckboxModel>survey.getAllQuestions()[1];
  survey.css = {
    radiogroup: {
      root: "css-root",
      rootRow: "css-root-row"
    },
    checkbox: {
      root: "css-root",
      rootRow: "css-root-row"
    }
  };

  assert.equal(question1.getSelectBaseRootCss(), "css-root");
  assert.equal(question2.getSelectBaseRootCss(), "css-root");

  assert.deepEqual(question1.dataChoices.map((item) => item.id), ["Item 1"]);
  assert.deepEqual(question2.dataChoices.map((item) => item.id), ["Item 1"]);

  assert.deepEqual(question1.bodyItems.map((item) => item.id), ["Item 1", "none"]);
  assert.deepEqual(question2.bodyItems.map((item) => item.id), ["selectall", "Item 1", "none"]);

  assert.deepEqual(question1.rowLayout, false);
  assert.deepEqual(question2.rowLayout, false);

  question1.colCount = 0;
  question2.colCount = 0;

  assert.equal(question1.getSelectBaseRootCss(), "css-root css-root-row");
  assert.equal(question2.getSelectBaseRootCss(), "css-root css-root-row");

  assert.deepEqual(question1.dataChoices.map((item) => item.id), ["Item 1"]);
  assert.deepEqual(question2.dataChoices.map((item) => item.id), ["Item 1"]);

  assert.deepEqual(question1.bodyItems.map((item) => item.id), ["Item 1", "none"]);
  assert.deepEqual(question2.bodyItems.map((item) => item.id), ["selectall", "Item 1", "none"]);

  assert.deepEqual(question1.rowLayout, true);
  assert.deepEqual(question2.rowLayout, true);

  assert.deepEqual(question1.blockedRow, false);
  assert.deepEqual(question2.blockedRow, false);

  question1.separateSpecialChoices = true;
  question2.separateSpecialChoices = true;

  assert.equal(question1.getSelectBaseRootCss(), "css-root");
  assert.equal(question2.getSelectBaseRootCss(), "css-root");

  assert.deepEqual(question1.dataChoices.map((item) => item.id), ["Item 1"]);
  assert.deepEqual(question2.dataChoices.map((item) => item.id), ["Item 1"]);

  assert.deepEqual(question1.bodyItems.map((item) => item.id), ["Item 1"]);
  assert.deepEqual(question2.bodyItems.map((item) => item.id), ["Item 1"]);

  assert.deepEqual(question1.rowLayout, false);
  assert.deepEqual(question2.rowLayout, false);

  assert.deepEqual(question1.blockedRow, true);
  assert.deepEqual(question2.blockedRow, true);

  question1.separateSpecialChoices = false;
  question2.separateSpecialChoices = false;

  survey["_isDesignMode"] = true;

  assert.equal(question1.getSelectBaseRootCss(), "css-root");
  assert.equal(question2.getSelectBaseRootCss(), "css-root");

  assert.deepEqual(question1.dataChoices.map((item) => item.id), ["Item 1"]);
  assert.deepEqual(question2.dataChoices.map((item) => item.id), ["Item 1"]);

  assert.deepEqual(question1.bodyItems.map((item) => item.id), ["Item 1"]);
  assert.deepEqual(question2.bodyItems.map((item) => item.id), ["Item 1"]);

  assert.deepEqual(question1.rowLayout, false);
  assert.deepEqual(question2.rowLayout, false);

  assert.deepEqual(question1.blockedRow, true);
  assert.deepEqual(question2.blockedRow, true);
});
QUnit.test("autoOtherMode property, radiogroup", (assert) => {
  const question = new QuestionRadiogroupModel("q1");
  question.hasOther = true;
  question.choices = [1, 2, 3];
  question.autoOtherMode = true;
  assert.equal(question.isOtherSelected, false, "other is not selected by default");
  question.comment = "comment";
  assert.equal(question.isOtherSelected, true, "other is selected by setting comments");
  question.comment = "";
  assert.equal(question.isOtherSelected, false, "other is not selected by resetting comment");
  question.value = 1;
  question.comment = "comment";
  assert.equal(question.value, "other", "other is selected by setting comments, value");
  question.comment = "";
  assert.equal(question.value, undefined, "other is not selected by resetting comment, value");
  question.comment = "comment";
  question.value = 1;
  assert.equal(question.comment, "", "Clear comment on changing value");
  question.storeOthersAsComment = false;
  question.comment = "comment1";
  assert.equal(question.value, "comment1", "other is selected by setting comments, value + storeOthersAsComment");
  question.comment = "";
  assert.equal(question.value, undefined, "other is not selected by resetting comment, value + storeOthersAsComment");
});
QUnit.test("autoOtherMode property, checkbox", (assert) => {
  const survey = new SurveyModel();
  survey.addNewPage("p1");
  const question = new QuestionCheckboxModel("q1");
  survey.pages[0].addQuestion(question);
  question.hasOther = true;
  question.choices = [1, 2, 3];
  question.autoOtherMode = true;
  assert.equal(question.isOtherSelected, false, "other is not selected by default");
  question.comment = "comment";
  assert.equal(question.isOtherSelected, true, "other is selected by setting comments");
  question.comment = "";
  assert.equal(question.isOtherSelected, false, "other is not selected by resetting comment");
  question.value = [1, 3];
  question.comment = "comment";
  assert.deepEqual(question.value, [1, 3, "other"], "other is selected by setting comments, value");
  assert.deepEqual(survey.data, { q1: [1, 3, "other"], "q1-Comment": "comment" }, "survey: other is selected by setting comments, value");
  question.comment = "";
  assert.deepEqual(question.value, [1, 3], "other is not selected by resetting comment, value");
  assert.deepEqual(survey.data, { q1: [1, 3] }, "survey: other is not selected by resetting comment, value");
  question.storeOthersAsComment = false;
  question.comment = "comment1";
  assert.deepEqual(question.value, [1, 3, "comment1"], "other is selected by setting comments, value + storeOthersAsComment");
  assert.deepEqual(survey.data, { q1: [1, 3, "comment1"] }, "survey: other is selected by setting comments, value + storeOthersAsComment");
  question.comment = "";
  assert.deepEqual(question.value, [1, 3], "other is not selected by resetting comment, value + storeOthersAsComment");
  assert.deepEqual(survey.data, { q1: [1, 3] }, "survey: other is not selected by resetting comment, value + storeOthersAsComment");
});
QUnit.test("check locOwner for items", (assert) => {
  const question = new QuestionCheckboxModel("q1");
  question.choices = [1, 2, 3];
  question.autoOtherMode = true;
  assert.equal(question.noneItem.locText.owner, question.noneItem, "none text owner is none item");
  assert.equal(question.otherItem.locText.owner, question.otherItem, "other text owner is other item");
  assert.equal(question.selectAllItem.locText.owner, question.selectAllItem, "selectAll text owner is selectAll item");

  assert.equal(question.choices[0].locText.owner, question.choices[0], "item1 text owner is item1");
});

QUnit.test("check renamed has... properties", (assert) => {
  const question = new QuestionCheckboxModel("q1");
  assert.notOk(question.showNoneItem);
  assert.notOk(question.hasSelectAll);
  assert.notOk(question.hasOther);
  assert.notOk(question.hasComment);

  assert.notOk(question.showNoneItem);
  assert.notOk(question.showSelectAllItem);
  assert.notOk(question.showOtherItem);
  assert.notOk(question.showCommentArea);

  question.showNoneItem = true;
  assert.ok(question.showNoneItem);
  assert.ok(question.showNoneItem);
  question.showNoneItem = false;
  assert.notOk(question.showNoneItem);
  assert.notOk(question.showNoneItem);

  question.showSelectAllItem = true;
  assert.ok(question.showSelectAllItem);
  assert.ok(question.hasSelectAll);
  question.hasSelectAll = false;
  assert.notOk(question.showSelectAllItem);
  assert.notOk(question.hasSelectAll);

  question.showOtherItem = true;
  assert.ok(question.showOtherItem);
  assert.ok(question.hasOther);
  question.hasOther = false;
  assert.notOk(question.showOtherItem);
  assert.notOk(question.hasOther);

  question.showCommentArea = true;
  assert.ok(question.showCommentArea);
  assert.ok(question.hasComment);
  question.hasComment = false;
  assert.notOk(question.showCommentArea);
  assert.notOk(question.hasComment);
});
QUnit.test("checkbox selectAllItem isEnabled and maxSelectedChoices", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["apple", "banana", "orange"],
        "showSelectAllItem": true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(q.selectAllItem.isEnabled, true, "selectAllItem is enabled");
  q.maxSelectedChoices = 2;
  assert.equal(q.selectAllItem.isEnabled, false, "selectAllItem is disabled");
  q.maxSelectedChoices = 0;
  assert.equal(q.selectAllItem.isEnabled, true, "selectAllItem is enabled again");
});
QUnit.test("selectbase and otherValue/comment", (assert) => {
  const survey = new SurveyModel({ elements: [{ type: "dropdown", name: "q1", showOtherItem: true, choices: [1, 2, 3] }] });
  const question = <QuestionSelectBase>survey.getQuestionByName("q1");
  assert.notOk(question.otherValue, "otherValue, #1");
  assert.notOk(question.comment, "comment, #2");
  question.otherValue = "val1";
  assert.equal("val1", question.otherValue, "other value, #3");
  assert.equal("val1", question.comment, "comment, #4");
  question.comment = "val2";
  assert.equal("val2", question.otherValue, "other value, #5");
  assert.equal("val2", question.comment, "comment, #6");
  question.showCommentArea = true;
  assert.equal(true, question.showCommentArea, "showCommentArea is true");
  assert.equal(true, question.showOtherItem, "showOtherItem is true");
  assert.equal(false, question.getStoreOthersAsComment(), "getStoreOthersAsComment() is false");
  assert.notOk(question.otherValue, "other value, #7");
  assert.equal("val2", question.comment, "comment, #8");
  assert.notOk(question.selectedItem, "selectedItem #1");
  question.value = "other";
  question.otherValue = "val3";
  assert.equal("val3", question.otherValue, "other value, #9");
  assert.equal("val3", question.value, "question value, #10");
  assert.equal("val2", question.comment, "comment, #11");
  assert.equal(question.selectedItem.value, "other", "selectedItem #2");
  question.comment = "val4";
  assert.equal("val3", question.otherValue, "other value, #12");
  assert.equal("val3", question.value, "question value, #13");
  assert.equal(question.selectedItem.value, "other", "selectedItem #3");
  assert.equal("val4", question.comment, "comment, #14");

  question.otherValue = "";
  question.value = "other";
  assert.equal(true, question.isOtherSelected, "isOtherSelected, #1");
  assert.equal(question.selectedItem.value, "other", "selectedItem #4");
  assert.notOk(question.otherValue, "other value, #15");
  assert.equal(false, question.supportGoNextPageError(), "supportGoNextPageError, #1");
  question.comment = "";
  assert.equal(false, question.supportGoNextPageError(), "supportGoNextPageError, #2");
  question.otherValue = "val5";
  assert.equal(true, question.supportGoNextPageError(), "supportGoNextPageError, #3");

  question.comment = "test";
  survey.data = { q1: "val6" };
  assert.equal("val6", question.otherValue, "other value, #16");
  assert.equal("val6", question.value, "question value, #17");
  assert.equal("", question.comment, "comment, #18");
  assert.deepEqual(survey.data, { q1: "val6" }, "survey data, #1");

  question.showCommentArea = false;
  question.storeOthersAsComment = false;
  survey.data = { q1: "val7" };
  assert.equal("val7", question.otherValue, "other value, #19");
  assert.equal("val7", question.value, "question value, #20");
  assert.equal("val7", question.comment, "comment, #21");
  assert.equal(question.selectedItem.value, "other", "selectedItem #5");
  assert.deepEqual(survey.data, { q1: "val7" }, "survey data, #2");

  question.showCommentArea = true;
  question.value = "other";
  question.otherValue = " ";
  assert.equal(" ", question.otherValue, "other value, #22");
  assert.equal(question.selectedItem.value, "other", "selectedItem #6");
  assert.equal("other", question.value, "question value, #23");
  assert.equal("", question.comment, "comment, #24");
});
QUnit.test("selectbase and otherValue/comment + same values", (assert) => {
  const survey = new SurveyModel({ elements: [
    { type: "dropdown", name: "q1", showOtherItem: true, showCommentArea: true, choices: ["item1", "item2", "item3"] },
    { type: "checkbox", name: "q2", showOtherItem: true, showCommentArea: true, choices: ["item1", "item2", "item3"] }
  ] });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  q1.renderedValue = "other";
  q1.otherValue = " ";
  assert.equal("other", q1.value, "q1 value, #1");
  assert.equal(" ", q1.otherValue, "q1 otherValue, #2");
  q1.otherValue = "item2";
  assert.equal("other", q1.value, "q1 value, #3");
  assert.equal("item2", q1.otherValue, "q1 otherValue, #4");
  q1.otherValue = "item22";
  assert.equal("item22", q1.value, "q1 value, #5");
  assert.equal("item22", q1.otherValue, "q1 otherValue, #6");
  q2.renderedValue = ["other"];
  q2.otherValue = " ";
  assert.deepEqual(["other"], q2.value, "q2 value, #1");
  assert.equal(" ", q2.otherValue, "q2 otherValue, #2");
  q2.otherValue = "item3";
  assert.deepEqual(["other"], q2.value, "q2 value, #3");
  assert.equal("item3", q2.otherValue, "q2 otherValue, #4");
  q2.otherValue = "item33";
  assert.deepEqual(["item33"], q2.value, "q2 value, #5");
  assert.equal("item33", q2.otherValue, "q2 otherValue, #6");
});
QUnit.test("selectbase, showOtherItem & checkErrorsMode: 'onValueChanged'", (assert) => {
  const survey = new SurveyModel({ elements: [
    { type: "radiogroup", name: "q1", showOtherItem: true, choices: ["item1", "item2", "item3"] },
  ], checkErrorsMode: "onValueChanged" });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  q1.renderedValue = "other";
  assert.equal(q1.errors.length, 0, "We do not have errors yet");
  survey.tryComplete();
  assert.equal(q1.errors.length, 1, "There is an error");
  assert.equal(survey.state, "running", "Still running");
});
QUnit.test("selectbase, otherValue&question-Comment", (assert) => {
  const survey = new SurveyModel({ elements: [
    { type: "dropdown", name: "q1", showOtherItem: true, choices: ["item1", "item2", "item3"] },
    { type: "checkbox", name: "q2", showOtherItem: true, choices: ["item1", "item2", "item3"] }
  ] });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  q1.renderedValue = "other";
  q1.otherValue = "val1";
  q2.renderedValue = ["other"];
  q2.otherValue = "val2";
  const data = { q1: "other", "q1-Comment": "val1", q2: ["other"], "q2-Comment": "val2" };
  assert.deepEqual(survey.data, data, "before complete");
  survey.doComplete();
  assert.deepEqual(survey.data, data, "after complete");
});
QUnit.test("quesstion commentId/otherId", (assert) => {
  const q1 = new QuestionCheckboxModel("q1");
  assert.equal(q1.commentId, q1.id + "_comment", "Comment id");
  assert.equal(q1.otherId, q1.id + "_other", "Other id");
});
QUnit.test("selectbase, otherValue&question-Comment", (assert) => {
  const survey = new SurveyModel({ elements: [
    { type: "dropdown", name: "q1", showNoneItem: true, choices: [1, 2, 3], noneText: "Not Available" }
  ] });
  const q1 = <QuestionDropdownModel>survey.getQuestionByName("q1");
  q1.noneItem.value = "no value";
  const item = q1.dropdownListModel["listModel"].actions[3];
  assert.equal(item.id, "no value", "choice item is correct");
  q1.renderedValue = item.id;
  assert.equal(q1.isItemSelected(q1.noneItem), true, "non item is selected");
  survey.clearIncorrectValues();
  assert.equal(q1.value, "no value", "question value is correct");
  assert.deepEqual(survey.data, { q1: "no value" }, "survey.data is correct");
});
QUnit.test("SelectBase visibleChoices order", function (assert) {
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({ elements: [
    { type: "dropdown", name: "q1", choicesOrder: "asc", choices: ["B", "A", "D", "C"] }
  ] });
  const question = <QuestionSelectBase>survey.getQuestionByName("q1");
  assert.equal(question.visibleChoices.length, 7, "There are 4 items");
  assert.equal(question.visibleChoices[0].value, "B", "the first item");
  assert.equal(question.visibleChoices[3].value, "C", "the last item");
});
QUnit.test("choicesFromQuestion & showNoneItem", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3], showNoneItem: true },
      { type: "checkbox", name: "q2", choicesFromQuestion: "q1", showNoneItem: true },
      { type: "checkbox", name: "q3", choicesFromQuestion: "q1" },
    ],
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  const q3 = <QuestionCheckboxModel>survey.getQuestionByName("q3");
  assert.equal(q1.visibleChoices.length, 4, "q1 length");
  assert.equal(q2.visibleChoices.length, 4, "q2 length");
  assert.equal(q3.visibleChoices.length, 3, "q3 length");
  assert.equal(q1.visibleChoices[3].value, "none", "q1 none");
  assert.equal(q2.visibleChoices[3].value, "none", "q2 none");
});
QUnit.test("choicesFromQuestion & showOtherItem", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3], showOtherItem: true },
      { type: "checkbox", name: "q2", choicesFromQuestion: "q1", showOtherItem: true },
      { type: "checkbox", name: "q3", choicesFromQuestion: "q1" },
    ],
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q1.value = [1, 2, "other"];
  q1.comment = "other comment";
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  const q3 = <QuestionCheckboxModel>survey.getQuestionByName("q3");
  assert.equal(q1.visibleChoices.length, 4, "q1 length");
  assert.equal(q2.visibleChoices.length, 4, "q2 length");
  assert.equal(q3.visibleChoices.length, 3, "q3 length");
  assert.equal(q1.visibleChoices[3].value, "other", "q1 other");
  assert.equal(q2.visibleChoices[3].value, "other", "q2 other");
});
QUnit.test("choicesFromQuestion & showNoneItem & mode=selected", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3], showNoneItem: true },
      { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choicesFromQuestionMode: "selected", showNoneItem: true },
      { type: "checkbox", name: "q3", choicesFromQuestion: "q1", choicesFromQuestionMode: "selected" },
    ],
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  const q3 = <QuestionCheckboxModel>survey.getQuestionByName("q3");
  q1.value = [1, 2, 3];
  assert.equal(q2.visibleChoices.length, 4, "q2 length");
  assert.equal(q3.visibleChoices.length, 3, "q3 length");
  assert.equal(q2.visibleChoices[3].value, "none", "q2 none");
  q1.value = ["none"];
  assert.equal(q2.visibleChoices.length, 1, "q2 length, #1");
  assert.equal(q3.visibleChoices.length, 0, "q3 length, #2");
  assert.equal(q2.visibleChoices[0].value, "none", "q2 none");
});
QUnit.test("choicesFromQuestion & choicesVisibleIf", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3] },
      { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choicesVisibleIf: "{item} > 1" },
      { type: "checkbox", name: "q3", choicesFromQuestion: "q1", choicesVisibleIf: "{item} > 1", choicesFromQuestionMode: "selected" },
    ],
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  const q3 = <QuestionCheckboxModel>survey.getQuestionByName("q3");
  q1.value = [1, 2];
  assert.equal(q2.visibleChoices.length, 2, "q2 length");
  assert.equal(q2.visibleChoices[0].value, 2, "q2 choices[0]");
  assert.equal(q2.visibleChoices[1].value, 3, "q2 choices[1]");
  assert.equal(q3.visibleChoices.length, 1, "q3 length");
  assert.equal(q3.visibleChoices[0].value, 2, "q3 choices[0]");
  q1.value = [1, 2, 3];
  assert.equal(q2.visibleChoices.length, 2, "q2 length, #2");
  assert.equal(q2.visibleChoices[0].value, 2, "q2 choices[0], #2");
  assert.equal(q2.visibleChoices[1].value, 3, "q2 choices[1], #2");
  assert.equal(q3.visibleChoices.length, 2, "q3 length, #2");
  assert.equal(q3.visibleChoices[0].value, 2, "q3 choices[0], #2");
  assert.equal(q3.visibleChoices[1].value, 3, "q3 choices[1], #2");
});
QUnit.test("choicesFromQuestion & showOtherItem & mode=selected", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3], showOtherItem: true },
      { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choicesFromQuestionMode: "selected", showOtherItem: true },
      { type: "checkbox", name: "q3", choicesFromQuestion: "q1", choicesFromQuestionMode: "selected" },
    ],
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  const q3 = <QuestionCheckboxModel>survey.getQuestionByName("q3");
  q1.value = [1, 2, 3];
  assert.equal(q2.visibleChoices.length, 4, "q2 length");
  assert.equal(q3.visibleChoices.length, 3, "q3 length");
  assert.equal(q2.visibleChoices[3].value, "other", "q2 other");
  q1.value = [1, 2, 3, "other"];
  q1.comment = "other comment";
  assert.equal(q2.visibleChoices.length, 4, "q2 length");
  assert.equal(q3.visibleChoices.length, 4, "q3 length");
  assert.equal(q2.visibleChoices[3].value, "other", "q2 other");
  assert.equal(q3.visibleChoices[3].value, "other", "q3 other");
});
QUnit.test("Check isUsingCarryForward on changing question name", function (assert) {
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({ elements: [
    { type: "dropdown", name: "q1", choices: ["B", "A", "D", "C"] },
    { type: "dropdown", name: "q2", choicesFromQuestion: "q1" }
  ] });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  survey.onPropertyValueChangedCallback = (name: string, oldValue: any, newValue: any, target: any, arrayChanges: any) => {
    if(target === q1 && name === "name") {
      q2.choicesFromQuestion = newValue;
    }
  };
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set, #1");
  q1.name = "q111";
  assert.equal(q2.choicesFromQuestion, "q111", "property is updated with new question name");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set, #2");
});
QUnit.test("Carry Forward and localization, bug#6352", function (assert) {
  surveyLocalization.defaultLocale = "de";
  const survey = new SurveyModel({ locale: "en", elements: [
    { type: "dropdown", name: "q1", choices: [{ value: "A", text: { default: "A de", en: "A en" } }] },
    { type: "dropdown", name: "q2", choicesFromQuestion: "q1" }
  ] });
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.visibleChoices.length, 1);
  assert.deepEqual(q2.visibleChoices[0].locText.getJson(), { default: "A de", en: "A en" });
  assert.equal(q2.visibleChoices[0].text, "A en");
  let counter = 0;
  q2.visibleChoices[0].locText.onStringChanged.add((sender, options) => {
    counter ++;
  });
  survey.locale = "de";
  assert.equal(counter, 1, "Fire str changed");
  surveyLocalization.defaultLocale = "en";
});
QUnit.test("Carry Forward and keepIncorrectValues, bug#6490", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "dropdown", name: "q1", choices: ["A", "B", "C", "D"] },
    { type: "dropdown", name: "q2", choicesFromQuestion: "q1" }
  ] });
  survey.keepIncorrectValues = true;
  survey.data = { q1: "A", q2: "X" };
  const q1 = survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  q1.value = "B";
  assert.equal(q2.value, "X", "keep value");
  survey.doComplete();
  assert.deepEqual(survey.data, { q1: "B", q2: "X" }, "keep value on compete");
});
QUnit.test("Check isUsingCarryForward on deleting question", function (assert) {
  const survey = new SurveyModel();
  const defaultValueProp = Serializer.findProperty("dropdown", "defaultValue");
  const correctAnswerProp = Serializer.findProperty("dropdown", "correctAnswer");
  survey.setDesignMode(true);
  survey.fromJSON({ elements: [
    { type: "dropdown", name: "q1", choices: ["B", "A", "D", "C"] },
    { type: "dropdown", name: "q2", choicesFromQuestion: "q1" }
  ] });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "q1", "set correctly");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set");
  assert.equal(defaultValueProp.isVisible("", q2), false, "defaultValueProp.isVisible #1");
  assert.equal(correctAnswerProp.isVisible("", q2), false, "correctAnswerProp.isVisible #1");

  q1.delete();
  assert.notOk(q2.choicesFromQuestion, "it is empty");
  assert.equal(q2.isUsingCarryForward, false, "Carryforward flag is unset");
  assert.equal(defaultValueProp.isVisible("", q2), true, "defaultValueProp.isVisible #2");
  assert.equal(correctAnswerProp.isVisible("", q2), true, "correctAnswerProp.isVisible #2");
});
QUnit.test("Do not notify survey on changing newItem.value", function (
  assert
) {

  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({
    elements: [{ type: "checkbox", name: "q", choices: [1] }]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q");
  assert.equal(q.visibleChoices.length, 1 + 4, "#0");
  let counter = 0;
  survey.onPropertyValueChangedCallback = (
    name: string,
    oldValue: any,
    newValue: any,
    sender: Base,
    arrayChanges: any
  ) => {
    counter++;
  };
  assert.equal(counter, 0, "#1");
  q.choices[0].value = 2;
  assert.equal(counter, 1, "#2");
  q.selectAllItem.text = "Sel";
  assert.equal(counter, 2, "#3");
  q.newItem.text = "item 2";
  assert.equal(counter, 2, "Do not react on newItem properties changes, #4");
});
QUnit.test("Remove newItem from the list if it is false", function (
  assert
) {

  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({
    elements: [{ type: "checkbox", name: "q", choices: [1] }]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q");
  assert.equal(q.visibleChoices.length, 1 + 4, "#1");
  q.newItem.setIsVisible(false);
  assert.equal(q.visibleChoices.length, 1 + 3, "#2");
  q.newItem.setIsVisible(true);
  assert.equal(q.visibleChoices.length, 1 + 4, "#3");
});
QUnit.test("displayValue & otherItem", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "dropdown", name: "q1", choices: [1], hasOther: true },
      { type: "checkbox", name: "q2", choices: [1], hasOther: true }
    ]
  });
  const q1 = <QuestionDropdownModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  q1.value = "other";
  assert.equal(q1.displayValue, "Other (describe)", "#1");
  q1.comment = "Some comments";
  assert.equal(q1.displayValue, "Some comments", "#2");
  q2.value = ["other", 1];
  q2.comment = "";
  assert.equal(q2.displayValue, "Other (describe), 1", "#3");
  q2.comment = "Some comments";
  assert.equal(q2.displayValue, "Some comments, 1", "#4");
});
QUnit.test("Use carryForward with matrix dynamic", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "matrixdynamic", name: "q1", columns: [{ name: "col1", cellType: "text" }] },
    { type: "checkbox", name: "q2", choicesFromQuestion: "q1" }
  ] });
  const q1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "q1", "choicesFromQuestion is set");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set");
  assert.equal(q2.visibleChoices.length, 0, "There is no choices");
  assert.equal(q2.visibleChoices.length, 0, "There is no choices, row is empty");
  q1.visibleRows[0].cells[0].value = "A";
  assert.deepEqual(survey.data, { q1: [{ col1: "A" }, {}] }, "survey.data is correct");
  assert.equal(q2.visibleChoices.length, 1, "There is one choice");
  assert.equal(q2.visibleChoices[0].value, "A", "the first value is correct");
  q1.visibleRows[1].cells[0].value = "B";
  assert.equal(q2.visibleChoices.length, 2, "There are two choice");
  assert.equal(q2.visibleChoices[1].value, "B", "the second value is correct");
  q1.addRow();
  assert.equal(q2.visibleChoices.length, 2, "There are two choice, new row is empty");
  q1.visibleRows[2].cells[0].value = "C";
  assert.deepEqual(survey.data, { q1: [{ col1: "A" }, { col1: "B" }, { col1: "C" }] }, "survey.data is correct, #2");
  assert.equal(q2.visibleChoices.length, 3, "There are three choice");
  assert.equal(q2.visibleChoices[2].value, "C", "the third value is correct");
});

QUnit.test("Use carryForward with matrix dynamic + choiceValuesFromQuestion", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "matrixdynamic", name: "q1", columns: [{ name: "col1", cellType: "text" }, { name: "col2", cellType: "text" }] },
    { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choiceValuesFromQuestion: "col2" }
  ] });
  const q1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "q1", "choicesFromQuestion is set");
  assert.equal(q2.choiceValuesFromQuestion, "col2", "choiceValuesFromQuestion is set");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set");
  assert.equal(q2.visibleChoices.length, 0, "There is no choices");
  assert.equal(q2.visibleChoices.length, 0, "There is no choices, row is empty");
  q1.visibleRows[0].cells[0].value = "A";
  assert.equal(q2.visibleChoices.length, 0, "There is no choices, col2 is empty");
  q1.visibleRows[0].cells[1].value = "AA";
  assert.equal(q2.visibleChoices.length, 1, "There is one choice");
  assert.equal(q2.visibleChoices[0].value, "AA", "the first value is correct");
  q1.visibleRows[1].cells[0].value = "B";
  q1.visibleRows[1].cells[1].value = "BB";
  assert.equal(q2.visibleChoices.length, 2, "There are two choice");
  assert.equal(q2.visibleChoices[1].value, "BB", "the second value is correct");
  q1.addRow();
  assert.equal(q2.visibleChoices.length, 2, "There are two choice, new row is empty");
  q1.visibleRows[2].cells[0].value = "C";
  assert.equal(q2.visibleChoices.length, 2, "There are two choice, col2 is empty");
  q1.visibleRows[2].cells[1].value = "CC";
  assert.equal(q2.visibleChoices.length, 3, "There are three choice");
  assert.equal(q2.visibleChoices[2].value, "CC", "the third value is correct");
});
QUnit.test("Use carryForward with panel dynamic + choiceValuesFromQuestion&choiceTextsFromQuestion", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "paneldynamic", name: "q1", panelCount: 2,
      templateElements: [{ name: "q1-q1", type: "text" }, { name: "q1-q2", type: "text" }, { name: "q1-q3", type: "text" }]
    },
    { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choiceValuesFromQuestion: "q1-q2", choiceTextsFromQuestion: "q1-q3" }
  ] });
  const q1 = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "q1", "choicesFromQuestion is set");
  assert.equal(q2.choiceValuesFromQuestion, "q1-q2", "choiceValuesFromQuestion is set");
  assert.equal(q2.choiceTextsFromQuestion, "q1-q3", "choiceTextsFromQuestion is set");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set");
  assert.equal(q2.visibleChoices.length, 0, "There is no choices");
  q1.panels[0].getQuestionByName("q1-q1").value = "A";
  assert.equal(q2.visibleChoices.length, 0, "There is no choices, q1-q2 is empty");
  q1.panels[0].getQuestionByName("q1-q2").value = "AA";
  q1.panels[0].getQuestionByName("q1-q3").value = "AA-aa";
  assert.equal(q2.visibleChoices.length, 1, "There is one choice");
  assert.equal(q2.visibleChoices[0].value, "AA", "the first value is correct");
  assert.equal(q2.visibleChoices[0].text, "AA-aa", "the first text is correct");
  q1.panels[1].getQuestionByName("q1-q1").value = "B";
  q1.panels[1].getQuestionByName("q1-q2").value = "BB";
  q1.panels[1].getQuestionByName("q1-q3").value = "BB-bb";
  assert.equal(q2.visibleChoices.length, 2, "There are two choice");
  assert.equal(q2.visibleChoices[1].value, "BB", "the second value is correct");
  assert.equal(q2.visibleChoices[1].text, "BB-bb", "the second text is correct");
  q1.addPanel();
  assert.equal(q2.visibleChoices.length, 2, "There are two choice, new panel is empty");
  q1.panels[2].getQuestionByName("q1-q1").value = "C";
  assert.equal(q2.visibleChoices.length, 2, "There are two choice, q1-q2 is empty");
  q1.panels[2].getQuestionByName("q1-q2").value = "CC";
  q1.panels[2].getQuestionByName("q1-q3").value = "CC-cc";
  assert.equal(q2.visibleChoices.length, 3, "There are three choice");
  assert.equal(q2.visibleChoices[2].value, "CC", "the third value is correct");
  assert.equal(q2.visibleChoices[2].text, "CC-cc", "the third text is correct");
});
QUnit.test("Check isUsingCarryForward on deleting matrix dynamic question", function (assert) {
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({ elements: [
    { type: "matrixdynamic", name: "q1" },
    { type: "dropdown", name: "q2", choicesFromQuestion: "q1" }
  ] });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "q1", "set correctly");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set");
  q1.delete();
  assert.notOk(q2.choicesFromQuestion, "it is empty");
  assert.equal(q2.isUsingCarryForward, false, "Carryforward flag is unset");
});
QUnit.test("Check isUsingCarryForward on deleting matrix dynamic question with doDispose = false parameter", function (assert) {
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({ elements: [
    { type: "matrixdynamic", name: "q1" },
    { type: "dropdown", name: "q2", choicesFromQuestion: "q1" }
  ] });
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "q1", "set correctly");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set");
  q1.delete(false);
  assert.notOk(q2.choicesFromQuestion, "it is empty");
  assert.equal(q2.isUsingCarryForward, false, "Carryforward flag is unset");
});
QUnit.test("Use carryForward with panel dynamic + update data on survey.data=data;", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choiceValuesFromQuestion: "q1-q2", choiceTextsFromQuestion: "q1-q3" },
    { type: "paneldynamic", name: "q1", panelCount: 2,
      templateElements: [{ name: "q1-q1", type: "text" }, { name: "q1-q2", type: "text" }, { name: "q1-q3", type: "text" }]
    }
  ] });
  const q1 = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  survey.data = { q1: [{ "q1-q2": 1, "q1-q3": "Item 1" }, { "q1-q2": 2, "q1-q3": "Item 2" }] };
  assert.equal(q2.visibleChoices.length, 2, "Create choices");
  assert.equal(q2.visibleChoices[0].value, 1, "the first value is correct");
  assert.equal(q2.visibleChoices[0].text, "Item 1", "the first text is correct");
  assert.equal(q2.visibleChoices[1].value, 2, "the second value is correct");
  assert.equal(q2.visibleChoices[1].text, "Item 2", "the second text is correct");
});
QUnit.test("Use carryForward with matrix dynamic & choicesVisibleIf", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "matrixdynamic", name: "q1", columns: [{ name: "col1", cellType: "text" }] },
    { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choicesVisibleIf: "{item} != 'A'" }
  ] });
  const q1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionSelectBase>survey.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "q1", "choicesFromQuestion is set");
  assert.equal(q2.isUsingCarryForward, true, "Carryforward flag is set");
  assert.equal(q2.visibleChoices.length, 0, "There is no choices");
  assert.equal(q2.visibleChoices.length, 0, "There is no choices, row is empty");
  q1.visibleRows[0].cells[0].value = "A";
  assert.deepEqual(survey.data, { q1: [{ col1: "A" }, {}] }, "survey.data is correct");
  assert.equal(q2.visibleChoices.length, 0, "There is one choice, filtering");
  q1.visibleRows[1].cells[0].value = "B";
  assert.equal(q2.visibleChoices.length, 1, "There is one choice");
  assert.equal(q2.visibleChoices[0].value, "B", "the second value is correct");
  q1.addRow();
  assert.equal(q2.visibleChoices.length, 1, "There is one choice, new row is empty");
  q1.visibleRows[2].cells[0].value = "C";
  assert.deepEqual(survey.data, { q1: [{ col1: "A" }, { col1: "B" }, { col1: "C" }] }, "survey.data is correct, #2");
  assert.equal(q2.visibleChoices.length, 2, "There are three choice");
  assert.equal(q2.visibleChoices[1].value, "C", "the third value is correct");
});

QUnit.test("Allow to override default value fro choicesByUrl.path Bug#6766", function (assert) {
  const prop = Serializer.findProperty("choicesByUrl", "path");
  prop.defaultValue = "list";
  const q1 = new QuestionDropdownModel("q1");
  assert.equal(q1.choicesByUrl.path, "list", "get new default value for path");
  prop.defaultValue = undefined;
});
QUnit.test("Infinitive loop error by using carryForward, Bug#8232", function (assert) {
  const survey = new SurveyModel({ elements: [
    {
      type: "checkbox",
      name: "q1",
      visibleIf: "{q1} notempty",
      choices: [{ value: 1, text: "Item 1" }, { value: 2, text: "Item 2" }, { value: 3, text: "Item 3" },
        { value: 4, text: "Item 4" }, { value: 5, text: "Item 5" }],
      choicesFromQuestionMode: "selected",
      hideIfChoicesEmpty: true,
    },
    {
      type: "checkbox",
      name: "q2",
      choicesFromQuestion: "q1",
      choicesFromQuestionMode: "unselected",
      hideIfChoicesEmpty: true,
    }],
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.ok(q1, "q1 exists");
  assert.ok(q2, "q2 exists");
  assert.equal(q1.visibleChoices.length, 5, "q1.visibleChoices");
  assert.equal(q2.visibleChoices.length, 5, "q2.visibleChoices");
  assert.equal(q2.isVisible, true, "q2 is visible");
});
QUnit.test("Change carryForwardQuestionType to let question banner in creator that something is changed, Bug#5495-in-Creator", function (assert) {
  const survey = new SurveyModel({ elements: [
    {
      type: "checkbox",
      name: "q1",
    },
    {
      type: "checkbox",
      name: "q2",
    },
    {
      type: "checkbox",
      name: "q3",
      choicesFromQuestion: "q1"
    }],
  });
  survey.setDesignMode(true);
  const q3 = <QuestionCheckboxModel>survey.getQuestionByName("q3");
  let counterOn = 0;
  let counterOff = 0;
  q3.registerFunctionOnPropertyValueChanged("carryForwardQuestionType", () => {
    if(q3.isUsingCarryForward) {
      counterOn++;
    } else {
      counterOff ++;
    }
  });
  q3.choicesFromQuestion = "q2";
  assert.equal(counterOn, 1, "counterOn #1");
  assert.equal(counterOff, 1, "counterOff #1");
  q3.choicesFromQuestion = "q1";
  assert.equal(counterOn, 2, "counterOn #2");
  assert.equal(counterOff, 2, "counterOff #2");
  survey.setDesignMode(false);
  q3.choicesFromQuestion = "q2";
  assert.equal(counterOn, 2, "counterOn #3");
  assert.equal(counterOff, 2, "counterOff #3");
  q3.choicesFromQuestion = "";
  survey.setDesignMode(false);
  q3.choicesFromQuestion = "q2";
  counterOn = 0;
  counterOff = 0;
  assert.equal(counterOn, 0, "counterOn #4");
  assert.equal(counterOff, 0, "counterOff #4");
});
QUnit.test("Use carryForward with panel dynamic + choiceValuesFromQuestion + valueName, Bug#6948-1", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "paneldynamic", name: "q1", valueName: "sharedData",
      templateElements: [{ name: "q1-q1", type: "text" }]
    },
    { type: "checkbox", name: "q2", choicesFromQuestion: "q1", choiceValuesFromQuestion: "q1-q1" }
  ] });
  const q1 = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  q1.addPanel();
  q1.panels[0].getQuestionByName("q1-q1").value = "aaa";
  q1.addPanel();
  q1.panels[1].getQuestionByName("q1-q1").value = "bbb";
  assert.equal(q2.visibleChoices.length, 2, "There are two choice");
  assert.equal(q2.visibleChoices[0].value, "aaa", "the first value is correct");
  assert.equal(q2.visibleChoices[1].value, "bbb", "the second value is correct");
});

QUnit.test("Use carryForward with panel dynamic + choiceValuesFromQuestion + removing the value, Bug#9399", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "paneldynamic", name: "q1", valueName: "sharedData",
      templateElements: [{ name: "q1-q1", type: "text" }]
    },
    { type: "dropdown", name: "q2", choicesFromQuestion: "q1", choiceValuesFromQuestion: "q1-q1" }
  ] });
  const q1 = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  q1.addPanel();
  q1.panels[0].getQuestionByName("q1-q1").value = "aaa";
  q1.addPanel();
  q1.panels[1].getQuestionByName("q1-q1").value = "bbb";
  assert.equal(q2.visibleChoices.length, 2, "There are two choices");
  q2.value = "bbb";
  assert.equal(q2.isEmpty(), false, "q2 is not empty");
  q1.removePanel(1);
  assert.equal(q2.visibleChoices.length, 1, "There is one choice");
  assert.equal(q2.isEmpty(), true, "q2 is empty");
});

QUnit.test("Use carryForward with panel dynamic + choiceValuesFromQuestion + valueName, Bug#6948-2", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "paneldynamic", name: "q1", valueName: "sharedData",
      templateElements: [{ name: "q1-q1", type: "text" }]
    },
    { type: "paneldynamic", name: "q2", valueName: "sharedData",
      templateElements: [{ name: "q2-q2", type: "checkbox", choicesFromQuestion: "q1", choiceValuesFromQuestion: "q1-q1" }]
    }
  ] });
  const q1 = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  const q2 = <QuestionPanelDynamicModel>survey.getQuestionByName("q2");
  q1.addPanel();
  q1.panels[0].getQuestionByName("q1-q1").value = "aaa";
  q1.addPanel();
  q1.panels[1].getQuestionByName("q1-q1").value = "bbb";
  const q2_q2 = q2.panels[0].getQuestionByName("q2-q2");
  assert.equal(q2_q2.visibleChoices.length, 2, "There are two choice");
  assert.equal(q2_q2.visibleChoices[0].value, "aaa", "the first value is correct");
  assert.equal(q2_q2.visibleChoices[1].value, "bbb", "the second value is correct");
});
QUnit.test("Use carryForward with panel dynamic + incorrect values, Bug#9478", function (assert) {
  const survey = new SurveyModel({ pages: [
    {
      elements: [
        {
          type: "paneldynamic",
          name: "question1",
          templateElements: [
            {
              type: "text",
              name: "question2",
            },
          ],
        },
      ],
    },
    {
      elements: [
        {
          type: "paneldynamic",
          name: "question4",
          templateElements: [
            {
              type: "paneldynamic",
              name: "question5",
              templateElements: [
                {
                  type: "dropdown",
                  name: "question3",
                  isRequired: true,
                  choicesFromQuestion: "question1",
                  choiceValuesFromQuestion: "question2",
                  choiceTextsFromQuestion: "question2",
                },
                {
                  type: "text",
                  name: "question11",
                  defaultValueExpression: "{panel.question3} empty",
                },
              ],
            },
          ],
          panelCount: 1,
        },
      ],
    },
  ] });
  survey.data = {
    "question1": [
      {
        "question2": "Item1*"
      },
      {
        "question2": "Item2*"
      }
    ],
    "question4": [
      {
        "question5": [
          {
            "question11": false,
            "question3": "Item2"
          }
        ]
      }
    ]
  };
  survey.nextPage();
  assert.equal(survey.tryComplete(), false, "The value is incorrect");
});
QUnit.test("SelectBase visibleChoices order & locale change", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "dropdown", name: "q1", choicesOrder: "asc",
      choices: [{ value: "A", text: { default: "AA", de: "BAA" } },
        { value: "B", text: { default: "BB", de: "ABB" } }] }
  ] });
  const question = <QuestionSelectBase>survey.getQuestionByName("q1");
  assert.equal(question.visibleChoices.length, 2, "There are 4 items");
  assert.equal(question.visibleChoices[0].value, "A", "the first item");
  assert.equal(question.visibleChoices[1].value, "B", "the second item");
  survey.locale = "de";
  assert.equal(question.choicesOrder, "asc", "The order is correct");
  assert.equal(question.getLocale(), "de", "question locale is correct");
  assert.equal(question.choices[0].calculatedText, "BAA", "the first item calculatedText, de");
  assert.equal(question.choices[1].calculatedText, "ABB", "the second item calculatedText, de");
  assert.equal(question.choices[0].getLocale(), "de", "ItemValue locText locale is correct");
  assert.equal(question.visibleChoices[0].value, "B", "the first item, de");
  assert.equal(question.visibleChoices[1].value, "A", "the second item, de");
  assert.equal(question.visibleChoices[0].calculatedText, "ABB", "the first visible item calculatedText, de");
  assert.equal(question.visibleChoices[1].calculatedText, "BAA", "the second visible item calculatedText, de");
});
QUnit.test("SelectBase visibleChoices for selectAll, none and showOtherItem", function (assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1", choices: ["a", "b", "c"], showSelectAllItem: true, showNoneItem: true, showOtherItem: true }
  ] };
  const survey = new SurveyModel(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  let choices = question.visibleChoices;
  assert.equal(choices.length, 6, "6 items, #1");
  assert.equal(choices[0].id, "selectall", "all index #1");
  assert.equal(choices[4].value, "none", "none index #1");
  assert.equal(choices[5].value, "other", "other index #1");

  settings.specialChoicesOrder.noneItem = [5];
  question.showNoneItem = false;
  question.showNoneItem = true;
  choices = question.visibleChoices;
  assert.equal(choices.length, 6, "6 items, #2");
  assert.equal(choices[0].id, "selectall", "all index #2");
  assert.equal(choices[4].value, "other", "other index #2");
  assert.equal(choices[5].value, "none", "none index #2");

  settings.specialChoicesOrder.noneItem = [-5, 5];
  question.showNoneItem = false;
  question.showNoneItem = true;
  choices = question.visibleChoices;
  assert.equal(choices.length, 7, "7 items, #3");
  assert.equal(choices[0].value, "none", "none index (up) #3");
  assert.equal(choices[1].id, "selectall", "all index #3");
  assert.equal(choices[5].value, "other", "other index #3");
  assert.equal(choices[6].value, "none", "none index (bottom) #3");

  settings.specialChoicesOrder.selectAllItem = [-1];
  settings.specialChoicesOrder.noneItem = [1];
  settings.specialChoicesOrder.otherItem = [4];
});
QUnit.test("Double noneItem and SelectAllItem", function (assert) {
  settings.specialChoicesOrder.noneItem = [-3, 3];
  const json = { elements: [
    { type: "checkbox", name: "q1", choices: ["a", "b", "c"], showSelectAllItem: true, showNoneItem: true, showOtherItem: true }
  ] };
  const survey = new SurveyModel(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  question.selectAll();
  assert.equal(question.isItemSelected(question.selectAllItem), true, "Select Item is selected");
  assert.equal(question.isAllSelected, true, "isAllSelected #1");
  question.value = ["a", "b"];
  assert.equal(question.isItemSelected(question.selectAllItem), false, "Select Item is not selected");
  assert.equal(question.isAllSelected, false, "isAllSelected #2");
  settings.specialChoicesOrder.selectAllItem = [-1];
  settings.specialChoicesOrder.noneItem = [1];
  settings.specialChoicesOrder.otherItem = [2];
});
QUnit.test("Double noneItem & selectAllItem and headItems/footItems", function (assert) {
  settings.specialChoicesOrder.noneItem = [-2, 4];
  settings.specialChoicesOrder.selectAllItem = [-2, 3];
  const json = { elements: [
    { type: "checkbox", name: "q1", choices: ["a", "b", "c"], showSelectAllItem: true, showNoneItem: true, showOtherItem: true }
  ] };
  const survey = new SurveyModel(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  question.separateSpecialChoices = true;

  assert.equal(question.visibleChoices.length, 8, "There are 8 items");
  assert.equal(question.headItems.length, 2, "There are two items in head items");
  assert.equal(question.headItems[0].value, "none", "head none");
  assert.equal(question.headItems[1].id, "selectall", "head selectall");
  assert.equal(question.footItems.length, 3, "There are three items in footer items");
  assert.equal(question.footItems[0].value, "other", "foot other");
  assert.equal(question.footItems[1].id, "selectall", "foot selectall");
  assert.equal(question.footItems[2].value, "none", "foot none");

  settings.specialChoicesOrder.selectAllItem = [-1];
  settings.specialChoicesOrder.noneItem = [1];
  settings.specialChoicesOrder.otherItem = [2];
});
QUnit.test("Select all disable/enabled", function (assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1",
      choices: [{ value: "a", visibleIf: "{val1}=1" }, { value: "b", enableIf: "{val2}=1" }],
      showSelectAllItem: true, showNoneItem: true }
  ] };
  const survey = new SurveyModel(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const selectAll = question.selectAllItem;
  assert.equal(selectAll.isEnabled, false, "#1");
  assert.equal(question.isItemSelected(selectAll), false, "#1.1");
  survey.setVariable("val1", 1);
  assert.equal(selectAll.isEnabled, true, "#2");
  assert.equal(question.isItemSelected(selectAll), false, "#2.1");
  survey.setVariable("val1", 2);
  assert.equal(selectAll.isEnabled, false, "#3");
  assert.equal(question.isItemSelected(selectAll), false, "#3.1");
  survey.setVariable("val2", 1);
  assert.equal(selectAll.isEnabled, true, "#4");
  assert.equal(question.isItemSelected(selectAll), false, "#4.1");
  survey.setVariable("val2", 2);
  assert.equal(selectAll.isEnabled, false, "#5");
  assert.equal(question.isItemSelected(selectAll), false, "#5.1");
});
QUnit.test("question.selectAll() disable/enabled and visible", function (assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1",
      choices: [{ value: "a", visibleIf: "{val1}=1" }, { value: "b", enableIf: "{val2}=1" }, "c"],
      showSelectAllItem: true, showNoneItem: true }
  ] };
  const survey = new SurveyModel(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const selectAll = question.selectAllItem;
  assert.equal(question.isItemSelected(selectAll), false, "#1.1");
  question.selectAll();
  assert.deepEqual(question.value, ["c"], "#1.2");
  assert.equal(question.isItemSelected(selectAll), true, "#1.3");

  survey.setVariable("val1", 1);
  assert.equal(question.isItemSelected(selectAll), false, "#2.1");
  question.selectAll();
  assert.deepEqual(question.value, ["a", "c"], "#2.2");
  assert.equal(question.isItemSelected(selectAll), true, "#2.3");

  survey.setVariable("val2", 1);
  assert.equal(question.isItemSelected(selectAll), false, "#3.1");
  question.selectAll();
  assert.deepEqual(question.value, ["a", "b", "c"], "#3.2");
  assert.equal(question.isItemSelected(selectAll), true, "#3.3");
});
QUnit.test("Select all disable/enabled showOtherItem=true", function (assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1", showSelectAllItem: true, showOtherItem: true }
  ] };
  const survey = new SurveyModel(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const selectAll = question.selectAllItem;
  assert.equal(selectAll.isEnabled, false, "#1");
  assert.equal(question.isItemSelected(selectAll), false, "#2");
});
QUnit.test("Select all and clickItemHandler", function (assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1", choices: [1, 2, 3], showSelectAllItem: true }
  ] };
  const survey = new SurveyModel(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(question.selectAllItem.value, "", "select all equals empty value");
  assert.equal(question.isAllSelected, false, "#1");
  question.clickItemHandler(question.selectAllItem, true);
  assert.equal(question.isAllSelected, true, "#2");
  question.clickItemHandler(question.selectAllItem, false);
  assert.equal(question.isAllSelected, false, "#3");
  question.clickItemHandler(question.selectAllItem);
  assert.equal(question.isAllSelected, true, "#4");
  question.clickItemHandler(question.selectAllItem);
  assert.equal(question.isAllSelected, false, "#5");
});
QUnit.test("Test dropdown in CreatorV2 & restful", function (assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] }
  ] };
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(question.isUsingRestful, false, "isUsingRestful #1");
  assert.equal(question.visibleChoices.length, 3 + 5 + 1, "3 built-in + 5 choices + 1 add item, #1");
  question.choicesByUrl.url = "test_url";
  assert.equal(question.isUsingRestful, true, "isUsingRestful #2");
  assert.equal(question.visibleChoices.length, 3, "3 built-in + do not show default choices, #2");
  question.choicesByUrl.url = "";
  assert.equal(question.isUsingRestful, false, "isUsingRestful #3");
  assert.equal(question.visibleChoices.length, 3 + 5 + 1, "3 built-in + 5 choices + 1 add item, #3");
});
QUnit.test("isUsingRestful & loading", function(assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1", choicesByUrl: { url: "abc" } },
    { type: "checkbox", name: "q2" }
  ] };
  const survey = new SurveyModel(json);
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const q2 = <QuestionCheckboxModel>survey.getQuestionByName("q2");
  assert.equal(q1.isUsingRestful, true, "q1 #1");
  assert.equal(q2.isUsingRestful, false, "q2 #1");
  q1.choicesByUrl.url = "";
  assert.equal(q1.isUsingRestful, false, "q1 #2");
  q1.choicesByUrl.url = "edf";
  assert.equal(q1.isUsingRestful, true, "q1 #3");
});
QUnit.test("checkbox max(min)SelectedChoices validation", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1"
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.minSelectedChoices = 10;
  assert.equal(q.minSelectedChoices, 10, "q.minSelectedChoices, #1");
  q.maxSelectedChoices = 5;
  assert.equal(q.maxSelectedChoices, 10, "q.maxSelectedChoices, #2");
  q.minSelectedChoices = 20;
  assert.equal(q.minSelectedChoices, 10, "q.minSelectedChoices, #3");
  q.maxSelectedChoices = 0;
  q.minSelectedChoices = 20;
  assert.equal(q.minSelectedChoices, 20, "q.minSelectedChoices, #4");
  q.minSelectedChoices = 0;
  q.maxSelectedChoices = 5;
  assert.equal(q.maxSelectedChoices, 5, "q.maxSelectedChoices, #5");
});
QUnit.test("checkbox, selectAll & survey.data, bug#7657", (assert) => {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "checkbox",
        "name": "q1",
        "isRequired": true,
        "choices": [
          "One",
          "Two",
          "Three"
        ],
        "showNoneItem": true,
        "showSelectAllItem": true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.selectAll();
  q.clickItemHandler(q.choices[2]);
  assert.deepEqual(q.value, ["One", "Two"], "q.value, #1");
  assert.deepEqual(survey.data, { q1: ["One", "Two"] }, "survey.data, #1");
  survey.doComplete();
  assert.deepEqual(q.value, ["One", "Two"], "q.value, #2");
  assert.deepEqual(survey.data, { q1: ["One", "Two"] }, "survey.data, #2");
});
QUnit.test("Do not show show choices in designer", function (assert) {
  const json = { elements: [
    { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] }
  ] };
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON(json);
  const question = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(question.visibleChoices.length, 5 + 1 + 3, "Show choices in designer, #1");
  question.isMessagePanelVisible = true;
  assert.equal(question.visibleChoices.length, 3, "Hide choices in designer, #2");
  question.isMessagePanelVisible = false;
  assert.equal(question.visibleChoices.length, 5 + 1 + 3, "Show choices in designer, #1");
});
QUnit.test("question checkbox displayValue() with other and comment", (assert) => {
  const q1 = new QuestionCheckboxModel("q1");
  q1.fromJSON({
    "type": "checkbox",
    "name": "q1",
    "showCommentArea": true,
    "commentText": "Comment",
    "choices": [
      "Item 1",
      "Item 2",
      "Item 3"
    ],
    "showOtherItem": true
  });
  q1.value = ["Item 1", "Item 2", "Other Value"];
  assert.deepEqual(q1.displayValue, "Item 1, Item 2, Other Value", "Other value should be kept");
});

QUnit.test("checkbox with incorrect defaultValue, other & survey.data Bug#7943", (assert) => {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "checkbox",
        "name": "q1",
        "defaultValue": [
          "101"
        ],
        "choices": [1, 2],
        "showOtherItem": true,
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.deepEqual(q.value, ["other"], "q.value");
  assert.equal(q.comment, "101", "q.comment");
  assert.deepEqual(survey.data, { q1: ["other"], "q1-Comment": "101" }, "survey.data");
  survey.doComplete(false);
  assert.deepEqual(survey.data, { q1: ["other"], "q1-Comment": "101" }, "survey.data");
});
QUnit.test("radiogroup with incorrect defaultValue, other & survey.data Bug#7943", (assert) => {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "radiogroup",
        "name": "q1",
        "defaultValue": [
          "101"
        ],
        "choices": [1, 2],
        "showOtherItem": true,
      }
    ]
  });
  const q = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  assert.deepEqual(q.value, "other", "q.value");
  assert.equal(q.comment, "101", "q.comment");
  assert.deepEqual(survey.data, { q1: "other", "q1-Comment": "101" }, "survey.data");
  survey.doComplete(false);
  assert.deepEqual(survey.data, { q1: "other", "q1-Comment": "101" }, "survey.data on complete");
});
QUnit.test("On value changed, comment and valueName Bug#8137", (assert) => {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "radiogroup",
        "name": "q1",
        "valueName": "val1",
        "choices": [1, 2],
        "showOtherItem": true,
      }
    ]
  });
  let counter = 0;
  let questionName = "";
  let name = "";
  let value = undefined;
  survey.onValueChanged.add((sender, options) => {
    counter ++;
    questionName = options.question.name;
    name = options.name;
    value = options.value;
  });
  const q = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  q.value = 1;
  assert.equal(counter, 1, "counter #1");
  assert.equal(questionName, "q1", "question.name #1");
  assert.equal(name, "val1", "name #1");
  assert.equal(value, 1, "value #1");
  q.value = "other";
  assert.equal(counter, 2, "counter #2");
  questionName = "";
  name = "";
  value = undefined;
  q.comment = "comment1";
  assert.equal(counter, 3, "counter #3");
  assert.equal(questionName, "q1", "question name #3");
  assert.equal(name, "val1-Comment", "name #3");
  assert.equal(value, "comment1", "value #3");
});
QUnit.test("maxSelectedChoices & getItemClass, bug#8159", (assert) => {
  var json = {
    questions: [
      {
        type: "checkbox",
        name: "q1",
        choices: ["Item1", "Item2", "Item3"],
        maxSelectedChoices: 2
      },
    ],
  };
  const survey = new SurveyModel(json);
  const q1 = <QuestionSelectBase>survey.getQuestionByName("q1");
  const disableStyle = "sv_q_disable";
  const readOnlyStyle = "sv_q_disable";
  q1.cssClasses.itemDisabled = disableStyle;
  q1.cssClasses.itemReadOnly = readOnlyStyle;
  q1.renderedValue = ["Item1", "Item3"];
  assert.ok(q1.visibleChoices[0].enabled, "Item1 enabled #1");
  assert.notOk(q1.visibleChoices[1].enabled, "Item2 enabled #2");

  assert.notOk(q1.getItemClass(q1.visibleChoices[0]).indexOf(disableStyle) >= 0, "Item1 disabled #1");
  assert.ok(q1.getItemClass(q1.visibleChoices[1]).indexOf(disableStyle) >= 0, "Item2 disabled #2");
  assert.notOk(q1.getItemClass(q1.visibleChoices[2]).indexOf(disableStyle) >= 0, "Item3 disabled #3");

  assert.notOk(q1.getItemClass(q1.visibleChoices[0]).indexOf(readOnlyStyle) >= 0, "Item1 read-only #1");
  assert.ok(q1.getItemClass(q1.visibleChoices[1]).indexOf(readOnlyStyle) >= 0, "Item2 read-only #2");
  assert.notOk(q1.getItemClass(q1.visibleChoices[2]).indexOf(readOnlyStyle) >= 0, "Item3 read-only #3");
});
QUnit.test("radiogroup.getConditionJson, bug#8226", (assert) => {
  var json = {
    questions: [
      { type: "radiogroup", name: "q1", allowClear: true, choices: ["Item1"] },
      { type: "radiogroup", name: "q2", choices: ["Item1"] }
    ],
  };
  const survey = new SurveyModel(json);
  const q1 = survey.getQuestionByName("q1");
  const q2 = survey.getQuestionByName("q2");
  const res = { type: "radiogroup", name: "q1", choices: ["Item1"] };
  assert.deepEqual(q1.getConditionJson(), res, "q1");
  res.name = "q2";
  assert.deepEqual(q2.getConditionJson(), res, "q2");
});
QUnit.test("dropdown.clearValue(true) for showCommentArea & showOtherItem, bug#8226", (assert) => {
  var json = {
    questions: [
      { type: "dropdown", name: "q1", showCommentArea: true, choices: [1, 2] },
      { type: "dropdown", name: "q2", showOtherItem: true, choices: [1, 2] },
      { type: "dropdown", name: "q3", showCommentArea: true, showOtherItem: true, choices: [1, 2] },
      { type: "dropdown", name: "q4", showOtherItem: true, storeOthersAsComment: false, choices: [1, 2] }
    ],
  };
  const survey = new SurveyModel(json);
  const q1 = survey.getQuestionByName("q1");
  const q2 = survey.getQuestionByName("q2");
  const q3 = survey.getQuestionByName("q3");
  const q4 = survey.getQuestionByName("q4");
  q1.value = 1;
  q1.comment = "abc";
  q1.clearValue(true);
  q2.value = "other";
  q2.comment = "abc";
  q2.clearValue(true);
  q3.value = "val";
  q3.comment = "abc";
  q3.clearValue(true);
  q4.value = "val";
  q4.clearValue(true);

  assert.equal(q1.value, undefined, "q1.value");
  assert.equal(q1.comment, "abc", "q1.comment");
  assert.equal(q2.value, undefined, "q2.value");
  assert.notOk(q2.comment, "q2.comment");
  assert.equal(q3.value, undefined, "q3.value");
  assert.equal(q3.comment, "abc", "q3.comment");
  assert.equal(q4.value, undefined, "q4.value");
  assert.notOk(q4.comment, "q4.comment");
});
QUnit.test("valuePropertyName & complete trigger, bug#8434", (assert) => {
  const survey = new SurveyModel({
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "checkbox",
            "name": "models",
            "choices": [1, 2, 3],
            "showNoneItem": true,
            "valuePropertyName": "model_id"
          }
        ]
      },
      {
        "name": "page2",
        "elements": [
          {
            "type": "text",
            "name": "question1"
          }
        ]
      }
    ],
    "triggers": [
      {
        "type": "complete",
        "expression": "{models-unwrapped} = ['none']"
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("models");
  assert.equal(survey.calcIsCompleteButtonVisible(), false, "#1");
  q.renderedValue = ["none"];
  assert.equal(survey.calcIsCompleteButtonVisible(), true, "#2");
  q.renderedValue = [1];
  assert.equal(survey.calcIsCompleteButtonVisible(), false, "#3");
  q.renderedValue = ["none"];
  assert.equal(survey.calcIsCompleteButtonVisible(), true, "#4");
});
QUnit.test("Unselect none item, bug#8438", (assert) => {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "checkbox",
        "name": "q1",
        "choices": [1, 2, 3],
        "showNoneItem": true
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  q.clickItemHandler(q.noneItem, true);
  assert.deepEqual(q.value, ["none"], "#1");
  q.clickItemHandler(q.noneItem, false);
  assert.equal(q.isEmpty(), true, "#2");
  q.clickItemHandler(q.noneItem, true);
  assert.deepEqual(q.value, ["none"], "#3");
});

QUnit.test("Add condition custom property", function (assert) {
  Serializer.addProperty("itemvalue", {
    name: "customExp:expression",
    onExecuteExpression: (obj, res) => {
      obj.setPropertyValue("customVal", res);
    }
  });
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: [1, 2, { value: 3, customExp: "{q1.length}" }]
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const item3 = q.choices[2];
  assert.equal(item3.getPropertyValue("customVal"), 0, "#1");
  q.value = [1, 2, 3];
  assert.equal(item3.getPropertyValue("customVal"), 3, "#2");
  q.value = [2];
  assert.equal(item3.getPropertyValue("customVal"), 1, "#3");

  Serializer.removeProperty("itemvalue", "customExp");
});
QUnit.test("question checkbox add a custom property into choicesByUrl, Bug#8783", (assert) => {
  Serializer.addProperty("choicesByUrl", "jsonpath");
  const survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1",
        choicesByUrl: { valueName: "name", jsonpath: "mypath" }
      }
    ]
  });
  const q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  assert.equal(q1.choicesByUrl.valueName, "name", "valueName");
  assert.equal(q1.choicesByUrl["jsonpath"], "mypath", "load jsonpath");
  q1.choicesByUrl["jsonpath"] = "newpath";
  assert.deepEqual(q1.toJSON(), { name: "q1", choicesByUrl: { valueName: "name", jsonpath: "newpath" } }, "#2");
  Serializer.removeProperty("choicesByUrl", "jsonpath");
});
QUnit.test("Clear action in locale & survey.locale change, Bug#9113", (assert) => {
  const survey = new SurveyModel();
  survey.css =survey.css = { root: "sd-root-modern" };
  survey.fromJSON({
    elements: [{ type: "radiogroup", name: "q1", showClearButton: true }]
  });
  const q1 = <QuestionRadiogroupModel>survey.getQuestionByName("q1");
  assert.equal(q1.isDefaultV2Theme, true, "V2 theme");
  assert.ok(q1.getTitleToolbar());
  assert.equal(q1.titleActions.length, 1, "one action");
  const item = q1.titleActions[0];
  assert.equal(item.locTitle.localizationName, "clearCaption", "locName");
  assert.equal(item.locTitle.locale, "", "locale #1");
  survey.locale = "de";
  assert.equal(item.locTitle.locale, "de", "locale #2");
});
QUnit.test("ItemValue tooltip, #9269", (assert) => {
  const item = new ItemValue(1);
  assert.equal(item.getTooltip(), "1", "#1");
  item.text = "abc";
  assert.equal(item.getTooltip(), "abc", "#2");
  item.tooltip = "edf";
  assert.equal(item.getTooltip(), "edf", "#3");
});

QUnit.test("Check QuestionSelectBase Columns Arragement", function (assert) {
  // https://github.com/surveyjs/survey-library/issues/9487
  let json = {
    elements: [
      {
        "type": "radiogroup",
        "name": "q1",
        "choices": [
          "Item1",
          "Item2",
          "Item3",
          "Item4",
          "Item5",
          "Item6",
          "Item7",
          "Item8",
          "Item9",
          "Item10"
        ],
        "colCount": 3
      }
    ],
  };
  let survey = new SurveyModel(json);
  let question = <QuestionSelectBase>survey.getAllQuestions()[0];
  settings.itemFlowDirection = "column";
  let columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item2", "Item3", "Item4"], ["Item5", "Item6", "Item7", "Item8"], ["Item9", "Item10"]],
    "check itemFlowDirection column"
  );

  json = {
    elements: [{
      "type": "radiogroup",
      "name": "q2",
      "choices": [
        "Item1",
        "Item2",
        "Item3",
        "Item4"
      ],
      "colCount": 3
    }]
  };
  survey = new SurveyModel(json);
  question = <QuestionSelectBase>survey.getAllQuestions()[0];
  settings.itemFlowDirection = "column";
  columns = getValuesInColumns(question);
  assert.deepEqual(
    columns,
    [["Item1", "Item2"], ["Item3"], ["Item4"]],
    "check itemFlowDirection column (2)"
  );
});