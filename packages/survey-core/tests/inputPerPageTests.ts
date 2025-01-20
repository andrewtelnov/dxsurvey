import { SurveyModel } from "../src/survey";
import { PageModel } from "../src/page";
import { PanelModel } from "../src/panel";
import { Question } from "../src/question";
import { IElement } from "../src/base-interfaces";
import { QuestionMatrixDynamicModel } from "../src/question_matrixdynamic";
import { template } from "lodash";

export default QUnit.module("Input Per Page Tests");

function getSingleQuestion(page: PageModel): Question {
  if(page.visibleRows.length === 0) return <any>undefined;
  const q = <Question>page.visibleRows[0].elements[0];
  return q.singleInputQuestion || q;
}

QUnit.test("singleInput should work the same as singleQuestion for standard questions", assert => {
  const survey = new SurveyModel({
    questionsOnPageMode: "inputPerPage",
    elements: [
      { type: "text", name: "q1" },
      { type: "text", name: "q2" }
    ]
  });
  assert.equal(survey.isSingleVisibleQuestion, true, "one question per page");
  const page: PageModel = survey.currentPage;
  assert.equal(survey.currentSingleQuestion.name, "q1", "currentSingleQuestion is q1");
  assert.equal(page.visibleRows.length, 1, "Just one visible row");
  assert.equal(page.visibleRows[0].elements[0].name, "q1", "visible question is q1");
  assert.equal(getSingleQuestion(page).name, "q1", "getSingleQuestion is q1");
  survey.performNext();
  assert.equal(survey.currentSingleQuestion.name, "q2", "currentSingleQuestion is q2");
  assert.equal(page.visibleRows[0].elements[0].name, "q2", "visible question is q2");
  assert.equal(getSingleQuestion(page).name, "q2", "getSingleQuestion is q2");
});
QUnit.test("singleInput works in designer as standard", assert => {
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({
    questionsOnPageMode: "inputPerPage",
    elements: [
      { type: "text", name: "q1" },
      { type: "text", name: "q2" }
    ]
  });
  const page: PageModel = survey.currentPage;
  assert.notOk(survey.currentSingleQuestion, "currentSingleQuestion is undefined");
  assert.equal(page.visibleRows.length, 2, "There are two rows");
  assert.equal(page.visibleRows[0].elements[0].name, "q1", "visible question is q1");
  assert.equal(page.visibleRows[1].elements[0].name, "q2", "visible question is q2");
});
QUnit.test("singleInput for panel dynamic", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        displayMode: "tab",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ]
      },
      { type: "text", name: "q3" }
    ],
    questionsOnPageMode: "inputPerPage",
  });
  survey.css = { question: { nested: "q-nested", withFrame: "q-frame" } };
  assert.equal(survey.isSingleVisibleInput, true, "isSingleVisibleInput is true");
  const panel = survey.getQuestionByName("panel1");
  assert.equal(panel.panelCount, 1, "panelCount is 1");
  assert.equal(panel.panels.length, 1, "There is one panel");
  const page: PageModel = survey.currentPage;
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion is panel1, #1");
  let el = page.visibleRows[0].elements[0];
  assert.equal(el.name, "panel1", "page visible row is panel1, #1");
  assert.equal(panel.singleInputQuestion.name, "q1", "singleInputQuestion, #1");
  assert.equal(panel.isRenderModeTab, false, "isRenderModeTab, #1");
  const rootCss = panel.singleInputQuestion.getRootCss();
  assert.equal(rootCss.indexOf("q-frame") > -1, true, "rootCss has frame, #1");
  assert.equal(rootCss.indexOf("q-nested") > -1, false, "rootCss has frame, #1");
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "wrapper panel title, #1");

  survey.performNext();
  el = <PanelModel>page.visibleRows[0].elements[0];
  assert.equal(el.name, "panel1", "page visible row is panel1, #2");
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion is panel1, #2");
  assert.equal(panel.singleInputQuestion.name, "q2", "singleInputQuestion, #2");

  survey.performPrevious();
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion is panel1, #3");
  assert.equal(panel.singleInputQuestion.name, "q1", "singleInputQuestion, #3");

  survey.performNext();
  survey.performNext();
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion is panel1, #4");
  assert.equal(panel.singleInputQuestion.name, "panel1", "singleInputQuestion, #4");

  survey.performNext();
  assert.equal(survey.currentSingleQuestion.name, "q3", "currentSingleQuestion is q3, #5");
  assert.notOk(survey.getQuestionByName("q3").singleInputQuestion, "singleInputQuestion, #5");
});
QUnit.test("singleInput and navigation buttons visibilty", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" },
          { type: "text", name: "q3" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage",
  });
  const panel = survey.getQuestionByName("panel1");
  assert.equal(panel.singleInputQuestion.name, "q1", "singleInputQuestion, #1");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #1");
  assert.equal(survey.isShowNextButton, true, "next buttton, #1");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #1");
  survey.performNext();
  assert.equal(panel.singleInputQuestion.name, "q2", "singleInputQuestion, #1");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #2");
  assert.equal(survey.isShowNextButton, true, "next buttton, #2");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #2");
  survey.performNext();
  assert.equal(panel.singleInputQuestion.name, "q3", "singleInputQuestion, #1");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #3");
  assert.equal(survey.isShowNextButton, true, "next buttton, #3");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #3");
  survey.performNext();
  assert.equal(panel.singleInputQuestion.name, "panel1", "singleInputQuestion, #4");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #4");
  assert.equal(survey.isShowNextButton, false, "next buttton, #4");
  assert.equal(survey.isCompleteButtonVisible, true, "complete buttton, #4");
  survey.performPrevious();
  assert.equal(panel.singleInputQuestion?.name, "q3", "singleInputQuestion, #5");
  survey.performPrevious();
  assert.equal(panel.singleInputQuestion.name, "q2", "singleInputQuestion, #6");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #6");
  assert.equal(survey.isShowNextButton, true, "next buttton, #6");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #6");
  survey.performPrevious();
  assert.equal(panel.singleInputQuestion.name, "q1", "singleInputQuestion, #7");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #7");
  assert.equal(survey.isShowNextButton, true, "next buttton, #7");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #7");
});
QUnit.test("singleInput and navigation buttons visibilty & visibleIf", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2", visibleIf: "{panel.q1} notempty" },
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage",
  });
  const panel1 = survey.getQuestionByName("panel1");
  const addBtn = survey.navigationBar.getActionById("sv-singleinput-add");
  assert.equal(panel1.singleInputQuestion.name, "q1", "singleInputQuestion, #1");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #1");
  assert.equal(survey.isShowNextButton, true, "next buttton, #1");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #1");
  assert.equal(addBtn.visible, false, "addBtn visible #1, panel is empty");
  panel1.singleInputQuestion.value = "a";
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #2");
  assert.equal(survey.isShowNextButton, true, "next buttton, #2");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #2");
  assert.equal(addBtn.visible, false, "addBtn visible #2");
  survey.performNext();
  assert.equal(panel1.singleInputQuestion.name, "q2", "singleInputQuestion, #3");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #3");
  assert.equal(survey.isShowNextButton, true, "next buttton, #3");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #3");
  assert.equal(addBtn.visible, false, "addBtn visible #3");
  survey.performNext();
  assert.equal(panel1.singleInputQuestion.name, "panel1", "singleInputQuestion, #4");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #4");
  assert.equal(survey.isShowNextButton, false, "next buttton, #4");
  assert.equal(survey.isCompleteButtonVisible, true, "complete buttton, #4");
  assert.equal(addBtn.visible, true, "addBtn visible #4");
});
QUnit.test("singleInput and panel dynamic with templateTitle", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 2,
        templateTitle: "Item: {panelIndex} - {panel.q1}",
        templateElements: [
          { type: "text", name: "q1" },
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage",
  });
  const panel = survey.getQuestionByName("panel1");
  const page: PageModel = survey.currentPage;
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion is panel1, #1");
  assert.equal(panel.singleInputQuestion.name, "q1", "The q1 is in the row, #1");
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Item: 1 - ", "wrapper panel title, #1.1");
  let q1 = panel.singleInputQuestion;
  q1.value = "abc";
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Item: 1 - abc", "wrapper panel title, #1.2");

  survey.performNext();
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Item: 2 - ", "wrapper panel title, #2.2");
  q1 = panel.singleInputQuestion;
  q1.value = "edf";
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Item: 2 - edf", "wrapper panel title, #2.2");
});
QUnit.test("singleInput and panel dynamic & add/remove panels in navigation bar", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 2,
        templateElements: [
          { type: "text", name: "q1", defaultValue: "val1" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const panel1 = survey.getQuestionByName("panel1");
  const bar = survey.navigationBar;
  assert.ok(bar.getActionById("sv-singleinput-add"), "addBtn exists, #1");
  assert.ok(bar.getActionById("sv-singleinput-remove"), "removeBtn exists, #1");
  assert.equal(panel1.singleInputQuestion.name, "q1", "singleInputQuestion, #1");
  survey.questionsOnPageMode = "standard";
  assert.notOk(bar.getActionById("sv-singleinput-add"), "addBtn exists, #2");
  assert.notOk(bar.getActionById("sv-singleinput-remove"), "removeBtn exists, #2");
  assert.equal(survey.currentSingleQuestion?.name, undefined, "currentSingleQuestion #2");
  assert.equal(panel1.singleInputQuestion?.name, undefined, "singleInputQuestion, #2");
  survey.questionsOnPageMode = "inputPerPage";
  assert.equal(panel1.singleInputQuestion.name, "q1", "singleInputQuestion, #3");
  const addBtn = bar.getActionById("sv-singleinput-add");
  const removeBtn = bar.getActionById("sv-singleinput-remove");
  assert.ok(addBtn, "addBtn exists, #3");
  assert.ok(removeBtn, "removeBtn exists, #3");
  assert.equal(addBtn.visible, false, "addBtn visible #1");
  assert.equal(removeBtn.visible, true, "removeBtn visible #1");
  assert.equal(removeBtn.title, "Remove", "removeBtn text #1");
  survey.performNext();
  assert.equal(addBtn.visible, false, "addBtn visible #2");
  assert.equal(removeBtn.visible, true, "removeBtn visible #2");
  assert.equal(removeBtn.title, "Remove", "removeBtn text #2");
  survey.performNext();
  addBtn.action();
  assert.equal(panel1.panelCount, 3, "New panel is added, #3");
  assert.equal(addBtn.visible, false, "addBtn visible #3");
  assert.equal(removeBtn.visible, true, "removeBtn visible #3");
  removeBtn.action();
  assert.equal(panel1.panelCount, 2, "Last panel is removed");
  assert.equal(addBtn.visible, false, "addBtn visible #4");
  assert.equal(removeBtn.visible, true, "removeBtn visible #4");
  survey.performNext();
  assert.equal(addBtn.visible, true, "addBtn visible #5");
  assert.equal(removeBtn.visible, false, "removeBtn visible #5");
});
QUnit.test("singleInput and panel dynamic & empty panel/add panel/remove panel", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const panel1 = survey.getQuestionByName("panel1");
  assert.equal(panel1.panelCount, 0, "panelCount #1");
  const bar = survey.navigationBar;
  const addBtn = bar.getActionById("sv-singleinput-add");
  const removeBtn = bar.getActionById("sv-singleinput-remove");
  const page: PageModel = survey.currentPage;
  assert.equal(addBtn.visible, true, "addBtn visible #1");
  assert.equal(removeBtn.visible, false, "removeBtn visible #1");
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion, #1");
  assert.equal(page.visibleRows.length, 1, "Just one visible row, #1");
  assert.equal(page.visibleRows[0].elements[0].name, "panel1", "visible question in row, #1");
  assert.equal(panel1.singleInputQuestion.name, "panel1", "singleInputQuestion, #1");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #1");
  assert.equal(survey.isShowNextButton, false, "next buttton, #1");
  panel1.addPanelUI();
  assert.equal(panel1.panelCount, 1, "panelCount #2");
  assert.equal(addBtn.visible, false, "addBtn visible #2");
  assert.equal(removeBtn.visible, true, "removeBtn visible #2");
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion, #2");
  assert.equal(panel1.singleInputQuestion.name, "q1", "singleInputQuestion, #2");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #2");
  assert.equal(survey.isShowNextButton, true, "next buttton, #2");
  removeBtn.action();
  assert.equal(panel1.panelCount, 0, "panelCount #3");
  assert.equal(addBtn.visible, true, "addBtn visible #3");
  assert.equal(removeBtn.visible, false, "removeBtn visible #3");
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion, #3");
  assert.equal(page.visibleRows.length, 1, "Just one visible row, #3");
  assert.equal(page.visibleRows[0].elements[0].name, "panel1", "visible question in row, #3");
  assert.equal(panel1.singleInputQuestion.name, "panel1", "singleInputQuestion, #3");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #3");
  assert.equal(survey.isShowNextButton, false, "next buttton, #3");
});
QUnit.test("singleInput and panel dynamic & validation", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1", isRequired: true },
          { type: "text", name: "q2", isRequired: true }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const panel1 = survey.getQuestionByName("panel1");
  assert.equal(panel1.panelCount, 1, "panelCount #1");
  const bar = survey.navigationBar;
  const addBtn = bar.getActionById("sv-singleinput-add");
  const page: PageModel = survey.currentPage;
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion, #1");
  assert.equal(addBtn.visible, false, "addBtn visible #1");
  assert.equal(getSingleQuestion(page).name, "q1", "getSingleQuestion is q1");
  assert.equal(panel1.singleInputLocTitle.textOrHtml, "Panel 1", "wrapper panel title, #1");
  assert.equal(survey.performNext(), false, "next #2");
  assert.equal(getSingleQuestion(page).name, "q1", "getSingleQuestion is q1, #2");
  assert.equal(getSingleQuestion(page).errors.length, 1, "getSingleQuestion errors, #2");
  getSingleQuestion(page).value = "a";
  assert.equal(survey.performNext(), true, "next #3");
  assert.equal(getSingleQuestion(page).name, "q2", "getSingleQuestion is q2, #3");
  assert.equal(addBtn.visible, false, "addBtn visible #3");
  survey.performNext();
  addBtn.action();
  assert.equal(getSingleQuestion(page).name, "q2", "getSingleQuestion is q2, #4");
  assert.equal(getSingleQuestion(page).errors.length, 1, "getSingleQuestion errors, #4");
  assert.equal(addBtn.visible, false, "addBtn visible #4");
  getSingleQuestion(page).value = "b";
  survey.performNext();
  addBtn.action();
  assert.equal(getSingleQuestion(page).name, "q1", "getSingleQuestion is q1, #5");
  assert.equal(addBtn.visible, false, "addBtn visible #5");
  assert.equal(panel1.panelCount, 2, "panelCount #5");
  assert.equal(panel1.singleInputLocTitle.textOrHtml, "Panel 2", "wrapper panel title, #2");
  getSingleQuestion(page).value = "c";
  survey.performNext();
  getSingleQuestion(page).value = "d";
  assert.equal(survey.tryComplete(), true, "compete");
  assert.deepEqual(survey.data, { panel1: [{ q1: "a", q2: "b" }, { q1: "c", q2: "d" }] }, "survey.data");
});
QUnit.test("singleInput and matrix dropdown", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown", name: "matrix1",
        columns: [
          { cellType: "text", name: "col1", title: "Column 1" },
          { cellType: "text", name: "col2", title: "Column 2" }
        ],
        rows: ["Row 1", "Row 2"]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const matrix1 = survey.getQuestionByName("matrix1");
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion.name, #1");
  assert.equal(matrix1.singleInputQuestion.title, "Column 1", "singleInputQuestion.title, #1");
  assert.equal(matrix1.singleInputLocTitle.textOrHtml, "Row 1", "singleInputLocTitle, #1");
  assert.equal(survey.isCompleteButtonVisible, false, "isCompleteButtonVisible #1");
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "col2", "singleInputQuestion.name, #2");
  assert.equal(matrix1.singleInputQuestion.title, "Column 2", "singleInputQuestion.title, #2");
  assert.equal(matrix1.singleInputLocTitle.textOrHtml, "Row 1", "singleInputLocTitle, #2");
  assert.equal(survey.isCompleteButtonVisible, false, "isCompleteButtonVisible #2");
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion.name, #3");
  assert.equal(matrix1.singleInputQuestion.title, "Column 1", "singleInputQuestion.title, #3");
  assert.equal(matrix1.singleInputLocTitle.textOrHtml, "Row 2", "singleInputLocTitle, #3");
  assert.equal(survey.isCompleteButtonVisible, false, "isCompleteButtonVisible #3");
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "col2", "singleInputQuestion.name, #4");
  assert.equal(matrix1.singleInputQuestion.title, "Column 2", "singleInputQuestion.title, #4");
  assert.equal(matrix1.singleInputLocTitle.textOrHtml, "Row 2", "singleInputLocTitle, #4");
  assert.equal(survey.isCompleteButtonVisible, true, "isCompleteButtonVisible #4");
});
QUnit.test("singleInput and matrix dynamic", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix1",
        columns: [
          { cellType: "text", name: "col1", title: "Column 1" },
          { cellType: "text", name: "col2", title: "Column 2" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const matrix1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix1");
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #0");
  assert.equal(survey.isCompleteButtonVisible, true, "isCompleteButtonVisible #0");
  matrix1.addRow();
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion.name, #1");
  assert.equal(matrix1.singleInputQuestion.title, "Column 1", "singleInputQuestion.title, #1");
  assert.equal(survey.isCompleteButtonVisible, false, "isCompleteButtonVisible #1");
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "col2", "singleInputQuestion.name, #2");
  assert.equal(matrix1.singleInputQuestion.title, "Column 2", "singleInputQuestion.title, #2");
  assert.equal(survey.isCompleteButtonVisible, false, "isCompleteButtonVisible #2");
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #3");
  assert.equal(survey.isCompleteButtonVisible, true, "isCompleteButtonVisible #3");
  matrix1.removeRow(0);
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #4");
  assert.equal(survey.isCompleteButtonVisible, true, "isCompleteButtonVisible #4");
  matrix1.addRow();
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion.name, #5");
  assert.equal(matrix1.singleInputQuestion.title, "Column 1", "singleInputQuestion.title, #5");
  assert.equal(survey.isCompleteButtonVisible, false, "isCompleteButtonVisible #5");
});
QUnit.test("singleInput and matrix dynamic & add/remove rows in navigation bar", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix1",
        columns: [
          { cellType: "text", name: "col1", defaultValue: "val1" },
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const matrix1 = survey.getQuestionByName("matrix1");
  const bar = survey.navigationBar;
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion is empty, #1");
  matrix1.addRow();
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion, #1");
  assert.ok(bar.getActionById("sv-singleinput-add"), "addBtn exists, #1");
  assert.ok(bar.getActionById("sv-singleinput-remove"), "removeBtn exists, #1");
  survey.questionsOnPageMode = "standard";
  assert.notOk(bar.getActionById("sv-singleinput-add"), "addBtn exists, #2");
  assert.notOk(bar.getActionById("sv-singleinput-remove"), "removeBtn exists, #2");
  assert.equal(survey.currentSingleQuestion?.name, undefined, "currentSingleQuestion #2");
  assert.equal(matrix1.singleInputQuestion?.name, undefined, "singleInputQuestion, #2");
  matrix1.rowCount = 0;
  survey.questionsOnPageMode = "inputPerPage";
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion, #3.1");
  matrix1.addRow();
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion, #3.2");
  const addBtn = bar.getActionById("sv-singleinput-add");
  const removeBtn = bar.getActionById("sv-singleinput-remove");
  assert.ok(addBtn, "addBtn exists, #3");
  assert.ok(removeBtn, "removeBtn exists, #3");
  assert.equal(addBtn.visible, false, "addBtn visible #1");
  assert.equal(removeBtn.visible, true, "removeBtn visible #1");
  assert.equal(removeBtn.title, "Remove", "removeBtn text #1");
  survey.performNext();
  assert.equal(addBtn.visible, true, "addBtn visible #2");
  assert.equal(addBtn.title, "Add Row", "addBtn text #2");
  assert.equal(removeBtn.visible, false, "removeBtn visible #2");
  addBtn.action();
  assert.equal(matrix1.rowCount, 2, "New row is added");
  assert.equal(addBtn.visible, false, "addBtn visible #3");
  assert.equal(removeBtn.visible, true, "removeBtn visible #3");
  removeBtn.action();
  assert.equal(matrix1.rowCount, 1, "Last row is removed");
  assert.equal(addBtn.visible, false, "addBtn visible #4");
  assert.equal(removeBtn.visible, true, "removeBtn visible #4");
  survey.performNext();
  assert.equal(addBtn.visible, true, "addBtn visible #5");
  assert.equal(addBtn.title, "Add Row", "addBtn text #5");
});
QUnit.test("singleInput and single matrix", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrix", name: "matrix1",
        columns: ["col1", "col2", "col3", "col4"],
        rows: [{ value: "row1", text: "Row 1" }, "row2"]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  survey.css = { question: { nested: "q-nested", withFrame: "q-frame" } };
  const matrix1 = survey.getQuestionByName("matrix1");
  assert.equal(matrix1.singleInputQuestion.name, "row1", "singleInputQuestion.name, #1");
  assert.equal(matrix1.singleInputQuestion.locTitle.textOrHtml, "Row 1", "singleInputQuestion.title, #1");
  assert.equal(matrix1.singleInputQuestion.choices.length, 4, "singleInputQuestion.choices.length, #1");
  assert.equal(survey.isCompleteButtonVisible, false, "isCompleteButtonVisible #1");
  assert.equal(matrix1.singleInputQuestion.isRequired, false, "The question is not required");
  const rootCss = matrix1.singleInputQuestion.getRootCss();
  assert.equal(rootCss.indexOf("q-frame") > -1, true, "rootCss has frame, #1");
  assert.equal(rootCss.indexOf("q-nested") > -1, false, "rootCss has frame, #1");
  matrix1.singleInputQuestion.value = "col2";
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "row2", "singleInputQuestion.name, #2");
  assert.equal(matrix1.singleInputQuestion.choices.length, 4, "singleInputQuestion.choices.length, #2");
  assert.equal(survey.isCompleteButtonVisible, true, "isCompleteButtonVisible #2");
  matrix1.singleInputQuestion.value = "col3";
  assert.deepEqual(matrix1.value, { row1: "col2", row2: "col3" }, "matrix1.value");
  assert.deepEqual(survey.data, { matrix1: { row1: "col2", row2: "col3" } }, "survey.data");
});
QUnit.test("singleInput and single matrix", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrix", name: "matrix1", isAllRowRequired: true,
        columns: ["col1", "col2", "col3", "col4"],
        rows: [{ value: "row1", text: "Row 1" }, "row2"]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const matrix1 = survey.getQuestionByName("matrix1");
  assert.equal(matrix1.singleInputQuestion.isRequired, true, "The question is required");
});
QUnit.test("singleInput and matrix dynamic & navigation buttons visibilty & show matrix question", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix1",
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage",
  });
  const matrix1 = survey.getQuestionByName("matrix1");
  const addBtn = survey.navigationBar.getActionById("sv-singleinput-add");
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #1");
  assert.equal(addBtn.visible, true, "addBtn visible #1");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #1");
  assert.equal(survey.isShowNextButton, false, "next buttton, #1");
  assert.equal(survey.isCompleteButtonVisible, true, "complete buttton, #1");
  matrix1.addRow();
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion.name, #2");
  assert.equal(addBtn.visible, false, "addBtn visible #2");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #2");
  assert.equal(survey.isShowNextButton, true, "next buttton, #2");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #2");
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "col2", "singleInputQuestion.name, #3");
  assert.equal(addBtn.visible, false, "addBtn visible #3");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #3");
  assert.equal(survey.isShowNextButton, true, "next buttton, #3");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #3");
  survey.performNext();
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #4");
  assert.equal(addBtn.visible, true, "addBtn visible #4");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #4");
  assert.equal(survey.isShowNextButton, false, "next buttton, #4");
  assert.equal(survey.isCompleteButtonVisible, true, "complete buttton, #4");
  matrix1.addRow();
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion.name, #5");
  assert.equal(addBtn.visible, false, "addBtn visible #5");
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #5");
  assert.equal(survey.isShowNextButton, true, "next buttton, #5");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #5");
});

QUnit.test("singleInput and matrix dynamic & navigation buttons visibilty & visibleIf", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix1",
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2", visibleIf: "{row.col1} = 1" },
          { cellType: "text", name: "col3", visibleIf: "{row.col1} notempty" },
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage",
  });
  const matrix1 = survey.getQuestionByName("matrix1");
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #0");
  matrix1.addRow();
  const addBtn = survey.navigationBar.getActionById("sv-singleinput-add");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #1");
  assert.equal(survey.isShowNextButton, true, "next buttton, #1");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #1");
  assert.equal(matrix1.singleInputQuestion.name, "col1", "singleInputQuestion.name, #1");
  assert.equal(addBtn.visible, false, "addBtn visible #1, row is empty");
  matrix1.singleInputQuestion.value = "a";
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #2");
  assert.equal(survey.isShowNextButton, true, "next buttton, #2");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #2");
  assert.equal(addBtn.visible, false, "addBtn visible #2");
  survey.performNext();
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #3");
  assert.equal(survey.isShowNextButton, true, "next buttton, #3");
  assert.equal(survey.isCompleteButtonVisible, false, "complete buttton, #3");
  assert.equal(matrix1.singleInputQuestion.name, "col3", "singleInputQuestion.name, #3");
  assert.equal(addBtn.visible, false, "addBtn visible #3");
  survey.performNext();
  assert.equal(survey.isShowPrevButton, true, "prev buttton, #4");
  assert.equal(survey.isShowNextButton, false, "next buttton, #4");
  assert.equal(survey.isCompleteButtonVisible, true, "complete buttton, #4");
  assert.equal(matrix1.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #4");
  assert.equal(addBtn.visible, true, "addBtn visible #4");
});
QUnit.test("singleInput for panel dynamic & singleInputLocTitle", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 2,
        templateElements: [
          { type: "text", name: "q1" }
        ]
      }
    ]
  });
  const panel = survey.getQuestionByName("panel1");
  assert.equal(panel.panels[0].locTitle.isEmpty, true, "panels[0] locTitle is empty, #1");
  assert.equal(panel.panels[1].locTitle.isEmpty, true, "panels[1] locTitle is empty, #1");
  survey.questionsOnPageMode = "inputPerPage";
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "singleInputLocTitle, #2");
  survey.performNext();
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 2", "singleInputLocTitle, #3");
  survey.questionsOnPageMode = "standard";
  assert.equal(panel.panels[0].locTitle.isEmpty, true, "panels[0] locTitle is empty, #4");
  assert.equal(panel.panels[1].locTitle.isEmpty, true, "panels[1] locTitle is empty, #4");
});
QUnit.test("singleInput for matrix dynamic & singleInputLocTitle, cell question title", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix1",
        rowCount: 3,
        columns: [{ cellType: "text", name: "col1" }]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const matrix = survey.getQuestionByName("matrix1");
  assert.equal(matrix.showSingleInputTitle, false, "showSingleInputTitle, #1");
  matrix.addRow();
  assert.equal(matrix.showSingleInputTitle, true, "showSingleInputTitle, #2");
  assert.equal(matrix.singleInputLocTitle.textOrHtml, "Row 1", "singleInputLocTitle, #2");
  assert.equal(matrix.singleInputQuestion.locTitle.textOrHtml, "col1", "singleInputQuestion.title, #2");
  survey.performNext();
  assert.equal(matrix.showSingleInputTitle, false, "showSingleInputTitle, #3");
  matrix.addRow();
  assert.equal(matrix.showSingleInputTitle, true, "showSingleInputTitle, #4");
  assert.equal(matrix.singleInputLocTitle.textOrHtml, "Row 2", "singleInputLocTitle, #4");
  survey.performNext();
  assert.equal(matrix.showSingleInputTitle, false, "showSingleInputTitle, #5");
  matrix.addRow();
  assert.equal(matrix.showSingleInputTitle, true, "showSingleInputTitle, #6");
  assert.equal(matrix.singleInputLocTitle.textOrHtml, "Row 3", "singleInputLocTitle, #6");
  survey.performPrevious();
  assert.equal(matrix.showSingleInputTitle, true, "showSingleInputTitle, #7");
  assert.equal(matrix.singleInputLocTitle.textOrHtml, "Row 2", "singleInputLocTitle, #7");
});
QUnit.test("singleInput for matrix dynamic & cell question & css", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix1",
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  survey.css = { question: { nested: "q-nested", withFrame: "q-frame" } };
  const matrix = survey.getQuestionByName("matrix1");
  assert.equal(matrix.singleInputQuestion.name, "matrix1", "no singleInputQuestion, #1");
  matrix.addRow();
  matrix.addRow();
  matrix.visibleRows.forEach(row => {
    row.cells.forEach(cell => {
      const q = cell.question;
      const rootCss = q.getRootCss();
      assert.equal(rootCss.indexOf("q-frame") > -1, true, "rootCss has frame: name: " + q.name);
      assert.equal(rootCss.indexOf("q-nested") > -1, false, "rootCss no nested: name: " + q.name);
    });
  });
});

QUnit.test("singleInput & singleInputSummary for dynamic matrix", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix1",
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const matrix = survey.getQuestionByName("matrix1");
  assert.equal(survey.currentSingleQuestion.name, "matrix1", "currentSingleQuestion is matrix1, #1");
  assert.equal(matrix.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #1");
  assert.ok(matrix.singleInputSummary, "singleInputSummary exists, #1");
  assert.equal(matrix.singleInputSummary.items.length, 0, "singleInputSummary.items.length, #1");
  matrix.singleInputSummary.bntAdd.action();
  assert.equal(matrix.rowCount, 1, "row count, #2");
  assert.notOk(matrix.singleInputSummary, "singleInputSummary exists, #2");
  survey.performNext();
  assert.notOk(matrix.singleInputSummary, "singleInputSummary exists, #3");
  survey.performNext();
  assert.ok(matrix.singleInputSummary, "singleInputSummary exists, #4");
  assert.equal(matrix.singleInputSummary.items.length, 1, "singleInputSummary.items.length, #4");
  matrix.addRow();
  survey.performNext();
  survey.performNext();
  assert.ok(matrix.singleInputSummary, "singleInputSummary exists, #5");
  assert.equal(matrix.singleInputSummary.items.length, 2, "singleInputSummary.items.length, #5");
  assert.equal(matrix.singleInputSummary.items[0].locText.textOrHtml, "Row 1", "singleInputSummary.items[0].locText, #5");
  assert.equal(matrix.singleInputSummary.items[1].locText.textOrHtml, "Row 2", "singleInputSummary.items[1].locText, #5");
  assert.equal(matrix.singleInputSummary.items[0].btnEdit.locTitle.textOrHtml, "Edit", "singleInputSummary.items[0].btnEdit.locTitle, #5");
  matrix.singleInputSummary.items[0].btnEdit.action();
  assert.equal(matrix.singleInputQuestion.name, "col1", "singleInputQuestion.name, #6");
  assert.equal(matrix.singleInputLocTitle.textOrHtml, "Row 1", "singleInputLocTitle, #6");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #6");
  assert.equal(survey.isShowNextButton, true, "next buttton, #6");
});
QUnit.test("singleInput & singleInputSummary for dynamic panel", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const panel = survey.getQuestionByName("panel1");
  assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion is matrix1, #1");
  assert.equal(panel.singleInputQuestion.name, "panel1", "singleInputQuestion.name, #1");
  assert.ok(panel.singleInputSummary, "singleInputSummary exists, #1");
  assert.equal(panel.singleInputSummary.items.length, 0, "singleInputSummary.items.length, #1");
  panel.singleInputSummary.bntAdd.action();
  assert.equal(panel.panelCount, 1, "row count, #2");
  assert.notOk(panel.singleInputSummary, "singleInputSummary exists, #2");
  survey.performNext();
  assert.notOk(panel.singleInputSummary, "singleInputSummary exists, #3");
  survey.performNext();
  assert.ok(panel.singleInputSummary, "singleInputSummary exists, #4");
  assert.equal(panel.singleInputSummary.items.length, 1, "singleInputSummary.items.length, #4");
  panel.addPanel();
  survey.performNext();
  survey.performNext();
  assert.ok(panel.singleInputSummary, "singleInputSummary exists, #5");
  assert.equal(panel.singleInputSummary.items.length, 2, "singleInputSummary.items.length, #5");
  assert.equal(panel.singleInputSummary.items[0].locText.textOrHtml, "Panel 1", "singleInputSummary.items[0].locText, #5");
  assert.equal(panel.singleInputSummary.items[1].locText.textOrHtml, "Panel 2", "singleInputSummary.items[1].locText, #5");
  assert.equal(panel.singleInputSummary.items[0].btnEdit.locTitle.textOrHtml, "Edit", "singleInputSummary.items[0].btnEdit.locTitle, #5");
  panel.singleInputSummary.items[0].btnEdit.action();
  assert.equal(panel.singleInputQuestion.name, "q1", "singleInputQuestion.name, #6");
  assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "singleInputLocTitle, #6");
  assert.equal(survey.isShowPrevButton, false, "prev buttton, #6");
  assert.equal(survey.isShowNextButton, true, "next buttton, #6");
});
QUnit.test("singleInput & nested matrix dynamic in the panel dynamic", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "name" },
          {
            type: "matrixdynamic", name: "matrix1",
            columns: [
              { cellType: "text", name: "col1" },
              { cellType: "text", name: "col2" }
            ]
          }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const addBtn = survey.navigationBar.getActionById("sv-singleinput-add");
  const removeBtn = survey.navigationBar.getActionById("sv-singleinput-remove");
  const panel = survey.getQuestionByName("panel1");
  let move = " forward";
  const checkStep1 = () => {
    assert.equal(survey.currentSingleQuestion.name, "panel1", "currentSingleQuestion is matrix1, #1" + move);
    assert.equal(panel.singleInputQuestion.name, "name", "singleInputQuestion.name, #1" + move);
    assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "input loc title #1" + move);
    assert.equal(survey.isShowPrevButton, false, "prev buttton, #1" + move);
    assert.equal(survey.isShowNextButton, true, "next buttton, #1" + move);
    assert.equal(addBtn.visible, false, "addBtn visible #1" + move);
    assert.equal(removeBtn.visible, true, "removeBtn visible #1" + move);
  };
  checkStep1();

  survey.performNext();
  let matrix = panel.panels[0].getQuestionByName("matrix1");
  const checkStep2 = () => {
    assert.equal(panel.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #2" + move);
    assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "input loc title #2" + move);
    assert.equal(survey.isShowPrevButton, true, "prev buttton, #2" + move);
    assert.equal(survey.isShowNextButton, true, "next buttton, #2" + move);
    assert.equal(matrix.singleInputQuestion.name, "matrix1", "matrix.singleInputQuestion.name, #2" + move);
    assert.equal(matrix.showSingleInputTitle, false, "matrix.input loc title #2" + move);
    assert.equal(matrix.singleInputSummary?.items.length, 0, "matrix.singleInputSummary exists, #2" + move);
    assert.equal(addBtn.visible, true, "addBtn visible #2" + move);
    assert.equal(removeBtn.visible, false, "removeBtn visible #2" + move);
    assert.equal(matrix.visibleRows.length, 0, "matrix.visibleRows.length, #2" + move);
  };
  checkStep2();

  addBtn.action();
  const checkStep3 = () => {
    assert.equal(matrix.visibleRows.length, 1, "matrix.visibleRows.length, #3" + move);
    assert.equal(panel.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #3" + move);
    assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "input loc title #3" + move);
    assert.equal(survey.isShowPrevButton, true, "prev buttton, #3" + move);
    assert.equal(survey.isShowNextButton, true, "next buttton, #3" + move);
    assert.equal(matrix.singleInputQuestion.name, "col1", "matrix.singleInputQuestion.name, #3" + move);
    assert.equal(matrix.singleInputLocTitle.textOrHtml, "Row 1", "matrix.input loc title #3" + move);
    assert.equal(matrix.singleInputSummary?.items.length, undefined, "matrix.singleInputSummary exists, #3" + move);
    assert.equal(addBtn.visible, false, "addBtn visible #3" + move);
    assert.equal(removeBtn.visible, true, "removeBtn visible #3" + move);
  };
  checkStep3();

  survey.performNext();
  const checkStep4 = () => {
    assert.equal(panel.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #4" + move);
    assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "input loc title #4" + move);
    assert.equal(survey.isShowPrevButton, true, "prev buttton, #4" + move);
    assert.equal(survey.isShowNextButton, true, "next buttton, #4" + move);
    assert.equal(matrix.singleInputQuestion.name, "col2", "matrix.singleInputQuestion.name, #4" + move);
    assert.equal(matrix.singleInputLocTitle.textOrHtml, "Row 1", "matrix.input loc title #4" + move);
    assert.equal(matrix.singleInputSummary?.items.length, undefined, "matrix.singleInputSummary exists, #4" + move);
    assert.equal(addBtn.visible, false, "addBtn visible #4" + move);
    assert.equal(removeBtn.visible, true, "removeBtn visible #4" + move);
  };
  checkStep4();
  survey.performNext();
  const checkStep5 = () => {
    assert.equal(panel.singleInputQuestion.name, "matrix1", "singleInputQuestion.name, #5" + move);
    assert.equal(panel.singleInputLocTitle.textOrHtml, "Panel 1", "input loc title #5" + move);
    assert.equal(survey.isShowPrevButton, true, "prev buttton, #5" + move);
    assert.equal(survey.isShowNextButton, true, "next buttton, #5" + move);
    assert.equal(matrix.singleInputQuestion.name, "matrix1", "matrix.singleInputQuestion.name, #5" + move);
    assert.equal(matrix.showSingleInputTitle, false, "matrix.input loc title #5" + move);
    assert.equal(matrix.singleInputSummary?.items.length, 1, "matrix.singleInputSummary exists, #5" + move);
    assert.equal(addBtn.visible, true, "addBtn visible #5" + move);
    assert.equal(removeBtn.visible, false, "removeBtn visible #5" + move);
  };
  checkStep5();

  survey.performNext();
  const checkStep6 = () => {
    assert.equal(panel.singleInputQuestion.name, "panel1", "singleInputQuestion.name, #6");
    assert.equal(panel.showSingleInputTitle, false, "input loc title #6");
    assert.equal(survey.isShowPrevButton, true, "prev buttton, #6");
    assert.equal(survey.isShowNextButton, false, "next buttton, #6");
    assert.equal(survey.isCompleteButtonVisible, true, "complete buttton, #6");
    assert.equal(panel.singleInputSummary.items.length, 1, "panel.singleInputSummary exists, #6");
    assert.equal(addBtn.visible, true, "addBtn visible #6");
    assert.equal(removeBtn.visible, false, "removeBtn visible #6");
  };
  checkStep6();
  move = " backward";
  survey.performPrevious();
  checkStep5();
  survey.performPrevious();
  checkStep4();
  survey.performPrevious();
  checkStep3();
  survey.performPrevious();
  checkStep1();
});
QUnit.test("singleInput & singleInputSummary, stay on summary on deleting", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 2,
        templateElements: [
          { type: "text", name: "q1" },
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const panel = survey.getQuestionByName("panel1");
  survey.performNext();
  survey.performNext();
  assert.ok(panel.singleInputSummary, "singleInputSummary is here, #1");
  assert.equal(panel.singleInputSummary.items.length, 2, "singleInputSummary.items.length, #1");
  panel.singleInputSummary.items[0].btnRemove.action();
  assert.ok(panel.singleInputSummary, "singleInputSummary is here, #2");
  assert.equal(panel.singleInputSummary.items.length, 1, "singleInputSummary.items.length, #2");
  panel.singleInputSummary.items[0].btnRemove.action();
  assert.ok(panel.singleInputSummary, "singleInputSummary is here, #3");
  assert.equal(panel.singleInputSummary.items.length, 0, "singleInputSummary.items.length, #3");
});
QUnit.test("singleInput & singleInputSummary, showRemove", assert => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 2,
        minPanelCount: 1,
        templateElements: [
          { type: "text", name: "q1" },
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage"
  });
  const panel = survey.getQuestionByName("panel1");
  survey.performNext();
  survey.performNext();
  assert.equal(panel.singleInputSummary.items.length, 2, "singleInputSummary.items.length, #1");
  assert.equal(panel.singleInputSummary.items[0].showRemove, true, "singleInputSummary.items[0].showRemove, #1");
  panel.singleInputSummary.items[0].btnRemove.action();
  assert.equal(panel.singleInputSummary.items.length, 1, "singleInputSummary.items.length, #2");
  assert.equal(panel.singleInputSummary.items[0].showRemove, false, "singleInputSummary.items[0].showRemove, #1");
});