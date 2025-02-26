import { SurveyModel } from "../src/survey";
import { QuestionCheckboxModel } from "../src/question_checkbox";
import { EmailValidator } from "../src/validator";
import { QuestionMatrixDropdownModel } from "../src/question_matrixdropdown";
import { MatrixDropdownRowModelBase } from "../src/question_matrixdropdownbase";
import { QuestionDropdownModel } from "../src/question_dropdown";
import { QuestionMatrixDynamicModel } from "../src/question_matrixdynamic";
import { JsonObject, Serializer } from "../src/jsonobject";
import { ItemValue } from "../src/itemvalue";
import { CustomWidgetCollection } from "../src/questionCustomWidgets";
import { FunctionFactory } from "../src/functionsfactory";
import { Question } from "../src/question";
import { ExpressionValidator } from "../src/validator";
import { QuestionExpressionModel } from "../src/question_expression";
import { settings } from "../src/settings";
import { PanelModel } from "../src/panel";
import { QuestionTextModel } from "../src/question_text";
import { SurveyElement } from "../src/survey-element";
import { Action } from "../src/actions/action";
import { MatrixDropdownColumn, matrixDropdownColumnTypes } from "../src/question_matrixdropdowncolumn";
import { QuestionMatrixDropdownRenderedErrorRow, QuestionMatrixDropdownRenderedRow } from "../src/question_matrixdropdownrendered";
import { AnimationGroup } from "../src/utils/animation";
import { setOldTheme } from "./oldTheme";
export default QUnit.module("Survey_QuestionMatrixDynamic");

QUnit.test("Matrixdropdown cells tests", function (assert) {
  var question = new QuestionMatrixDropdownModel("matrixDropdown");
  question.rows = ["row1", "row2", "row3"];
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.choices = [1, 2, 3];
  question.columns[1].cellType = "dropdown";
  question.columns[1]["choices"] = [4, 5];
  question.value = { row2: { column1: 2 } };
  var visibleRows = question.visibleRows;
  assert.equal(visibleRows.length, 3, "There are three rows");
  assert.equal(
    visibleRows[0].cells.length,
    2,
    "There are two cells in each row"
  );
  assert.equal(
    visibleRows[2].cells.length,
    2,
    "There are two cells in each row"
  );
  var q1 = <QuestionDropdownModel>visibleRows[0].cells[0].question;
  var q2 = <QuestionDropdownModel>visibleRows[0].cells[1].question;
  assert.deepEqual(
    ItemValue.getData(q1.choices),
    ItemValue.getData(question.choices),
    "get choices from matrix"
  );
  assert.deepEqual(
    ItemValue.getData(q2.choices),
    ItemValue.getData(question.columns[1]["choices"]),
    "get choices from column"
  );
  assert.equal(visibleRows[0].cells[1].value, null, "value is not set");
  assert.equal(visibleRows[1].cells[0].value, 2, "value was set");

  question.value = null;
  visibleRows[0].cells[1].value = 4;
  assert.deepEqual(
    question.value,
    { row1: { column2: 4 } },
    "set the cell value correctly"
  );
  visibleRows[0].cells[1].value = null;
  assert.deepEqual(question.value, null, "set to null if all cells are null");
});
QUnit.test("Matrixdynamic cells tests", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDynamic");
  question.rowCount = 3;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.choices = [1, 2, 3];
  question.columns[1].cellType = "dropdown";
  question.columns[1]["choices"] = [4, 5];
  question.value = [{}, { column1: 2 }, {}];
  var visibleRows = question.visibleRows;
  assert.equal(visibleRows.length, 3, "There are three rows");
  assert.equal(
    visibleRows[0].cells.length,
    2,
    "There are two cells in each row"
  );
  assert.equal(
    visibleRows[2].cells.length,
    2,
    "There are two cells in each row"
  );
  var q1 = <QuestionDropdownModel>visibleRows[0].cells[0].question;
  var q2 = <QuestionDropdownModel>visibleRows[0].cells[1].question;
  assert.deepEqual(
    ItemValue.getData(q1.choices),
    ItemValue.getData(question.choices),
    "get choices from matrix"
  );
  assert.deepEqual(
    ItemValue.getData(q2.choices),
    ItemValue.getData(question.columns[1]["choices"]),
    "get choices from column"
  );
  assert.equal(visibleRows[0].cells[1].value, null, "value is not set");
  assert.equal(visibleRows[1].cells[0].value, 2, "value was set");

  question.value = null;
  visibleRows[1].cells[1].value = 4;
  assert.deepEqual(
    question.value,
    [{}, { column2: 4 }, {}],
    "set the cell value correctly"
  );
  visibleRows[1].cells[1].value = null;
  assert.deepEqual(
    question.value,
    [],
    "set to null if all cells are null - array is empty"
  );
});
QUnit.test(
  "Matrixdynamic make the question empty on null cell value, Bug #608",
  function (assert) {
    var question = new QuestionMatrixDynamicModel("matrixDynamic");
    question.rowCount = 3;
    question.columns.push(new MatrixDropdownColumn("column1"));
    question.columns.push(new MatrixDropdownColumn("column2"));
    var visibleRows = question.visibleRows;
    visibleRows[1].cells[0].question.value = 2;
    assert.deepEqual(
      question.value,
      [{}, { column1: 2 }, {}],
      "The value set correctly"
    );
    visibleRows[1].cells[0].question.value = null;
    assert.deepEqual(
      question.value,
      [],
      "Clear the question value if all cells are empty - empty array"
    );
  }
);

QUnit.test("Matrixdynamic set null value, Bug Editor #156", function (assert) {
  var survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.addNewPage();
  var question = new QuestionMatrixDynamicModel("matrixDynamic");
  question.rowCount = 3;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  survey.pages[0].addQuestion(question);
  /*
      question.value = null;
      assert.deepEqual(question.value, [{}, {}, {}], "Set null value correctly");
      */
  var visibleRows = question.visibleRows;
  assert.equal(visibleRows.length, 3, "There shoud be 3 rows");
});

QUnit.test("Matrixdropdown value tests after cells generation", function (
  assert
) {
  var question = new QuestionMatrixDropdownModel("matrixDropdown");
  question.rows = ["row1", "row2", "row3"];
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.choices = [1, 2, 3];
  question.columns[1]["choices"] = [4, 5];
  var visibleRows = question.visibleRows;
  question.value = { row2: { column1: 2 } };
  assert.equal(visibleRows[1].cells[0].value, 2, "value was set");
});
QUnit.test("Matrixdynamic value tests after cells generation", function (
  assert
) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.rowCount = 3;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.choices = [1, 2, 3];
  question.columns[1]["choices"] = [4, 5];
  var visibleRows = question.visibleRows;
  question.value = [{}, { column1: 2 }, {}];
  assert.equal(visibleRows[1].cells[0].value, 2, "value was set");
});
QUnit.test("Matrixdynamic set text to rowCount property, bug #439", function (
  assert
) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  new JsonObject().toObject({ type: "matrixdynamic", rowCount: "1" }, question);
  assert.equal(question.rowCount, 1, "Row count should be 1");
  question.addRow();
  assert.equal(question.rowCount, 2, "Row count should b 2 now");
});
QUnit.test("Matrixdynamic add/remove rows", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.name = "q1";
  page.addQuestion(question);
  question.rowCount = 3;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.value = [{}, { column1: 2 }, {}];
  question.removeRow(1);
  assert.equal(question.rowCount, 2, "one row is removed");
  assert.deepEqual(question.value, [], "value is null now - array is empty");
  assert.equal(
    survey.getValue("q1"),
    null,
    "survey value is undefined or null"
  );
  question.addRow();
  assert.equal(question.rowCount, 3, "one row is added");
});
QUnit.test("Matrixdynamic isRequireConfirmOnRowDelete", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.name = "q1";
  page.addQuestion(question);
  question.rowCount = 3;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.value = [{}, { column1: 2 }, {}];
  assert.equal(
    question.isRequireConfirmOnRowDelete(0),
    false,
    "empty row, confirmDelete = false"
  );
  assert.equal(
    question.isRequireConfirmOnRowDelete(1),
    false,
    "non empty row, confirmDelete = false"
  );
  question.confirmDelete = true;
  assert.equal(
    question.isRequireConfirmOnRowDelete(0),
    false,
    "empty row, confirmDelete = true"
  );
  assert.equal(
    question.isRequireConfirmOnRowDelete(1),
    true,
    "non empty row, confirmDelete = true"
  );
});
QUnit.test("Matrixdynamic required column", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.cellType = "text";
  question.rowCount = 2;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  var rows = question.visibleRows;
  assert.equal(question.hasErrors(), false, "No errors");
  question.columns[0].isRequired = true;
  assert.equal(rows.length, 2, "There are two rows");
  assert.equal(
    question.hasErrors(),
    true,
    "column1 should not be empty. All rows are empty"
  );
  assert.equal(
    question.getAllErrors().length,
    2,
    "There are totally two errors"
  );
  question.value = [{ column1: 2 }, {}];
  assert.equal(
    rows[0].cells[0].question.value,
    2,
    "The first cell has value 2"
  );
  assert.equal(
    question.hasErrors(),
    true,
    "column1 should not be empty. the second row is empty"
  );
  assert.equal(
    question.getAllErrors().length,
    1,
    "There are totally one errors"
  );
  question.value = [{ column1: 2 }, { column1: 3 }];
  assert.equal(
    question.hasErrors(),
    false,
    "column1 should not be empty. all values are set"
  );
  assert.equal(
    question.getAllErrors().length,
    0,
    "There are totally no errors"
  );
});
QUnit.test("Matrixdynamic column.validators", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.cellType = "text";
  question.rowCount = 2;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  assert.equal(question.hasErrors(), false, "No errors");
  question.columns[0].validators.push(new EmailValidator());
  question.rowCount = 0;
  question.rowCount = 2;
  question.value = [{ column1: "aaa" }, {}];
  assert.equal(question.hasErrors(), true, "column1 should has valid e-mail");
  question.value = [{ column1: "aaa@aaa.com" }, {}];
  assert.equal(question.hasErrors(), false, "column1 has valid e-mail");
});
QUnit.test("Matrixdynamic duplicationError", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.cellType = "text";
  question.rowCount = 2;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.keyName = "column1";
  assert.equal(question.hasErrors(), false, "No errors");
  question.value = [{ column1: "val1" }, {}];
  assert.equal(
    question.hasErrors(),
    false,
    "There is no errors, row[0].column1=val1"
  );
  question.value = [{ column1: "val1" }, { column1: "val1" }];
  assert.equal(
    question.hasErrors(),
    true,
    "There is the error, row[0].column1=val1 and row[1].column2=val1"
  );
  assert.equal(question.visibleRows[0].getQuestionByColumnName("column1").errors.length,
    1, "There is an error in the first row: errors.length");
  assert.equal(question.visibleRows[0].getQuestionByColumnName("column1").hasVisibleErrors,
    true, "There is an error in the first row: hasVisibleErrors");
  assert.equal(question.visibleRows[1].getQuestionByColumnName("column1").errors.length,
    1, "There is one error in the second row: errors.length");
  assert.equal(question.visibleRows[1].getQuestionByColumnName("column1").errors[0].visible,
    true, "There is one error in the second row: error is visible");
  assert.equal(question.visibleRows[1].getQuestionByColumnName("column1").hasVisibleErrors,
    true, "There is one error in the second row: hasVisibleErrors");
  question.value = [{ column1: "val1" }, { column1: "val2" }];
  assert.equal(question.hasErrors(), false, "There is no errors, row[0].column1=val1 and row[1].column2=val2");
});
QUnit.test("Matrixdynamic column.isUnique, matrixdynamic", function (assert) {
  var question = new QuestionMatrixDynamicModel("q1");
  question.cellType = "text";
  question.rowCount = 2;
  question.addColumn("column1").isUnique = true;
  question.addColumn("column2");
  question.addColumn("column3").isUnique = true;
  assert.equal(question.hasErrors(), false, "No errors");
  question.value = [{ column1: "val1" }, {}];
  assert.equal(
    question.hasErrors(),
    false,
    "There is no errors, row[0].column1=val1"
  );
  question.value = [{ column1: "val1" }, { column1: "val1" }];
  assert.equal(
    question.hasErrors(),
    true,
    "There is the error, row[0].column1=val1 and row[1].column2=val1"
  );
  assert.equal(question.visibleRows[0].getQuestionByColumnName("column1").errors.length,
    1, "There is error in the first row");
  assert.equal(
    question.visibleRows[1].getQuestionByColumnName("column1").errors.length,
    1,
    "There is one error in the second row"
  );
  question.value = [{ column1: "val1" }, { column1: "val2" }];
  assert.equal(
    question.hasErrors(),
    false,
    "There is no errors, row[0].column1=val1 and row[1].column2=val2"
  );

  question.value = [
    { column1: "val1", column2: "val1", column3: "val1" },
    { column1: "val2", column2: "val1", column3: "val1" },
  ];
  assert.equal(
    question.hasErrors(),
    true,
    "There is the error, row[0].column3=val1 and row[1].column3=val1"
  );
  assert.equal(
    question.visibleRows[0].getQuestionByColumnName("column3").errors.length,
    1, "There is an error in the first row");
  assert.equal(
    question.visibleRows[1].getQuestionByColumnName("column3").errors.length,
    1,
    "There is one error in the second row"
  );
  question.value = [
    { column1: "val1", column2: "val1", column3: "val1" },
    { column1: "val2", column2: "val1", column3: "val3" },
  ];
  assert.equal(question.hasErrors(), false, "There is no errors");
});
QUnit.test("Matrixdynamic column.isUnique, matrixdropdown", function (assert) {
  var question = new QuestionMatrixDropdownModel("q1");
  question.cellType = "text";
  question.rows = ["row1", "row2"];
  question.addColumn("column1").isUnique = true;
  question.addColumn("column2");
  assert.equal(question.hasErrors(), false, "No errors");
  question.value = { row1: { column1: "val1" } };
  assert.equal(
    question.hasErrors(),
    false,
    "There is no errors, row[0].column1=val1"
  );
  question.value = { row1: { column1: "val1" }, row2: { column1: "val1" } };
  assert.equal(question.hasErrors(),
    true, "There is the error, row[0].column1=val1 and row[1].column2=val1");
  assert.equal(
    question.visibleRows[0].getQuestionByColumnName("column1").errors.length,
    1, "There is an error in the first row");
  assert.equal(
    question.visibleRows[1].getQuestionByColumnName("column1").errors.length,
    1, "There is one error in the second row");
  question.value = { row1: { column1: "val1" }, row2: { column1: "val2" } };
  assert.equal(
    question.hasErrors(),
    false,
    "There is no errors, row[0].column1=val1 and row[1].column2=val2"
  );
});
QUnit.test("column.isUnique, support settings.comparator.caseSensitive", function (assert) {
  var question = new QuestionMatrixDropdownModel("q1");
  question.cellType = "text";
  question.rows = ["row1", "row2"];
  question.addColumn("column1").isUnique = true;
  assert.equal(question.hasErrors(), false, "No errors");
  question.value = { row1: { column1: "abc" }, row2: { column1: "Abc" } };
  assert.equal(
    question.hasErrors(),
    true,
    "There is an error, abc=Abc case-in-sensitive"
  );
  settings.comparator.caseSensitive = true;
  assert.equal(
    question.hasErrors(),
    false,
    "There is ann error, abc!=Abc case-sensitive"
  );
  settings.comparator.caseSensitive = false;
  question.useCaseSensitiveComparison = false;
  assert.equal(
    question.hasErrors(),
    true,
    "There is an error, abc=Abc case-in-sensitive, useCaseSensitiveComparison = false"
  );
  question.useCaseSensitiveComparison = true;
  assert.equal(
    question.hasErrors(),
    false,
    "There is ann error, abc!=Abc case-sensitive, useCaseSensitiveComparison = false"
  );
});
QUnit.test("Matrixdynamic duplicationError in detailPanel", function (assert) {
  var matrix = new QuestionMatrixDynamicModel("matrixDymanic");
  matrix.rowCount = 2;
  matrix.columns.push(new MatrixDropdownColumn("column1"));
  matrix.columns.push(new MatrixDropdownColumn("column2"));
  matrix.detailPanelMode = "underRow";
  matrix.detailPanel.addNewQuestion("text", "col_q1");
  matrix.keyName = "col_q1";
  assert.equal(matrix.hasErrors(), false, "No errors");
  matrix.value = [{ col_q1: "val1" }, {}];
  assert.equal(
    matrix.hasErrors(),
    false,
    "There is no errors, row[0].column1=val1"
  );
  matrix.value = [{ col_q1: "val1" }, { col_q1: "val1" }];
  assert.equal(
    matrix.hasErrors(),
    true,
    "There is the error, row[0].column1=val1 and row[1].column2=val1"
  );
  const rows = matrix.visibleRows;
  assert.equal(rows[0].isDetailPanelShowing, true, "detail panel row0 is showing");
  assert.equal(rows[1].isDetailPanelShowing, true, "detail panel row1 is showing");
  const row1Q = rows[1].detailPanel.getQuestionByName("col_q1");
  assert.equal(row1Q.errors.length, 1, "There is one error in the second row: errors.length");
  assert.equal(row1Q.errors[0].visible, true, "There is one error in the second row: error is visible");
  assert.equal(row1Q.hasVisibleErrors, true, "There is one error in the second row: hasVisibleErrors");
  matrix.value = [{ column1: "val1" }, { column1: "val2" }];
  assert.equal(matrix.hasErrors(), false, "There is no errors, row[0].column1=val1 and row[1].column2=val2");
});
QUnit.test("Matrixdynamic duplicationError and no errors in detailPanel, do not expand panels", function (assert) {
  var matrix = new QuestionMatrixDynamicModel("matrixDymanic");
  matrix.cellType = "text";
  matrix.rowCount = 2;
  matrix.columns.push(new MatrixDropdownColumn("column1"));
  matrix.columns.push(new MatrixDropdownColumn("column2"));
  matrix.detailPanelMode = "underRow";
  matrix.detailPanel.addNewQuestion("text", "col_q1");
  matrix.columns[0].isUnique = true;
  assert.equal(matrix.hasErrors(), false, "No errors");
  matrix.value = [{ column1: "val1" }, {}];
  assert.equal(
    matrix.hasErrors(),
    false,
    "There is no errors, row[0].column1=val1"
  );
  const rows = matrix.visibleRows;
  assert.equal(rows[0].isDetailPanelShowing, false, "detail panel row0 is showing, #1");
  assert.equal(rows[1].isDetailPanelShowing, false, "detail panel row1 is showing, #2");
  rows[1].getQuestionByName("column1").value = "val1";
  assert.equal(
    matrix.hasErrors(),
    true,
    "There is the error, row[0].column1=val1 and row[1].column2=val1"
  );
  assert.equal(rows[0].isDetailPanelShowing, false, "detail panel row0 is showing, #3");
  assert.equal(rows[1].isDetailPanelShowing, false, "detail panel row1 is showing, #4");
});

QUnit.test("Matrixdynamic: remove duplicationError in cells and in detailPanels", function (assert) {
  var matrix = new QuestionMatrixDynamicModel("matrixDymanic");
  matrix.cellType = "text";
  const col = new MatrixDropdownColumn("col1");
  matrix.columns.push(col);
  col.isUnique = true;
  matrix.columns.push(new MatrixDropdownColumn("col2"));
  matrix.detailPanelMode = "underRow";
  matrix.detailPanel.addNewQuestion("text", "col_q1");
  matrix.keyName = "col_q1";
  matrix.value = [{ col1: 3, col_q1: 3 }, { col1: 3, col_q1: 3 }, { col1: 3, col_q1: 3 }];
  assert.equal(matrix.hasErrors(), true, "There are errors");
  const rows = matrix.visibleRows;
  assert.equal(rows[0].isDetailPanelShowing, true, "detail panel row0 is showing");
  assert.equal(rows[1].isDetailPanelShowing, true, "detail panel row1 is showing");
  assert.equal(rows[2].isDetailPanelShowing, true, "detail panel row2 is showing");
  const row0Cell = rows[0].cells[0].question;
  const row1Cell = rows[1].cells[0].question;
  const row2Cell = rows[2].cells[0].question;
  rows[0].showDetailPanel();
  const row0Q = rows[0].detailPanel.getQuestionByName("col_q1");
  const row1Q = rows[1].detailPanel.getQuestionByName("col_q1");
  const row2Q = rows[2].detailPanel.getQuestionByName("col_q1");
  assert.equal(row0Cell.errors.length, 1, "row0 cell has error, #1");
  assert.equal(row1Cell.errors.length, 1, "row1 cell has error, #1");
  assert.equal(row2Cell.errors.length, 1, "row2 cell has error, #1");
  assert.equal(row0Q.errors.length, 1, "row0 detail panel question has error, #1");
  assert.equal(row1Q.errors.length, 1, "row1 detail panel question has error, #1");
  assert.equal(row2Q.errors.length, 1, "row2 detail panel question has error, #1");

  row0Cell.value = 1;
  row0Q.value = 1;
  assert.equal(row0Cell.errors.length, 0, "row0 cell has no errors, #2");
  assert.equal(row1Cell.errors.length, 1, "row1 cell has error, #2");
  assert.equal(row2Cell.errors.length, 1, "row2 cell has error, #2");
  assert.equal(row0Q.errors.length, 0, "row0 detail panel question no errors, #2");
  assert.equal(row1Q.errors.length, 1, "row1 detail panel question has error, #2");
  assert.equal(row2Q.errors.length, 1, "row2 detail panel question has error, #2");

  row1Cell.value = 2;
  row1Q.value = 2;
  assert.equal(row0Cell.errors.length, 0, "row0 cell has no errors, #3");
  assert.equal(row1Cell.errors.length, 0, "row1 cell has  no errors, #3");
  assert.equal(row2Cell.errors.length, 0, "row2 cell has  no errors, #3");
  assert.equal(row0Q.errors.length, 0, "row0 detail panel question has  no errors, #3");
  assert.equal(row1Q.errors.length, 0, "row1 detail panel question has  no errors, #3");
  assert.equal(row2Q.errors.length, 0, "row2 detail panel question has  no errors, #3");

  assert.equal(matrix.hasErrors(), false, "There are no errors");
});

QUnit.test("Matrixdynamic hasOther column", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.choices = [1, 2, 3];
  question.rowCount = 1;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns[0].hasOther = true;
  var rows = question.visibleRows;
  assert.equal(question.hasErrors(), false, "Everything is fine so far");
  rows[0].cells[0].question.value = "other";
  assert.equal(question.hasErrors(), true, "Should set other value");
});
QUnit.test("hasErrors for matrix on another page", function (assert) {
  const survey = new SurveyModel({
    pages: [
      {
        elements: [{ type: "text", name: "q1" }]
      },
      {
        elements: [
          {
            type: "matrixdynamic", name: "q2",
            rowCount: 1,
            columns: [{ name: "col1", cellType: "text", isRequired: true }]
          }]
      }
    ]
  });
  assert.equal(survey.pages[1].hasErrors(), true);
});
QUnit.test("Matrixdynamic adjust rowCount on setting the value", function (
  assert
) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.rowCount = 0;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.value = [{}, { column1: 2 }, {}];
  assert.equal(question.rowCount, 3, "It should be 3 rowCount");
  question.value = [{}, { column1: 2 }, {}, {}];
  assert.equal(question.rowCount, 4, "It should be 4 rowCount");
  question.value = [{ column1: 2 }];
  assert.equal(question.rowCount, 1, "RowCount is 1");
});
QUnit.test("Matrixdynamic minRowCount/maxRowCount", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.minRowCount = 3;
  question.maxRowCount = 5;
  assert.equal(question.rowCount, 3, "row count is min row count");
  question.rowCount = 5;
  assert.equal(question.rowCount, 5, "row count is 5");
  question.maxRowCount = 4;
  assert.equal(question.rowCount, 4, "row count is max row count");
  question.addRow();
  assert.equal(question.rowCount, 4, "row count is still max row count");
  question.minRowCount = 5;
  assert.equal(question.maxRowCount, 5, "maxRowCount = minRowCount");
  assert.equal(question.rowCount, 5, "row count is still max row count = 5");
});
QUnit.test("Matrixdynamic do not re-create the rows", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  var firstRowId = question.visibleRows[0].id;
  assert.notOk(
    firstRowId.indexOf("unde") > -1,
    "there should not be undefined in the row index"
  );
  var rowCount = question.visibleRows.length;
  question.addRow();
  assert.equal(question.visibleRows.length, rowCount + 1, "Add one row");
  assert.equal(
    question.visibleRows[0].id,
    firstRowId,
    "The first row is the same after row adding"
  );
  question.removeRow(question.rowCount - 1);
  assert.equal(
    question.visibleRows[0].id,
    firstRowId,
    "The first row is the same after row removing"
  );
  question.rowCount = 10;
  assert.equal(
    question.visibleRows[0].id,
    firstRowId,
    "The first row is the same after row count increasing"
  );
  question.rowCount = 1;
  assert.equal(
    question.visibleRows[0].id,
    firstRowId,
    "The first row is the same after row count decreasing"
  );
  question.value = [{ col1: 2 }];
  assert.equal(
    question.visibleRows[0].id,
    firstRowId,
    "The first row is the same after setting value"
  );
});

QUnit.test("Matrixdynamic change column properties on the fly", function (
  assert
) {
  var question = new QuestionMatrixDynamicModel("matrixDymanic");
  question.addColumn("col1");
  var rows = question.visibleRows;
  assert.equal(
    rows[0].cells[0].question.getType(),
    "dropdown",
    "the default cell type is 'dropdown'"
  );
  assert.equal(
    (<QuestionDropdownModel>rows[0].cells[0].question).choices.length,
    question.choices.length,
    "By use question.choices by default"
  );
  question.columns[0]["choices"] = [1, 2, 3, 4, 5, 6, 7];
  assert.equal(
    (<QuestionDropdownModel>rows[0].cells[0].question).choices.length,
    question.columns[0]["choices"].length,
    "Use column choices if set"
  );
});

QUnit.test("Matrixdynamic customize cell editors", function (assert) {
  /*
          col2 - invisible if col1 is empty, [item1, item2] - if col1 = 1 and [item3, item4] if col1 = 2
      */
  var matrix = new QuestionMatrixDynamicModel("matrixDymanic");
  matrix.addColumn("col1");
  matrix.addColumn("col2");
  matrix.columns[0]["choices"] = [1, 2];
  var survey = new SurveyModel();
  survey.addNewPage("p1");
  survey.pages[0].addQuestion(matrix);
  survey.onMatrixCellCreated.add(function (survey, options) {
    if (options.columnName == "col2") {
      options.cellQuestion.visible = options.rowValue["col1"] ? true : false;
    }
  });
  let columnName;
  let cellQuestionName;
  survey.onMatrixCellValueChanged.add(function (survey, options) {
    columnName = options.column.name;
    cellQuestionName = options.cellQuestion.name;
    if (options.columnName != "col1") return;
    var question = options.getCellQuestion("col2");
    question.visible = options.value ? true : false;
    if (options.value == 1) question.choices = ["item1", "item2"];
    if (options.value == 2) question.choices = ["item3", "item4"];
  });
  matrix.rowCount = 1;
  var rows = matrix.visibleRows;
  var q1 = <QuestionDropdownModel>rows[0].cells[0].question;
  var q2 = <QuestionDropdownModel>rows[0].cells[1].question;
  assert.equal(q2.visible, false, "col2 is invisible if col1 is empty");
  q1.value = 1;
  assert.equal(columnName, "col1", "options.column, #1");
  assert.equal(cellQuestionName, "col1", "options.cellQuestion, #1");
  assert.equal(
    q2.choices[0].value,
    "item1",
    "col1 = 1, col2.choices = ['item1', 'item2']"
  );
  q1.value = 2;
  assert.equal(
    q2.choices[0].value,
    "item3",
    "col1 = 2, col2.choices = ['item3', 'item4']"
  );
  q1.value = null;
  assert.equal(q2.visible, false, "col2 is invisible if col1 = null");
  matrix.addRow();
  assert.equal(
    (<QuestionDropdownModel>rows[1].cells[1].question).visible,
    false,
    "row2. col2 is invisible if col1 = null"
  );
});

QUnit.test(
  "MatrixCellCreated set cell value https://github.com/surveyjs/surveyjs/issues/1259#issuecomment-413947851",
  function (assert) {
    var matrix = new QuestionMatrixDynamicModel("matrixDymanic");
    matrix.addColumn("col1");
    matrix.addColumn("col2");
    var survey = new SurveyModel();
    survey.addNewPage("p1");
    survey.pages[0].addQuestion(matrix);
    survey.onMatrixCellCreated.add(function (survey, options) {
      if (options.columnName === "col2") {
        options.cellQuestion.value = "A";
      }
      // if (options.columnName === "col1") {
      //   options.rowValue[options.columnName] = "B";
      //   //options.row.setValue(options.columnName, options.columnName);
      // }
    });
    matrix.rowCount = 1;
    assert.equal(matrix.visibleRows.length, 1, "one row");
    assert.deepEqual(
      matrix.value,
      [{ col2: "A" }], //[{ col1: "B", col2: "A" }],
      "col1 is B, col2 is A"
    );
  }
);

//QUnit.test("Matrixdynamic validate cell values - do not allow to have the same value", function (assert) {
QUnit.test(
  "Matrixdynamic validate cell values - onMatrixCellValueChanged",
  function (assert) {
    var matrix = new QuestionMatrixDynamicModel("matrixDymanic");
    matrix.cellType = "text";
    matrix.addColumn("col1");
    var survey = new SurveyModel();
    survey.addNewPage("p1");
    survey.pages[0].addQuestion(matrix);
    var cellQuestions = [];
    survey.onMatrixCellCreated.add(function (survey, options) {
      cellQuestions.push(options.cellQuestion);
    });
    var col1Question = undefined;
    survey.onMatrixCellValidate.add(function (survey, options) {
      if (options.value == "notallow") {
        options.error = "This cell is not allow";
      }
      col1Question = options.getCellQuestion("col1");
    });
    var rows = matrix.visibleRows;
    assert.equal(
      cellQuestions.length,
      2,
      "There are 2 cell questions in the array"
    );
    cellQuestions[0].value = "notallow";
    matrix.hasErrors(true);
    assert.equal(cellQuestions[0].errors.length, 1, "There is an error");
    cellQuestions[0].value = "allow";
    matrix.hasErrors(true);
    assert.equal(cellQuestions[0].errors.length, 0, "There is no errors");
    assert.equal(
      col1Question.name,
      "col1",
      "options.getQuestion works correctly"
    );
  }
);

QUnit.test(
  "Matrixdynamic validate cell values - do not allow to have the same value",
  function (assert) {
    var matrix = new QuestionMatrixDynamicModel("matrixDymanic");
    matrix.choices = [1, 2, 3];
    matrix.addColumn("col1");
    var survey = new SurveyModel();
    survey.addNewPage("p1");
    survey.pages[0].addQuestion(matrix);
    var cellQuestions = [];
    survey.onMatrixCellCreated.add(function (survey, options) {
      cellQuestions.push(options.cellQuestion);
    });
    survey.onMatrixCellValueChanged.add(function (survey, options) {
      //validate value on change
      options.getCellQuestion("col1").hasErrors(true);
    });
    survey.onMatrixCellValidate.add(function (survey, options) {
      var rows = options.question.visibleRows;
      for (var i = 0; i < rows.length; i++) {
        //we have the same row
        if (rows[i] === options.row) continue;
        if (rows[i].value && rows[i].value["col1"] == options.value) {
          options.error = "You have already select the same value";
        }
      }
    });
    var rows = matrix.visibleRows;
    assert.equal(
      cellQuestions.length,
      2,
      "There are 2 cell questions in the array"
    );
    cellQuestions[0].value = 1;
    assert.equal(cellQuestions[1].errors.length, 0, "There is now errors");
    cellQuestions[1].value = 1;
    assert.equal(cellQuestions[1].errors.length, 1, "There is an error");
    cellQuestions[1].value = 2;
    assert.equal(cellQuestions[1].errors.length, 0, "There no errors again");
  }
);
QUnit.test(
  "Matrixdynamic create different question types in one column",
  function (assert) {
    var matrix = new QuestionMatrixDropdownModel("matrixDymanic");
    matrix.addColumn("col1");
    matrix.rows = ["text", "dropdown", "checkbox"];
    var survey = new SurveyModel();
    survey.addNewPage("p1");
    survey.pages[0].addQuestion(matrix);
    survey.onMatrixCellCreating.add((sender, options) => {
      if (options.column.name !== "col1") return;
      options.cellType = options.row.rowName;
    });
    var rows = matrix.visibleRows;
    assert.equal(rows[0].cells[0].question.getType(), "text");
    assert.equal(rows[1].cells[0].question.getType(), "dropdown");
    assert.equal(rows[2].cells[0].question.getType(), "checkbox");
  }
);

QUnit.test(
  "Matrixdynamic onMatrixValueChanging - control the value in the cell",
  function (assert) {
    var json = {
      questions: [
        {
          type: "matrixdynamic",
          name: "q1",
          columns: [
            {
              name: "using",
              choices: ["Yes", "No"],
              cellType: "radiogroup",
            },
            {
              name: "experience",
              cellType: "text",
              visibleIf: "{row.using} = 'Yes'",
            },
          ],
        },
      ],
      clearInvisibleValues: "onHidden",
    };
    var survey = new SurveyModel(json);
    survey.onMatrixCellValueChanging.add(function (sender, options) {
      if (options.columnName == "experience" && !options.value) {
        options.value = options.oldValue;
      }
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    matrix.value = [{ using: "Yes", experience: "3" }];
    assert.equal(
      matrix.visibleRows[0].cells[1].question.value,
      "3",
      "Value is 3"
    );
    matrix.visibleRows[0].cells[0].question.value = "No";
    assert.equal(
      matrix.visibleRows[0].cells[1].question.value,
      "3",
      "Value is still 3"
    );
  }
);
QUnit.test("Matrixdropdown onMatrixValueChanging, bug#5396", function (assert) {
  const json = {
    questions: [
      {
        type: "matrixdropdown",
        name: "q1",
        columns: [{ name: "col1", cellType: "text" }],
        rows: ["row1"]
      },
    ]
  };
  const survey = new SurveyModel(json);
  survey.onMatrixCellValueChanging.add(function (sender, options) {
    options.value += "!";
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("q1");
  const cellQuestion = matrix.visibleRows[0].cells[0].question;
  cellQuestion.value = "test";
  assert.equal(cellQuestion.value, "test!", "Value has been changed");
  assert.deepEqual(survey.data, { q1: { row1: { col1: "test!" } } }, "Correct survey data");
});

QUnit.test("Matrixdropdown different cell types", function (assert) {
  var question = new QuestionMatrixDropdownModel("matrixDropdown");

  question.columns.push(new MatrixDropdownColumn("dropdown"));
  question.columns.push(new MatrixDropdownColumn("checkbox"));
  question.columns.push(new MatrixDropdownColumn("radiogroup"));
  question.columns.push(new MatrixDropdownColumn("text"));
  question.columns.push(new MatrixDropdownColumn("comment"));
  question.columns.push(new MatrixDropdownColumn("boolean"));

  for (var i = 0; i < question.columns.length; i++) {
    question.columns[i].cellType = question.columns[i].name;
  }
  question.rows = ["row1", "row2", "row3"];

  for (var i = 0; i < question.columns.length; i++) {
    var col = question.columns[i];
    var row = question.visibleRows[0];
    assert.equal(
      row.cells[i].question.getType(),
      col.name,
      "Expected " + col.name + ", but was" + row.cells[i].question.getType()
    );
  }
});
QUnit.test("Matrixdropdown boolean cellType", function (assert) {
  var question = new QuestionMatrixDropdownModel("matrixDropdown");

  question.columns.push(new MatrixDropdownColumn("col1"));
  question.columns.push(new MatrixDropdownColumn("col2"));
  question.cellType = "boolean";

  question.rows = ["row1"];
  var visibleRows = question.visibleRows;
  visibleRows[0].cells[0].question.value = true;
  visibleRows[0].cells[1].question.value = false;
  assert.deepEqual(
    question.value,
    { row1: { col1: true, col2: false } },
    "Boolean field set value correctly"
  );
});
QUnit.test("Matrixdropdown booleanDefaultValue", function (assert) {
  var question = new QuestionMatrixDropdownModel("matrixDropdown");

  question.columns.push(new MatrixDropdownColumn("col1"));
  question.columns.push(new MatrixDropdownColumn("col2"));
  question.cellType = "boolean";
  question.columns[0]["defaultValue"] = "true";
  question.columns[1]["defaultValue"] = "false";

  question.rows = ["row1"];
  var visibleRows = question.visibleRows;
  assert.deepEqual(
    question.value,
    { row1: { col1: true, col2: false } },
    "Boolean field set value correctly"
  );
});

QUnit.test("Matrixdropdown defaultValue", function (assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "matrixdropdown",
        name: "q1",
        defaultValue: { row1: { col1: 1 } },
        columns: [
          {
            name: "col1",
            choices: [1, 2, 3],
          },
        ],
        rows: [
          {
            value: "row1",
          },
        ],
      },
    ],
  });
  var question = <QuestionMatrixDropdownModel>survey.getQuestionByName("q1");
  assert.deepEqual(
    question.value,
    { row1: { col1: 1 } },
    "default value has been assign"
  );
});

QUnit.test("matrixdynamic.defaultValue - check the complex property", function (
  assert
) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [{ name: "col1" }, { name: "col2" }],
        defaultValue: [
          { col1: 1, col2: 2 },
          { col1: 3, col2: 4 },
        ],
      },
    ],
  });
  assert.deepEqual(
    survey.getValue("matrix"),
    [
      { col1: 1, col2: 2 },
      { col1: 3, col2: 4 },
    ],
    "set complex defaultValue correctly"
  );
});

QUnit.test("Matrixdropdown minRowCount", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrix");
  question.cellType = "text";
  question.rowCount = 2;
  question.addColumn("column1");
  var rows = question.visibleRows;
  assert.equal(
    question.hasErrors(),
    false,
    "There is no errors in the matrix. Null is possible"
  );
  assert.equal(rows[0].isEmpty, true, "There is no error in the first row");
  assert.equal(rows[1].isEmpty, true, "There is no error in the second row");
  question.minRowCount = 2;
  assert.equal(
    question.hasErrors(),
    false,
    "There is no errors in the matrix. question is not required"
  );
  question.minRowCount = 0;
  question.isRequired = true;
  assert.equal(question.hasErrors(), true, "Question is requried now");
  rows[0].cells[0].question.value = "val1";
  assert.equal(question.hasErrors(), false, "Question has value");
  question.minRowCount = 2;
  assert.equal(
    question.hasErrors(),
    true,
    "Error, value in two rows are required"
  );
  rows[1].cells[0].question.value = "val2";
  assert.equal(question.hasErrors(), false, "No errors, all rows have values");
});
QUnit.test("Matrixdropdown supportAutoAdvance property", function (
  assert
) {
  var question = new QuestionMatrixDropdownModel("matrix");
  question.rows = ["row1", "row2"];
  question.columns.push(new MatrixDropdownColumn("col1"));
  question.columns.push(new MatrixDropdownColumn("col2"));
  var rows = question.visibleRows;
  assert.equal(
    question.supportAutoAdvance(),
    false,
    "There is no value in rows"
  );
  question.value = { row1: { col1: 1, col2: 11 } };
  assert.equal(
    question.supportAutoAdvance(),
    false,
    "There is no value in the second row"
  );
  question.value = {
    row1: { col1: 1, col2: 11 },
    row2: { col1: 2, col2: 22 },
  };
  assert.equal(
    question.supportAutoAdvance(),
    true,
    "All row values are set"
  );
  question.value = { row1: { col1: 1 }, row2: { col1: 2, col2: 22 } };
  assert.equal(
    question.supportAutoAdvance(),
    false,
    "The first row is not set completely"
  );
});

QUnit.test(
  "Matrixdropdown supportAutoAdvance always false for checkbox",
  function (assert) {
    var question = new QuestionMatrixDropdownModel("matrix");
    question.rows = ["row1", "row2"];
    question.columns.push(new MatrixDropdownColumn("col1"));
    question.columns.push(new MatrixDropdownColumn("col2"));
    question.columns[1].cellType = "checkbox";
    var json = new JsonObject().toJsonObject(question);
    json.type = question.getType();
    question.columns.push(new MatrixDropdownColumn("col3"));
    question.columns.push(new MatrixDropdownColumn("col4"));
    new JsonObject().toObject(json, question);

    assert.equal(question.columns.length, 2, "There were two columns");
  }
);

QUnit.test("Text date supportAutoAdvance false", function (assert) {
  var question = new QuestionTextModel("text");
  assert.equal(question.supportAutoAdvance(), true, "Suppored");
  question.inputType = "date";
  assert.equal(
    question.supportAutoAdvance(),
    false,
    "Not suppored for date"
  );
});

QUnit.test("Matrixdropdown set columns", function (assert) {
  var question = new QuestionMatrixDropdownModel("matrix");
  question.rows = ["row1", "row2"];
  question.columns.push(new MatrixDropdownColumn("col1"));
  question.columns.push(new MatrixDropdownColumn("col2"));

  assert.equal(
    question.supportAutoAdvance(),
    false,
    "There is no value in rows"
  );
  question.value = { row1: { col1: 1, col2: 11 } };
  assert.equal(
    question.supportAutoAdvance(),
    false,
    "Checkbox doesn't support gotNextPageAutomatic"
  );
});

QUnit.test("Matrixdynamic column.visibleIf", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDynamic");
  question.rowCount = 2;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.columns.push(new MatrixDropdownColumn("column3"));
  const columns = question.columns;
  columns[0]["choices"] = [1, 2, 3];
  columns[1]["choices"] = [4, 5];
  columns[2]["choices"] = [7, 8, 9, 10];
  columns[2].isRequired = true;
  assert.equal(columns[0].visible, true, "columns[0].visible");
  assert.equal(columns[1].visible, true, "columns[1].visible");
  assert.equal(columns[2].visible, true, "columns[2].visible");
  question.columns[1].visibleIf = "{row.column1} = 2";
  question.columns[2].visibleIf = "{a} = 5";

  var visibleRows = question.visibleRows;
  var q1 = <QuestionDropdownModel>visibleRows[0].cells[0].question;
  var q2 = <QuestionDropdownModel>visibleRows[0].cells[1].question;
  var q3 = <QuestionDropdownModel>visibleRows[0].cells[2].question;

  var values = { a: 3 };
  question.runCondition(values, null);
  assert.equal(q1.visible, true, "1. q1 visibleIf is empty");
  assert.equal(q2.visible, false, "1. q2 visibleIf depends on column1 - false");
  assert.equal(
    q3.visible,
    false,
    "1. q3 visibleIf depends on external data - false"
  );
  assert.equal(
    question.hasErrors(),
    false,
    "1. q3 required column is invisible."
  );

  values = { a: 5 };
  question.runCondition(values, null);
  assert.equal(
    q3.visible,
    true,
    "2. q3 visibleIf depends on external data - true"
  );

  q1.value = 2;
  question.runCondition(values, null);
  assert.equal(q2.visible, true, "3. q2 visibleIf depends on column1 - true");
});
QUnit.test("Matrixdynamic column.enableIf", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDynamic");
  question.rowCount = 2;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.columns.push(new MatrixDropdownColumn("column3"));
  question.columns[0]["choices"] = [1, 2, 3];
  question.columns[1]["choices"] = [4, 5];
  question.columns[2]["choices"] = [7, 8, 9, 10];
  question.columns[2].isRequired = true;

  question.columns[1].enableIf = "{row.column1} = 2";
  question.columns[2].enableIf = "{a} = 5";

  var visibleRows = question.visibleRows;
  var q1 = <QuestionDropdownModel>visibleRows[0].cells[0].question;
  var q2 = <QuestionDropdownModel>visibleRows[0].cells[1].question;
  var q3 = <QuestionDropdownModel>visibleRows[0].cells[2].question;

  var values = { a: 3 };
  question.runCondition(values, null);
  assert.equal(q1.isReadOnly, false, "1. q1 enableIf is empty");
  assert.equal(
    q2.isReadOnly,
    true,
    "1. q2 enableIf depends on column1 - false"
  );
  assert.equal(
    q3.isReadOnly,
    true,
    "1. q3 enableIf depends on external data - false"
  );
  values = { a: 5 };
  question.runCondition(values, null);
  assert.equal(
    q3.isReadOnly,
    false,
    "2. q3 enableIf depends on external data - true"
  );

  q1.value = 2;
  question.runCondition(values, null);
  assert.equal(
    q2.isReadOnly,
    false,
    "3. q2 enableIf depends on column1 - true"
  );
});
QUnit.test("Matrixdynamic column.requiredIf", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDynamic");
  question.rowCount = 2;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.columns.push(new MatrixDropdownColumn("column3"));
  question.columns[0]["choices"] = [1, 2, 3];
  question.columns[1]["choices"] = [4, 5];
  question.columns[2]["choices"] = [7, 8, 9, 10];

  question.columns[1].requiredIf = "{row.column1} = 2";
  question.columns[2].requiredIf = "{a} = 5";

  var visibleRows = question.visibleRows;
  var q1 = <QuestionDropdownModel>visibleRows[0].cells[0].question;
  var q2 = <QuestionDropdownModel>visibleRows[0].cells[1].question;
  var q3 = <QuestionDropdownModel>visibleRows[0].cells[2].question;

  var values = { a: 3 };
  question.runCondition(values, null);
  assert.equal(q1.isRequired, false, "1. q1 requiredIf is empty");
  assert.equal(
    q2.isRequired,
    false,
    "1. q2 requireIf depends on column1 - false"
  );
  assert.equal(
    q3.isRequired,
    false,
    "1. q3 requiredIf depends on external data - false"
  );
  values = { a: 5 };
  question.runCondition(values, null);
  assert.equal(
    q3.isRequired,
    true,
    "2. q3 requiredIf depends on external data - true"
  );

  q1.value = 2;
  question.runCondition(values, null);
  assert.equal(
    q2.isRequired,
    true,
    "3. q2 requiredIf depends on column1 - true"
  );
});
QUnit.test("Matrixdynamic column.isRenderedRequired", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        columns: [
          { name: "column1", isRequired: true },
          { name: "column2", requiredIf: "{a} = 5" },
          { name: "column3", requiredIf: "{row.column1} = 2" }
        ]
      }
    ]
  });
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  question.rowCount = 2;
  const col1 = question.columns[0];
  const col2 = question.columns[1];
  const col3 = question.columns[2];

  assert.equal(col1.isRenderedRequired, true, "isRequired is true");
  assert.equal(col2.isRenderedRequired, false, "col2");
  assert.equal(col3.isRenderedRequired, false, "col3");
  const rows = question.visibleRows;
  survey.data = { a: 5 };
  assert.equal(col2.isRenderedRequired, true, "col2, condition is true, #2");
  assert.equal(col3.isRenderedRequired, false, "col3, #2");
  survey.data = { a: 3 };
  assert.equal(col2.isRenderedRequired, false, "col2, condition is false, #3");
  assert.equal(col3.isRenderedRequired, false, "col3, #3");
  rows[0].cells[0].value = 2;
  assert.equal(col3.isRenderedRequired, false, "col3, #4");
  rows[1].cells[0].value = 2;
  assert.equal(col3.isRenderedRequired, true, "col3, #5");
  rows[0].cells[0].value = 1;
  assert.equal(col3.isRenderedRequired, false, "col3, #6");
});
QUnit.test(
  "Matrixdynamic column.visibleIf, load from json and add item",
  function (assert) {
    var survey = new SurveyModel({
      questions: [
        {
          type: "matrixdynamic",
          rowCount: 1,
          columns: [
            { name: "col1", choices: [1, 2] },
            { name: "col2", visibleIf: "{row.col1} = 1" },
          ],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
    var rows = matrix.visibleRows;
    var q_0_1 = <QuestionDropdownModel>rows[0].cells[1].question;
    assert.equal(q_0_1.visible, false, "Initial the question is invisible");
    matrix.addRow();
    var q_1_1 = <QuestionDropdownModel>rows[1].cells[1].question;
    assert.equal(
      q_1_1.visible,
      false,
      "Initial the question in the added row is invisible"
    );
  }
);
QUnit.test(
  "Matrixdynamic column.visibleIf, hide column if all cells are invisible",
  function (assert) {
    var survey = new SurveyModel({
      questions: [
        {
          type: "matrixdynamic",
          name: "q1",
          rowCount: 2,
          columns: [
            { name: "col1", choices: [1, 2], visibleIf: "{q2}=1" },
            { name: "col2", visibleIf: "{row.col1} = 1" },
          ],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
    var rows = matrix.visibleRows;
    assert.equal(
      matrix.columns[0].hasVisibleCell,
      false,
      "The first column is invisible"
    );
    assert.equal(
      matrix.columns[1].hasVisibleCell,
      false,
      "The second column is invisible"
    );
    survey.setValue("q2", 1);
    let table = matrix.renderedTable;
    assert.equal(
      matrix.columns[0].hasVisibleCell,
      true,
      "The first column is visible"
    );
    assert.equal(
      matrix.columns[1].hasVisibleCell,
      false,
      "The second column is still invisible"
    );
    matrix.visibleRows[0].cells[0].question.value = 1;
    assert.equal(
      matrix.columns[1].hasVisibleCell,
      true,
      "The second column is visible now"
    );
    matrix.visibleRows[1].cells[0].question.value = 1;
    assert.equal(
      matrix.columns[1].hasVisibleCell,
      true,
      "The second column is visible now, #2"
    );
    matrix.visibleRows[0].cells[0].question.value = 2;
    assert.equal(
      matrix.columns[1].hasVisibleCell,
      true,
      "The second column is visible now, #3"
    );
    matrix.visibleRows[1].cells[0].question.value = 2;
    assert.equal(
      matrix.columns[1].hasVisibleCell,
      false,
      "The second column is invisible now"
    );
    survey.setValue("q2", 2);
    table = matrix.renderedTable;
    assert.equal(
      matrix.columns[0].hasVisibleCell,
      false,
      "The first column is invisible now"
    );
    //assert.equal(matrix.renderedTable.headerRow.cells.length, 0, "There is no cells headers");
    //assert.equal(matrix.renderedTable.rows[0].cells.length, 0, "There is no cells in rows");
  }
);

QUnit.test("MatrixDropdownColumn cell question", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrix");
  var column = question.addColumn("col1");
  assert.equal(
    column.templateQuestion.getType(),
    "dropdown",
    "The default type is dropdown"
  );
  question.cellType = "radiogroup";
  assert.equal(
    column.templateQuestion.getType(),
    "radiogroup",
    "The default type is radiogroup"
  );
  column.cellType = "checkbox";
  assert.equal(
    column.templateQuestion.getType(),
    "checkbox",
    "The question type is checkbox"
  );
});

QUnit.test(
  "MatrixDropdownColumn cell question isEditableTemplateElement",
  function (assert) {
    var question = new QuestionMatrixDynamicModel("matrix");
    var column = question.addColumn("col1");
    assert.equal(
      column.templateQuestion.isEditableTemplateElement,
      true,
      "The question isEditableTemplateElement"
    );
  }
);

QUnit.test("MatrixDropdownColumn properties are in questions", function (
  assert
) {
  var column = new MatrixDropdownColumn("col1");
  column.title = "some text";
  assert.equal(column.templateQuestion.name, "col1", "name set into question");
  assert.equal(
    column.templateQuestion.title,
    "some text",
    "title into question"
  );
  column.cellType = "checkbox";
  assert.equal(
    column.templateQuestion.getType(),
    "checkbox",
    "cell type is changed"
  );
  assert.equal(
    column.templateQuestion.name,
    "col1",
    "name is still in question"
  );
  assert.equal(
    column.templateQuestion.title,
    "some text",
    "title is still in question"
  );
});
QUnit.test("MatrixDropdownColumn add/remove serialization properties", function (assert) {
  var column = new MatrixDropdownColumn("col1");
  assert.ok(column["placeholder"], "placeholder property has been created");
  assert.ok(column["locPlaceholder"], "Serialization property has been created for placeholder");
  column.cellType = "radiogroup";
  assert.notOk(column["placeholder"], "placeholder property has been removed");
  assert.notOk(column["locPlaceholder"], "Serialization property has been removed for placeholder");
});
QUnit.test("MatrixDropdownColumn cellType property, choices", function (assert) {
  var prop = Serializer.findProperty("matrixdropdowncolumn", "cellType");
  assert.ok(prop, "Property is here");
  let counter = 1; //default
  for (let key in matrixDropdownColumnTypes) counter++;
  assert.equal(prop.choices.length, counter, "get cell types from matrixDropdownColumnTypes");
  assert.equal(prop.choices[0], "default", "The first value is default");
  assert.equal(prop.choices[1], "dropdown", "The second value is default");
});

QUnit.test(
  "MatrixDropdownColumn copy local choices into cell question",
  function (assert) {
    var question = new QuestionMatrixDynamicModel("matrix");
    question.choices = [1, 2, 3];
    var column = question.addColumn("col1");
    column.cellType = "dropdown";
    column["choices"] = [4, 5];
    question.rowCount = 1;
    var rows = question.visibleRows;
    assert.equal(
      rows[0].cells[0].question["choices"].length,
      2,
      "There are 2 choices"
    );
    assert.equal(
      rows[0].cells[0].question["choices"][0].value,
      4,
      "The first value is 4"
    );
  }
);

QUnit.test("MatrixDropdownColumn load choices from json", function (assert) {
  var question = new QuestionMatrixDropdownModel("matrix");
  var json = {
    type: "matrixdropdown",
    name: "frameworksRate",
    choices: ["Excelent", "Good", "Average", "Fair", "Poor"],
    columns: [
      {
        name: "using",
        title: "Do you use it?",
        choices: ["Yes", "No"],
        cellType: "radiogroup",
      },
      {
        name: "experience",
        title: "How long do you use it?",
        cellType: "dropdown",
        choices: [
          { value: 5, text: "3-5 years" },
          { value: 2, text: "1-2 years" },
          {
            value: 1,
            text: "less than a year",
          },
        ],
      },
    ],
    rows: [{ value: "reactjs" }],
  };
  new JsonObject().toObject(json, question);
  var rows = question.visibleRows;
  assert.equal(
    rows[0].cells[1].question["choices"].length,
    3,
    "There are 3 choices"
  );
  assert.equal(
    rows[0].cells[1].question["choices"][0].value,
    5,
    "The first value is 5"
  );
});

QUnit.test(
  "MatrixDynamic do not generate an error on setting a non-array value",
  function (assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("page");
    var question = new QuestionMatrixDynamicModel("matrix");
    page.addElement(question);
    question.addColumn("col1");
    question.rowCount = 1;
    survey.setValue("matrix", "sometext");
    assert.equal(question.isEmpty(), true, "It does not generate the error");
  }
);

function updateObjsQuestions(objs: Array<any>, removeQuestion: boolean = false): void {
  for (var i = 0; i < objs.length; i++) {
    if (removeQuestion) {
      delete objs[i].question;
    } else {
      objs[i].question = objs[i].question.name;
    }
    if (!!objs[i].context) {
      objs[i].context = objs[i].context.name;
    }
  }
}

QUnit.test("matrixDynamic.addConditionObjectsByContext", function (assert) {
  var objs = [];
  var question = new QuestionMatrixDynamicModel("matrix");
  question.title = "Matrix";
  question.addColumn("col1", "Column 1");
  question.addColumn("col2");
  question.addConditionObjectsByContext(objs, null);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix[0].col1",
        text: "Matrix[0].Column 1",
        question: "matrix",
      },
      { name: "matrix[0].col2", text: "Matrix[0].col2", question: "matrix" },
    ],
    "addConditionObjectsByContext work correctly for matrix dynamic"
  );
  objs = [];
  question.addConditionObjectsByContext(objs, question.columns[0]);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix[0].col1",
        text: "Matrix[0].Column 1",
        question: "matrix",
      },
      { name: "matrix[0].col2", text: "Matrix[0].col2", question: "matrix" },
      { name: "row.col2", text: "row.col2", question: "matrix", context: "col1" },
    ],
    "addConditionObjectsByContext work correctly for matrix dynamic with context"
  );
  objs = [];
  question.addConditionObjectsByContext(objs, true);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix[0].col1",
        text: "Matrix[0].Column 1",
        question: "matrix",
      },
      { name: "matrix[0].col2", text: "Matrix[0].col2", question: "matrix" },
      { name: "matrix.row.col1", text: "Matrix.row.Column 1", question: "matrix", context: "matrix" },
      { name: "matrix.row.col2", text: "Matrix.row.col2", question: "matrix", context: "matrix" },
    ],
    "addConditionObjectsByContext work correctly for matrix dynamic with context equals true"
  );
});
QUnit.test("matrixDynamic.getNestedQuestions", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix", rowCount: 2,
        columns: [{ name: "col1", cellType: "text", visibleIf: "{row.col2} = 'a'" }, { cellType: "text", name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  let questions = q.getNestedQuestions();
  assert.equal(questions.length, 4, "4 cells");
  assert.equal(questions[0].name, "col1", "cells[0, 0]");
  assert.equal(questions[0].getType(), "text", "cells[0, 0]");
  assert.equal(questions[1].name, "col2", "cells[0, 1]");
  assert.equal(questions[0].name, "col1", "cells[1, 0]");
  assert.equal(questions[1].name, "col2", "cells[1, 1]");

  const rows = q.visibleRows;
  rows[1].getQuestionByColumnName("col2").value = "a";
  assert.equal(rows[0].cells[0].question.isVisible, false, "cell[0,0] is invisible");
  assert.equal(rows[1].cells[0].question.isVisible, true, "cell[1,0] is visible");
  questions = q.getNestedQuestions(true);
  assert.equal(questions.length, 3, "3 cells");
  assert.equal(questions[0].name, "col2", "cells[0, 0], visible");
  assert.equal(questions[1].name, "col1", "cells[1, 1], visible");
  assert.equal(questions[2].name, "col2", "cells[1, 1], visible");
  assert.equal(survey.getAllQuestions().length, 1, "No nested - one question");
  assert.equal(survey.getAllQuestions(true, true).length, 1 + 2, "Include design-time + 2 columns");
  assert.equal(survey.getAllQuestions(false, false, true).length, 1 + 4, "Include nested + 4 cells");
  assert.equal(survey.getAllQuestions(false, true, true).length, 1 + 4, "Include nested + 4 cells, ignore design-time");
  assert.equal(survey.getAllQuestions(true, false, true).length, 1 + 3, "Include nested + 3 visible cells");
  assert.equal(survey.getAllQuestions(true, true, true).length, 1 + 3, "Include nested + 3 visible cells, ignore design-time");
});
QUnit.test("matrixDynamic.addConditionObjectsByContext + settings.matrixMaxRowCountInCondition=0", function (assert) {
  settings.matrixMaxRowCountInCondition = 0;
  var objs = [];
  var question = new QuestionMatrixDynamicModel("matrix");
  question.title = "Matrix";
  question.addColumn("col1", "Column 1");
  question.addColumn("col2");
  question.addConditionObjectsByContext(objs, null);
  updateObjsQuestions(objs);
  assert.deepEqual(objs, [], "addConditionObjectsByContext work correctly for matrix dynamic");
  objs = [];
  question.addConditionObjectsByContext(objs, question.columns[0]);
  updateObjsQuestions(objs);
  assert.deepEqual(objs,
    [{ name: "row.col2", text: "row.col2", question: "matrix", context: "col1" }],
    "addConditionObjectsByContext work correctly for matrix dynamic with context"
  );
  objs = [];
  question.addConditionObjectsByContext(objs, true);
  updateObjsQuestions(objs);
  assert.deepEqual(objs,
    [
      { name: "matrix.row.col1", text: "Matrix.row.Column 1", question: "matrix", context: "matrix" },
      { name: "matrix.row.col2", text: "Matrix.row.col2", question: "matrix", context: "matrix" },
    ],
    "addConditionObjectsByContext work correctly for matrix dynamic with context equals true"
  );
  settings.matrixMaxRowCountInCondition = 1;
});
QUnit.test(
  "matrixDynamic.addConditionObjectsByContext + settings.matrixMaxRowCountInCondition",
  function (assert) {
    var objs = [];
    var question = new QuestionMatrixDynamicModel("matrix");
    question.title = "Matrix";
    question.addColumn("col1", "Column 1");
    question.addConditionObjectsByContext(objs, null);
    updateObjsQuestions(objs, true);
    assert.deepEqual(
      objs,
      [
        {
          name: "matrix[0].col1",
          text: "Matrix[0].Column 1",
        },
      ],
      "addConditionObjectsByContext work correctly for matrix dynamic"
    );
    question.rowCount = 0;
    settings.matrixMaxRowCountInCondition = 3;

    objs = [];
    question.addConditionObjectsByContext(objs, null);
    updateObjsQuestions(objs, true);
    assert.deepEqual(
      objs,
      [
        {
          name: "matrix[0].col1",
          text: "Matrix[0].Column 1",
        },
      ],
      "addConditionObjectsByContext work correctly for matrix dynamic, rowCount is 0"
    );
    question.rowCount = 4;
    objs = [];
    question.addConditionObjectsByContext(objs, null);
    updateObjsQuestions(objs, true);
    assert.deepEqual(
      objs,
      [
        {
          name: "matrix[0].col1",
          text: "Matrix[0].Column 1",
        },
        {
          name: "matrix[1].col1",
          text: "Matrix[1].Column 1",
        },
        {
          name: "matrix[2].col1",
          text: "Matrix[2].Column 1",
        },
      ],
      "addConditionObjectsByContext work correctly for matrix dynamic, rowCount is 4, but settings.matrixMaxRowCountInCondition is 3"
    );
    settings.matrixMaxRowCountInCondition = 1;
  }
);
QUnit.test("matrixDropdown.addConditionObjectsByContext", function (assert) {
  var objs = [];
  var question = new QuestionMatrixDropdownModel("matrix");
  question.addColumn("col1", "Column 1");
  question.addColumn("col2");
  question.rows = ["row1", "row2"];
  question.title = "Matrix";
  question.rows[0].text = "Row 1";
  question.addConditionObjectsByContext(objs, null);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix.row1.col1",
        text: "Matrix.Row 1.Column 1",
        question: "matrix",
      },
      {
        name: "matrix.row1.col2",
        text: "Matrix.Row 1.col2",
        question: "matrix",
      },
      {
        name: "matrix.row2.col1",
        text: "Matrix.row2.Column 1",
        question: "matrix",
      },
      {
        name: "matrix.row2.col2",
        text: "Matrix.row2.col2",
        question: "matrix",
      },
    ],
    "addConditionObjectsByContext work correctly for matrix dropdown"
  );
  objs = [];
  question.addConditionObjectsByContext(objs, question.columns[0]);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix.row1.col1",
        text: "Matrix.Row 1.Column 1",
        question: "matrix",
      },
      {
        name: "matrix.row1.col2",
        text: "Matrix.Row 1.col2",
        question: "matrix",
      },
      {
        name: "matrix.row2.col1",
        text: "Matrix.row2.Column 1",
        question: "matrix",
      },
      {
        name: "matrix.row2.col2",
        text: "Matrix.row2.col2",
        question: "matrix",
      },
      { name: "row.col2", text: "row.col2", question: "matrix", context: "col1" },
    ],
    "addConditionObjectsByContext work correctly for matrix dropdown with context"
  );
  objs = [];
  question.addConditionObjectsByContext(objs, true);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix.row1.col1",
        text: "Matrix.Row 1.Column 1",
        question: "matrix",
      },
      {
        name: "matrix.row1.col2",
        text: "Matrix.Row 1.col2",
        question: "matrix",
      },
      {
        name: "matrix.row2.col1",
        text: "Matrix.row2.Column 1",
        question: "matrix",
      },
      {
        name: "matrix.row2.col2",
        text: "Matrix.row2.col2",
        question: "matrix",
      },
      { name: "matrix.row.col1", text: "Matrix.row.Column 1", question: "matrix", context: "matrix" },
      { name: "matrix.row.col2", text: "Matrix.row.col2", question: "matrix", context: "matrix" },
    ],
    "addConditionObjectsByContext work correctly for matrix dropdown with context equals true"
  );
});

QUnit.test("matrixDynamic.getConditionJson", function (assert) {
  var names = [];
  var question = new QuestionMatrixDynamicModel("matrix");
  question.addColumn("col1").cellType = "dropdown";
  question.addColumn("col2").cellType = "dropdown";
  question.columns[0]["choices"] = [1, 2];
  question.columns[1].cellType = "checkbox";
  question.columns[1]["choices"] = [1, 2, 3];
  question.rowCount = 2;
  var json = question.getConditionJson("equals", "[0].col1");
  assert.deepEqual(json.choices, [1, 2], "column 1 get choices");
  assert.equal(json.type, "dropdown", "column 1 get type");
  json = question.getConditionJson("equals", "row.col2");
  assert.deepEqual(json.choices, [1, 2, 3], "column 2 get choices");
  assert.equal(json.type, "checkbox", "column 2 get type");
  json = question.getConditionJson("contains", "[0].col2");
  assert.equal(json.type, "radiogroup", "column 2 get type for contains");
});
QUnit.test("matrixDropdown.addConditionObjectsByContext, detail panel", function (assert) {
  var objs = [];
  var question = new QuestionMatrixDynamicModel("matrix");
  question.title = "Matrix";
  question.addColumn("col1", "Column 1");
  question.detailPanel.addNewQuestion("text", "q1").title = "Question 1";
  question.detailPanelMode = "underRow";
  question.addConditionObjectsByContext(objs, null);
  updateObjsQuestions(objs, true);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix[0].col1",
        text: "Matrix[0].Column 1",
      },
      {
        name: "matrix[0].q1",
        text: "Matrix[0].Question 1",
      },
    ],
    "addConditionObjectsByContext work correctly for matrix dynamic, #1"
  );
  objs = [];
  question.addConditionObjectsByContext(objs, question.columns[0]);
  updateObjsQuestions(objs, true);
  assert.deepEqual(
    objs,
    [
      {
        name: "matrix[0].col1",
        text: "Matrix[0].Column 1",
      },
      {
        name: "matrix[0].q1",
        text: "Matrix[0].Question 1",
      },
      {
        context: "col1",
        name: "row.q1",
        text: "row.Question 1",
      },
    ],
    "addConditionObjectsByContext work correctly for matrix dynamic, #2"
  );
});

QUnit.test("matrixDynamic.getConditionJson, detail panel", function (assert) {
  var names = [];
  var question = new QuestionMatrixDynamicModel("matrix");
  question.addColumn("col1").cellType = "dropdown";
  question.addColumn("col2").cellType = "dropdown";
  question.detailPanel.addNewQuestion("dropdown", "q1").choices = [1, 2];
  question.detailPanelMode = "underRow";
  question.rowCount = 2;
  var json = question.getConditionJson("equals", "[0].q1");
  assert.deepEqual(json.choices, [1, 2], "column 1 get choices");
  assert.equal(json.type, "dropdown", "column 1 get type");
});

QUnit.test("matrixDynamic.clearInvisibleValues", function (assert) {
  var names = [];
  var question = new QuestionMatrixDynamicModel("matrix");
  question.addColumn("col1").cellType = "dropdown";
  question.addColumn("col2").cellType = "dropdown";
  question.columns[0]["choices"] = [1, 2];
  question.columns[1]["choices"] = [1, 2, 3];
  question.rowCount = 2;
  question.value = [
    { col1: 1, col2: 4 },
    { col4: 1, col2: 2 },
  ];
  question.clearIncorrectValues();
  assert.deepEqual(
    question.value,
    [{ col1: 1 }, { col2: 2 }],
    "clear unexisting columns and values"
  );
});

QUnit.test("matrixDropdown.clearInvisibleValues", function (assert) {
  var names = [];
  var question = new QuestionMatrixDropdownModel("matrix");
  question.addColumn("col1").cellType = "dropdown";
  question.addColumn("col2").cellType = "dropdown";
  question.columns[0]["choices"] = [1, 2];
  question.columns[1]["choices"] = [1, 2, 3];
  question.rows = ["row1", "row2"];
  question.value = {
    row1: { col1: 1, col2: 4 },
    row0: { col1: 1 },
    row2: { col4: 1, col2: 2 },
  };
  question.clearIncorrectValues();
  assert.deepEqual(
    question.value,
    { row1: { col1: 1 }, row2: { col2: 2 } },
    "clear unexisting columns and values"
  );
});

QUnit.test(
  "matrixDropdown.clearInvisibleValues, do not clear totals, Bug#2553",
  function (assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "question1",
          rowCount: 1,
          columns: [
            {
              name: "Column1",
            },
            {
              name: "Column2",
            },
            {
              name: "Column3",
              cellType: "expression",
              totalType: "sum",
              expression: "{row.Column1}+{row.Column2}",
            },
          ],
          cellType: "text",
        },
      ],
    };

    var survey = new SurveyModel(json);
    var data = {
      "question1-total": { Column3: 3 },
      question1: [{ Column1: "1", Column2: "2", Column3: 3 }],
    };
    survey.data = data;
    survey.clearIncorrectValues(true);
    assert.deepEqual(survey.data, data, "values should be the same");
  }
);

QUnit.test("Set totals correctly for read-only question", function (assert) {
  var json = {
    elements: [
      {
        type: "matrixdynamic",
        name: "question1",
        rowCount: 1,
        columns: [
          {
            name: "Column1",
          },
          {
            name: "Column2",
          },
          {
            name: "Column3",
            cellType: "expression",
            totalType: "sum",
            expression: "{row.Column1}+{row.Column2}",
          },
        ],
        cellType: "text",
      },
    ],
  };

  var survey = new SurveyModel(json);
  survey.mode = "display";
  var data = {
    "question1-total": { Column3: 3 },
    question1: [{ Column1: "1", Column2: "2", Column3: 3 }],
  };
  survey.data = data;
  var question = <QuestionMatrixDynamicModel>(
    survey.getQuestionByName("question1")
  );
  var renderedTable = question.renderedTable;
  assert.equal(
    renderedTable.rows[0].cells[2].question.value,
    3,
    "Value for cell expression set correctly"
  );
  assert.equal(
    renderedTable.footerRow.cells[2].question.value,
    3,
    "Value for total row expression set correctly, #rendered table"
  );
  assert.equal(
    question.visibleTotalRow.cells[2].question.value,
    3,
    "Value for total row expression set correctly, #visibleTotalRow"
  );
  assert.deepEqual(survey.data, data, "values should be the same");
});

QUnit.test(
  "matrixdropdown.clearInvisibleValues do not call it on changing condition",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "q1",
          columns: [
            {
              name: "color",
              cellType: "text",
            },
          ],
          rows: [
            "1",
            {
              value: "2",
              visibleIf: "{var1}=1",
            },
            "3",
          ],
        },
      ],
    });
    var question = <QuestionMatrixDropdownModel>survey.getQuestionByName("q1");
    assert.equal(question.isEmpty(), true, "It is empty");
    survey.setValue("var1", 1);
    question.value = { "2": "abc" };
    survey.setValue("var1", 2);
    assert.deepEqual(question.value, { "2": "abc" }, "Change nothing");
    survey.setValue("var1", 1);
  }
);

QUnit.test("Matrixdropdown column.index", function (assert) {
  var question = new QuestionMatrixDropdownModel("matrixDropdown");
  question.rows = ["row1"];
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns.push(new MatrixDropdownColumn("column2"));
  question.columns.push(new MatrixDropdownColumn("column3"));
  for (var i = 0; i < question.columns.length; i++) {
    assert.equal(
      question.columns[i].index,
      i,
      "column.index is correct after push"
    );
  }
  question.columns.splice(1, 1);
  assert.equal(question.columns.length, 2, "now 2 columns");
  for (var i = 0; i < question.columns.length; i++) {
    assert.equal(
      question.columns[i].index,
      i,
      "column.index is correct after removing"
    );
  }
});
QUnit.test("Matrixdynamic allowAddRows property", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrix");
  assert.equal(question.allowAddRows, true, "allowAddRows is true by default");
  assert.equal(question.canAddRow, true, "canAddRow is true");
  question.allowAddRows = false;
  assert.equal(question.canAddRow, false, "canAddRow is false");
});
QUnit.test("Matrixdynamic allowRemoveRows property", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrix");
  question.rowCount = 2;
  assert.equal(
    question.allowRemoveRows,
    true,
    "allowRemoveRows is true by default"
  );
  assert.equal(question.canRemoveRows, true, "canRemoveRows is true");
  question.allowRemoveRows = false;
  assert.equal(question.canRemoveRows, false, "canRemoveRows is false");
  question.canRemoveRowsCallback = (allow: boolean): boolean => {
    return question.rowCount > 1;
  };
  assert.equal(question.canRemoveRows, true, "question.rowCount > 1");
  question.rowCount = 1;
  assert.equal(question.canRemoveRows, false, "not question.rowCount > 1");
});
QUnit.test("Matrixdynamic addRowButtonLocation", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrix");
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    false,
    "columnsLocation='horizontal', addRowButtonLocation='default', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    true,
    "columnsLocation='horizontal', addRowButtonLocation='default', #2"
  );
  question.addRowButtonLocation = "top";
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    true,
    "columnsLocation='horizontal', addRowButtonLocation='top', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    false,
    "columnsLocation='horizontal', addRowButtonLocation='top', #2"
  );
  question.addRowButtonLocation = "bottom";
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    false,
    "columnsLocation='horizontal', addRowButtonLocation='bottom', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    true,
    "columnsLocation='horizontal', addRowButtonLocation='bottom', #2"
  );
  question.addRowButtonLocation = "topBottom";
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    true,
    "columnsLocation='horizontal', addRowButtonLocation='topBottom', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    true,
    "columnsLocation='horizontal', addRowButtonLocation='topBottom', #2"
  );
  question.columnsLocation = "vertical";
  question.addRowButtonLocation = "default";
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    true,
    "columnsLocation='vertical', addRowButtonLocation='default', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    false,
    "columnsLocation='vertical', addRowButtonLocation='default', #2"
  );
  question.addRowButtonLocation = "top";
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    true,
    "columnsLocation='vertical', addRowButtonLocation='top', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    false,
    "columnsLocation='vertical', addRowButtonLocation='top', #2"
  );
  question.addRowButtonLocation = "bottom";
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    false,
    "columnsLocation='vertical', addRowButtonLocation='bottom', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    true,
    "columnsLocation='vertical', addRowButtonLocation='bottom', #2"
  );
  question.addRowButtonLocation = "topBottom";
  assert.equal(
    question.renderedTable.showAddRowOnTop,
    true,
    "columnsLocation='vertical', addRowButtonLocation='topBottom', #1"
  );
  assert.equal(
    question.renderedTable.showAddRowOnBottom,
    true,
    "columnsLocation='vertical', addRowButtonLocation='topBottom', #2"
  );
});

QUnit.test("Matrixdynamic showAddRow", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrix");
  assert.equal(question.renderedTable.showAddRow, true, "#1");
  question.readOnly = true;
  assert.equal(question.renderedTable.showAddRow, false, "#2");
  question.readOnly = false;
  assert.equal(question.renderedTable.showAddRow, true, "#3");
  question.rowCount = 0;
  question.allowAddRows = false;
  assert.equal(question.canAddRow, false, "question.canAddRow");
  assert.equal(question.renderedTable.showAddRowOnTop, false, "showAddRowOnTop");
  assert.equal(question.renderedTable.showAddRowOnBottom, false, "showAddRowOnBottom");
  assert.equal(question.renderedTable.showAddRow, false, "#4");
  question.hideColumnsIfEmpty = true;
  assert.equal(question.canAddRow, false, "question.canAddRow, #5");
  assert.equal(question.renderedTable.showAddRowOnTop, false, "showAddRowOnTop, #5");
  assert.equal(question.renderedTable.showAddRowOnBottom, false, "showAddRowOnBottom, #5");
  assert.equal(question.renderedTable.showAddRow, false, "#5");
  assert.equal(question.renderedTable.showTable, false, "#5");
  question.allowAddRows = true;
  assert.equal(question.canAddRow, true, "question.canAddRow, #6");
  assert.equal(question.renderedTable.showAddRow, true, "showAddRow #6");
  assert.equal(question.renderedTable.showTable, false, "showTable #6");
});

QUnit.test("matrix.rowsVisibleIf", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionMatrixDropdownModel("bestCar");
  qBestCar.addColumn("col1");
  qBestCar.rows = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.rowsVisibleIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(qBestCar.visibleRows.length, 0, "cars are not selected yet");
  qCars.value = ["BMW"];
  assert.equal(qBestCar.visibleRows.length, 1, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.visibleRows.length, 3, "3 cars are selected");
  qBestCar.rowsVisibleIf = "";
  assert.equal(qBestCar.visibleRows.length, 4, "there is no filter");
});
QUnit.test("matrix.rowsVisibleIf, use 'row.' context", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown", name: "matrix", rows: ["row1", "row2", "row3"],
        rowsVisibleIf: "{row.col1} != 'a'", cellType: "text", columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  var matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown");
  matrix.value = { row1: { col1: "a" } };
  assert.equal(matrix.visibleRows.length, 2, "row1 is hidden");
  assert.deepEqual(matrix.value, { row1: { col1: "a" } }, "matrix.value #1");
  matrix.value = { row1: { col1: "a" }, row3: { col1: "a" } };
  assert.equal(matrix.visibleRows.length, 1, "row1, row3 are hidden");
  matrix.clearValue();
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown again");
});
QUnit.test("matrix dropdown rowsVisibleIf, use 'row.' context && total", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown", name: "matrix", rows: ["row1", "row2", "row3"],
        rowsVisibleIf: "{row.col1} != 'a'", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2", totalType: "sum" }]
      }
    ]
  });
  var matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  matrix.value = { row1: { col2: 5 }, row2: { col2: 10 }, row3: { col2: 15 } };
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 30, "total sum #1");
  matrix.value = { row1: { col1: "a", col2: 5 }, row2: { col2: 10 }, row3: { col2: 15 } };
  assert.equal(matrix.visibleRows.length, 2, "row1 is hidden");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 25, "total sum #2");
  matrix.value = { row1: { col1: "a", col2: 5 }, row2: { col2: 10 }, row3: { col1: "a", col2: 15 } };
  assert.equal(matrix.visibleRows.length, 1, "row1, row3 are hidden");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 10, "total sum #3");
});
QUnit.test("matrix dropdown rowsVisibleIf, use 'row.' context && total", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "matrixdynamic", name: "matrix",
        rowsVisibleIf: "{row.col1} != {q1}", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2", totalType: "sum" }]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.value = [{ col1: "a", col2: 5 }, { col1: "b", col2: 10 }, { col1: "a", col2: 15 }];
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 30, "total sum #1");
  survey.setValue("q1", "b");
  assert.equal(matrix.visibleRows.length, 2, "row1 is hidden");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 20, "total sum #2");
  survey.setValue("q1", "a");
  assert.equal(matrix.visibleRows.length, 1, "row1, row3 are hidden");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 10, "total sum #3");
  survey.setValue("q1", "c");
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 30, "total sum #4");
});
QUnit.test("matrix dropdown rowsVisibleIf, use 'row.' context && no rows, Bug#8909", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "matrixdynamic", name: "matrix", rowCount: 3,
        rowsVisibleIf: "{row.col1} != {q1}", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2", totalType: "sum" }]
      },
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 0, "all rows are hidden");
  matrix.addRow();
  assert.equal(matrix.visibleRows.length, 0, "all rows are hidden #2");
  survey.setValue("q1", "a");
  assert.equal(matrix.visibleRows.length, 4, "all rows are show");
});
QUnit.test("matrix dropdown rowsVisibleIf, use 'row.' context && total && add new row, Bug#8909", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "matrixdynamic", name: "matrix",
        rowsVisibleIf: "{row.col1} != {q1}", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2", totalType: "sum" }]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.value = [{ col1: "a", col2: 5 }, { col1: "b", col2: 10 }, { col1: "a", col2: 15 }];
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 30, "total sum #1");
  survey.setValue("q1", "a");
  assert.equal(matrix.visibleRows.length, 1, "row1, row3 are hidden");
  assert.equal(matrix.visibleTotalRow.cells[1].value, 10, "total sum #2");
  matrix.addRow();
  assert.equal(matrix.visibleRows.length, 2, "add new row");
  matrix.visibleRows[1].cells[1].value = 40;
  assert.equal(matrix.visibleTotalRow.cells[1].value, 50, "total sum #3");
});
QUnit.test("matrix dropdown rowsVisibleIf, defaultValue & designMode, Bug#9279", function (assert) {
  const json = {
    elements: [
      {
        type: "matrixdropdown", name: "matrix",
        rowsVisibleIf: "{row.col1} != 'a'", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2" }],
        defaultValue: { row1: { col1: "a", col2: 5 }, row2: { col1: "b", col2: 10 }, row3: { col1: "a", col2: 15 } },
        rows: ["row1", "row2", "row3"]
      }
    ]
  };
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON(json);
  let matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 3, "show all rows");
  survey.setDesignMode(false);
  survey.fromJSON(json);
  matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 1, "row1, row3 are hidden");
});
QUnit.test("matrix dropdown rowsVisibleIf, use 'row.' context & set data correctly", function (assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "matrixdynamic", name: "matrix",
        rowsVisibleIf: "{row.col1} != {q1}", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.value = [{ col1: "a", col2: 5 }, { col1: "b", col2: 10 }, { col1: "a", col2: 15 }];
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown");
  survey.setValue("q1", "a");
  assert.equal(matrix.visibleRows.length, 1, "row1, row3 are hidden");
  matrix.visibleRows[0].cells[1].value = 100;
  assert.deepEqual(matrix.value, [{ col1: "a", col2: 5 }, { col1: "b", col2: 100 }, { col1: "a", col2: 15 }], "Value set correctly");
  survey.doComplete();
  assert.deepEqual(matrix.value, [{ col1: "b", col2: 100 }], "Remove items correctly");
});
QUnit.test("Invisible rows & validation, Bug#8853", function (assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: ["row1", "row2", "row3"] },
      {
        type: "matrixdropdown", name: "matrix",
        rowsVisibleIf: "{q1} contains {item}", cellType: "text",
        columns: [{ name: "col1", isRequired: true }, { name: "col2", isRequired: true }],
        rows: ["row1", "row2", "row3"]
      },
    ]
  });
  const data = {
    q1: ["row2"],
    matrix: { row2: { col1: 1, col2: 2 } }
  };
  survey.data = data;
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 1, "one row is visible");
  assert.equal(matrix.validate(), true, "matrix validate");
  survey.doComplete();
  assert.equal(survey.state, "completed", "survey state");
  assert.deepEqual(survey.data, data, "survey.data");
});
QUnit.test("Do not clear data for shared values & rowsVisibleIf", function (assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "matrixdynamic", name: "matrix", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2" }]
      },
      {
        type: "matrixdynamic", name: "matrix1", valueName: "matrix",
        rowsVisibleIf: "{row.col1} = {q1}", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2" }]
      },
      {
        type: "matrixdynamic", name: "matrix2", valueName: "matrix",
        rowsVisibleIf: "{row.col1} != {q1}", cellType: "text",
        columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  survey.setValue("q1", "a");
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const matrix1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix1");
  const matrix2 = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix2");
  matrix.value = [{ col1: "a", col2: 5 }, { col1: "b", col2: 10 }, { col1: "a", col2: 15 }];
  assert.equal(matrix.visibleRows.length, 3, "all rows are shown in matrix");
  assert.equal(matrix1.visibleRows.length, 2, "2 rows are shown in matrix1");
  assert.equal(matrix2.visibleRows.length, 1, "1 row is shown in matrix2");
  assert.deepEqual(matrix.value, [{ col1: "a", col2: 5 }, { col1: "b", col2: 10 }, { col1: "a", col2: 15 }], "Value set correctly");
  survey.doComplete();
  assert.deepEqual(matrix.value, [{ col1: "a", col2: 5 }, { col1: "b", col2: 10 }, { col1: "a", col2: 15 }], "Values are shared we don't remove anything");
});
QUnit.test("matrixdropdown.rowsVisibleIf, clear value on making the value invisible", function (assert) {
  const survey = new SurveyModel({
    clearInvisibleValues: "onHidden",
    elements: [
      { type: "checkbox", name: "cars", choices: ["Audi", "BMW", "Mercedes", "Volkswagen"] },
      {
        type: "matrixdropdown", name: "bestCar", rows: ["Audi", "BMW", "Mercedes", "Volkswagen"],
        columns: [{ name: "col1" }, { name: "col2" }], cellType: "text", rowsVisibleIf: "{cars} contains {item}"
      }
    ]
  });
  const qBestCar = <QuestionMatrixDropdownModel>survey.getQuestionByName("bestCar");
  const cars = <QuestionCheckboxModel>survey.getQuestionByName("cars");
  cars.value = ["BMW", "Audi", "Mercedes"];
  assert.equal(qBestCar.visibleRows.length, 3, "visible rows #1");
  qBestCar.value = { BMW: { col1: 1 }, Audi: { col2: 2 } };
  assert.deepEqual(qBestCar.value, { BMW: { col1: 1 }, Audi: { col2: 2 } }, "Audi is selected");
  cars.value = ["BMW"];
  assert.equal(qBestCar.visibleRows.length, 1, "visible rows #2");
  survey.doComplete();
  assert.deepEqual(qBestCar.value, { BMW: { col1: 1 } }, "Audi is removed");
  survey.clear(false);
  cars.value = ["Mercedes"];
  assert.equal(qBestCar.visibleRows.length, 1, "visible rows #3");
  survey.doComplete();
  assert.deepEqual(qBestCar.isEmpty(), true, "All checks are removed");
});

QUnit.test("matrix.defaultRowValue, apply from json and then from UI", function (
  assert
) {
  var json = {
    elements: [
      {
        type: "matrixdynamic",
        cellType: "text",
        name: "q1",
        columns: [
          { name: "column1" },
          { name: "column2" },
          { name: "column3" },
        ],
        rowCount: 2,
        defaultRowValue: { column1: "val1", column3: "val3" },
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  assert.deepEqual(
    question.value,
    [
      { column1: "val1", column3: "val3" },
      { column1: "val1", column3: "val3" },
    ],
    "defaultRowValue set correctly on json loading"
  );
  question.addRow();
  assert.deepEqual(
    question.value,
    [
      { column1: "val1", column3: "val3" },
      { column1: "val1", column3: "val3" },
      { column1: "val1", column3: "val3" },
    ],
    "defaultRowValue set correclty on adding row"
  );
});

QUnit.test(
  "matrix.defaultRowValue, defaultValue has higher priority than defaultRowValue",
  function (assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          cellType: "text",
          name: "q1",
          columns: [
            { name: "column1" },
            { name: "column2" },
            { name: "column3" },
          ],
          rowCount: 2,
          defaultRowValue: { column1: "val1", column3: "val3" },
          defaultValue: [
            { column1: "val2", column3: "val5" },
            { column2: "val2", column3: "val4" },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    assert.deepEqual(
      question.value,
      [
        { column1: "val2", column3: "val5" },
        { column2: "val2", column3: "val4" },
      ],
      "defaultValue is used"
    );
  }
);

QUnit.test("rowIndex variable, in text processing", function (assert) {
  var json = {
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [
          { name: "column1", cellType: "expression", expression: "{rowIndex}" },
        ],
        rowCount: 2,
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  var rows = question.visibleRows;
  assert.equal(rows[0].cells[0].question.value, 1, "The first row has index 1");
  assert.equal(rows[1].cells[0].question.value, 2, "The first row has index 2");
});
QUnit.test("rowValue variable, in text processing", function (assert) {
  var json = {
    elements: [
      {
        type: "matrixdropdown",
        name: "q1",
        columns: [
          {
            name: "column1",
            cellType: "expression",
            expression: "{rowValue} * 2",
          },
        ],
        rows: [1, 2, 3],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  var rows = question.visibleRows;
  assert.equal(
    rows[0].cells[0].question.value,
    2,
    "The first row has row name 1"
  );
  assert.equal(
    rows[1].cells[0].question.value,
    4,
    "The first row has row name 2"
  );
});
QUnit.test("rowValue variable in expression", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "q1",
        columns: [
          { name: "column1", cellType: "expression", expression: "{rowValue}" },
        ],
        rows: ["Row 1", "Row 2"],
      },
    ],
  });
  const question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const rows = question.visibleRows;
  assert.equal(rows[0].cells[0].question.value, "Row 1", "The first row has rowValue 'Row 1'");
  assert.equal(rows[1].cells[0].question.value, "Row 2", "The first row has rowValue 'Row 2'");
});
QUnit.test("rowName variable in expression", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "q1",
        columns: [
          { name: "column1", cellType: "expression", expression: "{rowName}" },
        ],
        rows: ["Row 1", "Row 2"],
      },
    ],
  });
  const question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const rows = question.visibleRows;
  assert.equal(rows[0].cells[0].question.value, "Row 1", "The first row has rowName 'Row 1'");
  assert.equal(rows[1].cells[0].question.value, "Row 2", "The first row has rowName 'Row 2'");
});
QUnit.test("row property in custom function", function (assert) {
  var rowCustomFunc = function (params: any) {
    var val = this.row.getValue(params[0]);
    return !!val ? val + val : "";
  };
  FunctionFactory.Instance.register("rowCustomFunc", rowCustomFunc);
  var json = {
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [
          { name: "col1", cellType: "text" },
          {
            name: "col2",
            cellType: "expression",
            expression: "rowCustomFunc('col1')",
          },
        ],
        rowCount: 2,
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  var rows = question.visibleRows;
  rows[0].cells[0].question.value = "abc";
  assert.equal(
    rows[0].cells[1].question.value,
    "abcabc",
    "Custom function with row property works correctly"
  );
  FunctionFactory.Instance.unregister("rowCustomFunc");
});

QUnit.test(
  "Complete example with totals and expressions: invoice example",
  function (assert) {
    Serializer.addProperty("itemvalue", "price:number");

    var getItemPrice = function (params) {
      var question = !!this.row
        ? this.row.getQuestionByColumnName(params[0])
        : null;
      if (!question) return 0;
      var selItem = question.selectedItem;
      return !!selItem ? selItem.price : 0;
    };
    FunctionFactory.Instance.register("getItemPrice", getItemPrice);
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          columns: [
            {
              name: "id",
              cellType: "expression",
              expression: "{rowIndex}",
            },
            {
              name: "phone_model",
              cellType: "dropdown",
              totalType: "count",
              totalFormat: "Items count: {0}",
              choices: [
                { value: "item1", price: 10 },
                { value: "item2", price: 20 },
              ],
            },
            {
              name: "price",
              cellType: "expression",
              expression: "getItemPrice('phone_model')",
              displayStyle: "currency",
            },
            {
              name: "quantity",
              cellType: "text",
              inputType: "number",
              totalType: "sum",
              totalFormat: "Total phones: {0}",
            },
            {
              name: "total",
              cellType: "expression",
              expression: "{row.quantity} * {row.price}",
              displayStyle: "currency",
              totalType: "sum",
              totalDisplayStyle: "currency",
              totalFormat: "Total: {0}",
            },
          ],
          rowCount: 1,
        },
        {
          name: "vatProcents",
          type: "text",
          defaultValue: 20,
        },
        {
          name: "vatTotal",
          type: "expression",
          expression: "{q1-total.total} * {vatProcents} / 100",
        },
        {
          name: "total",
          type: "expression",
          expression: "{q1-total.total} + {vatTotal}",
        },
      ],
    };
    var survey = new SurveyModel(json);
    var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");

    var rows = question.visibleRows;
    assert.equal(rows[0].cells[2].question.value, 0, "By default price is 0");
    rows[0].cells[1].question.value = "item1";
    assert.equal(rows[0].cells[2].question.value, 10, "Price is ten now");
    rows[0].cells[3].question.value = 5;
    assert.equal(
      rows[0].cells[4].question.value,
      10 * 5,
      "row totals calculated correctly"
    );

    question.addRow();
    assert.equal(question.visibleRows.length, 2, "There are two rows now");
    rows[1].cells[3].question.value = 3;
    rows[1].cells[1].question.value = "item2";
    assert.equal(
      rows[1].cells[2].question.value,
      20,
      "Price is 20 for second row"
    );
    assert.equal(
      rows[1].cells[4].question.value,
      20 * 3,
      "row totals calculated correctly for the second row"
    );

    var totalRow = question.renderedTable.footerRow;
    assert.equal(totalRow.cells[1].question.value, 2, "Two rows");
    assert.equal(totalRow.cells[3].question.value, 8, "5 + 3 items");
    assert.equal(
      totalRow.cells[4].question.value,
      10 * 5 + 20 * 3,
      "total for items"
    );
    var totalWihtVatQuestion = survey.getQuestionByName("total");
    assert.equal(
      totalWihtVatQuestion.value,
      (10 * 5 + 20 * 3) * 1.2,
      "total for items + VAT"
    );

    FunctionFactory.Instance.unregister("getItemPrice");
    Serializer.removeProperty("itemvalue", "price");
  }
);

QUnit.test("Expression with two columns doesn't work, bug#1199", function (
  assert
) {
  var json = {
    elements: [
      {
        type: "matrixdropdown",
        name: "q1",
        columns: [
          {
            name: "bldg",
            title: "Building",
            cellType: "text",
          },
          {
            name: "cont",
            title: "Contents",
            cellType: "text",
          },
          {
            name: "tot",
            title: "Total",
            cellType: "expression",
            expression: "{row.bldg} + {row.cont}",
          },
        ],
        cellType: "text",
        rows: [
          {
            value: "B",
            text: "Budgeted",
          },
          {
            value: "A",
            text: "Actual",
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionMatrixDropdownModel>survey.getQuestionByName("q1");
  question.value = { B: { bldg: 4, cont: 6 } };
  var rows = question.visibleRows;
  var val = question.value;
  assert.equal(val.B.tot, 10, "Expression equals 10");
});

QUnit.test(
  "defaultValue: false doesn't work for boolean column after removing row, bug#1266",
  function (assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          rowCount: 2,
          columns: [
            {
              name: "col1",
              cellType: "boolean",
              defaultValue: "false",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    var rows = question.visibleRows;
    assert.equal(rows.length, 2, "There are two rows");
    assert.deepEqual(
      question.value,
      [{ col1: false }, { col1: false }],
      "defaultValue set correctly"
    );
    question.removeRow(1);
    rows = question.visibleRows;
    assert.equal(rows.length, 1, "There is one row");
    assert.deepEqual(
      question.value,
      [{ col1: false }],
      "defaultValue is still there for the first row"
    );
  }
);

QUnit.test("Test copyDefaultValueFromLastEntry property", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("page");
  var question = <QuestionMatrixDynamicModel>(
    page.addNewQuestion("matrixdynamic", "question")
  );
  question.rowCount = 0;
  question.cellType = "text";
  question.addColumn("col1");
  question.addColumn("col2");
  question.addColumn("col3");
  question.copyDefaultValueFromLastEntry = true;
  question.addRow();
  question.visibleRows;
  assert.equal(question.isEmpty(), true, "It is empty");
  question.value = [{ col1: 1, col2: 2 }];
  question.addRow();
  assert.deepEqual(
    question.value,
    [
      { col1: 1, col2: 2 },
      { col1: 1, col2: 2 },
    ],
    "copyDefaultValueFromLastEntry is working"
  );
  question.defaultRowValue = { col1: 11, col3: 3 };
  question.addRow();
  assert.deepEqual(
    question.value,
    [
      { col1: 1, col2: 2 },
      { col1: 1, col2: 2 },
      { col1: 1, col2: 2, col3: 3 },
    ],
    "copyDefaultValueFromLastEntry is merging with defaultRowValue"
  );
});

QUnit.test("Text preprocessing with capital questions", function (assert) {
  var json = {
    elements: [
      {
        type: "matrixdropdown",
        name: "Q11",
        columns: [
          {
            name: "C11",
          },
        ],
        cellType: "text",
        rows: [
          {
            value: "R11",
            text: "{Q11.R11.C11} -- r11",
          },
        ],
      },
      {
        type: "matrixdropdown",
        name: "q1",
        columns: [
          {
            name: "c1",
          },
        ],
        cellType: "text",
        rows: [
          {
            value: "r1",
            text: "{Q1.R1.C1} -- r1",
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  survey.data = { Q11: { R11: { C11: "val11" } }, q1: { r1: { c1: "val1" } } };
  var q11 = <QuestionMatrixDropdownModel>survey.getQuestionByName("Q11");
  var q1 = <QuestionMatrixDropdownModel>survey.getQuestionByName("q1");
  assert.equal(
    q1.rows[0].locText.renderedHtml,
    "val1 -- r1",
    "lowcase name is fine"
  );
  assert.equal(
    q11.rows[0].locText.renderedHtml,
    "val11 -- r11",
    "uppercase name is fine"
  );
});

QUnit.test(
  "Text preprocessing with dot in question, column and row names",
  function (assert) {
    var json = {
      elements: [
        {
          type: "matrixdropdown",
          name: "q.1",
          columns: [
            {
              name: "c.1",
            },
          ],
          cellType: "text",
          rows: [
            {
              value: "r.1",
            },
          ],
        },
        {
          type: "text",
          name: "q1",
          title: "{q.1.r.1.c.1}",
        },
      ],
    };
    var survey = new SurveyModel(json);
    survey.data = { "q.1": { "r.1": { "c.1": "val1" } } };
    var q1 = <Question>survey.getQuestionByName("q1");
    assert.equal(q1.locTitle.renderedHtml, "val1", "work with dots fine");
  }
);

QUnit.test(
  "Shared matrix value name, Bug: Bug# https://surveyjs.answerdesk.io/ticket/details/T1322",
  function (assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          valueName: "shared",
          cellType: "text",
          columns: [
            {
              name: "col1",
            },
          ],
        },
        {
          type: "matrixdynamic",
          name: "q2",
          valueName: "shared",
          cellType: "text",
          columns: [
            {
              name: "col1",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var q1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    var q2 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q2");
    assert.equal(q1.visibleRows.length, 2, "q1 - two rows are by default");
    assert.equal(q2.visibleRows.length, 2, "q2 - two rows are by default");

    var newValue = [{ col1: 1 }, { col1: 2 }, { col1: 3 }];
    q1.value = newValue;
    assert.deepEqual(q1.value, newValue, "set correctly to the first question");
    assert.deepEqual(
      q2.value,
      newValue,
      "shared correctly to the second question"
    );
    assert.equal(3 * 2, q2.renderedTable.rows.length, "q2 renderedTable rows are correct, #1");
    q1.addRow();
    q1.visibleRows[3].cells[0].value = 4;
    newValue = [{ col1: 1 }, { col1: 2 }, { col1: 3 }, { col1: 4 }];
    assert.deepEqual(
      q2.visibleRows.length,
      4,
      "There are  4 rows in the second question"
    );
    assert.equal(4 * 2, q2.renderedTable.rows.length, "q2 renderedTable rows are correct, #2");
    assert.deepEqual(
      q1.value,
      newValue,
      "2. set correctly to the first question"
    );
    assert.deepEqual(
      q2.value,
      newValue,
      "2. shared correctly to the second question"
    );
  }
);

QUnit.test(
  "Copy matrix value on trigger, Bug# https://surveyjs.answerdesk.io/ticket/details/T1322",
  function (assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          cellType: "text",
          columns: [
            {
              name: "col1",
            },
          ],
        },
        {
          type: "matrixdynamic",
          name: "q2",
          cellType: "text",
          columns: [
            {
              name: "col1",
            },
          ],
        },
      ],
      triggers: [
        {
          type: "copyvalue",
          expression: "{copyValue} = true",
          setToName: "q2",
          fromName: "q1",
        },
      ],
    };
    var survey = new SurveyModel(json);
    var q1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    var q2 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q2");
    assert.equal(q1.visibleRows.length, 2, "q1 - two rows are by default");
    assert.equal(q2.visibleRows.length, 2, "q2 - two rows are by default");
    var newValue = [{ col1: 1 }, { col1: 2 }, { col1: 3 }];
    q1.value = newValue;
    assert.deepEqual(q1.value, newValue, "set correctly to the first question");
    var rowsChangedCounter = 0;
    q2.visibleRowsChangedCallback = function () {
      rowsChangedCounter++;
    };
    assert.equal(2 * 2, q2.renderedTable.rows.length, "q2 renderedTable rows are correct, #1");
    survey.setValue("copyValue", true);
    assert.equal(3 * 2, q2.renderedTable.rows.length, "q2 renderedTable rows are correct, #2");
    assert.deepEqual(
      q2.value,
      newValue,
      "set correctly to the second question on trigger"
    );
  }
);
QUnit.test("columnsVisibleIf produce the bug, Bug#1540", function (assert) {
  const json = {
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "matrixdynamic",
            name: "group_clinician_user_attributes",
            title: "Clinician members",
            columnsVisibleIf: "{item} != 'id'",
            columns: [
              {
                name: "id",
                cellType: "text",
              },
              {
                name: "user_id",
                title: "user",
                cellType: "dropdown",
                choices: [
                  {
                    value: "2",
                    text: "Test User 1",
                  },
                  {
                    value: "4",
                    text: "Test User 2",
                  },
                  {
                    value: "6",
                    text: "Test User 3",
                  },
                  {
                    value: "8",
                    text: "Test User 4",
                  },
                  {
                    value: "10",
                    text: "Test User 5",
                  },
                ],
              },
              {
                name: "role",
                cellType: "dropdown",
                visibleIf: "{row.user_id} notempty and {roles} notempty",
                choices: [
                  "PI",
                  "Collaborator",
                  "Co-Investigator",
                  "Technician",
                  "PhD-Student",
                  "Student",
                  "Post-Doc",
                  "Researcher",
                  "MD",
                ],
                optionsCaption: "not specified",
                choicesVisibleIf: "{roles} contains {item}",
              },
            ],
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  survey.data = {
    name: "excepturidd",
    roles: ["Co-Investigator", "Collaborator"],
    acl: [
      {
        group_id: "4",
        actions: ["read"],
      },
    ],
    owner_id: 1,
    group_clinician_user_attributes: [
      {
        id: 61,
        role: "Collaborator",
        user_id: 4,
      },
      {
        id: 63,
        role: null,
        user_id: 8,
      },
    ],
  };
  assert.equal(
    survey.getQuestionByName("group_clinician_user_attributes").name,
    "group_clinician_user_attributes",
    "There is no exception"
  );
});

QUnit.test("column.choicesEnableIf", function (assert) {
  var json = {
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 1,
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            choices: [1, 2, 3, 4],
          },
          {
            name: "col2",
            cellType: "dropdown",
            choices: [1, 2, 3, 4],
            choicesEnableIf: "{row.col1} contains {item}",
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var row = matrix.visibleRows[0];
  var col1Q = row.getQuestionByColumnName("col1");
  var col2Q = <QuestionDropdownModel>row.getQuestionByColumnName("col2");
  var col2TemplateQ = matrix.columns[1].templateQuestion;
  assert.equal(
    col2Q.choicesEnableIf,
    "{row.col1} contains {item}",
    "The choicesEnableIf property is set"
  );
  assert.ok(
    col2TemplateQ.loadingOwner,
    "loading owner is set to template question"
  );
  assert.ok(col2Q.loadingOwner, "loading owner is set to question");
  assert.equal(
    col2TemplateQ.isLoadingFromJson,
    false,
    "We are not loading from JSON template question"
  );
  assert.equal(
    col2Q.isLoadingFromJson,
    false,
    "We are not loading from JSON cell question"
  );
  matrix.columns[1].startLoadingFromJson();
  assert.equal(
    col2TemplateQ.isLoadingFromJson,
    true,
    "We are loading from JSON the template question"
  );
  assert.equal(
    col2Q.isLoadingFromJson,
    true,
    "We are loading from JSON the cell question"
  );
  matrix.columns[1].endLoadingFromJson();

  assert.equal(col2Q.choices.length, 4, "There are 4 choices");
  assert.equal(col2Q.choices[0].isEnabled, false, "First choice is disabled");
  assert.equal(col2Q.choices[1].isEnabled, false, "Second choice is disabled");
  col1Q.value = [1, 2];
  assert.equal(col2Q.choices[0].isEnabled, true, "First choice is enabled now");
  assert.equal(
    col2Q.choices[1].isEnabled,
    true,
    "The second choice is enabled now"
  );
  assert.equal(
    col2Q.choices[2].isEnabled,
    false,
    "The third choice is still disabled"
  );
});

QUnit.test(
  "register function on visibleChoices change calls many times, Bug#1622",
  function (assert) {
    var json = {
      questions: [
        {
          type: "matrixdynamic",
          name: "matrix",
          columns: [
            {
              name: "q1",
              choices: ["1", "2"],
            },
          ],
          rowCount: 2,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    var question = matrix.visibleRows[0].cells[0].question;
    var counter = 0;
    question.registerPropertyChangedHandlers(
      ["visibleChoices"],
      function () {
        counter++;
      }
    );
    matrix.columns[0].choices = ["1", "2", "3"];
    assert.deepEqual(question.choices.length, 3, "Choices set correctly");
    assert.equal(counter, 1, "There was only one change");
  }
);
QUnit.test(
  "customwidget.readOnlyChangedCallback doesn't work correctly, https://surveyjs.answerdesk.io/ticket/details/T1869",
  function (assert) {
    var isReadOnly = false;
    var isFitValue = false;
    CustomWidgetCollection.Instance.clear();
    CustomWidgetCollection.Instance.addCustomWidget({
      name: "customWidget",
      isFit: (question) => {
        var res = question.getType() == "text";
        if (res) {
          isFitValue = true;
          const onReadOnlyChangedCallback = function () {
            isReadOnly = question.isReadOnly;
          };
          question.readOnlyChangedCallback = onReadOnlyChangedCallback;
          onReadOnlyChangedCallback();
        }
        return res;
      },
    });
    var json = {
      elements: [
        {
          type: "dropdown",
          name: "renVer",
          choices: [1, 2],
          defaultValue: 1,
        },
        {
          type: "matrixdynamic",
          name: "m",
          columns: [
            {
              name: "DESC",
              cellType: "text",
              enableIf: "{renVer} = 2",
            },
          ],
          rowCount: 1,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("m");
    var rows = matrix.visibleRows;
    assert.equal(rows.length, 1, "rows are created");
    assert.equal(isFitValue, true, "cell text question is a custom widget");
    assert.equal(isReadOnly, true, "cell text question is readonly");
    CustomWidgetCollection.Instance.clear();
  }
);

QUnit.test("Values from invisible rows should be removed, #1644", function (
  assert
) {
  var json = {
    elements: [
      { type: "text", name: "q1" },
      {
        type: "matrixdropdown",
        name: "q2",
        columns: [{ name: "col1" }, { name: "col2" }],
        rows: [{ value: "row1", visibleIf: "{q1} = 1" }, "row2"],
      },
    ],
  };
  var survey = new SurveyModel(json);
  survey.data = { q1: 2, q2: { row1: { col1: "a" }, row2: { col2: "b" } } };
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("q2");
  assert.equal(matrix.visibleRows.length, 1, "One row is visible");
  survey.doComplete();
  assert.deepEqual(survey.data, { q1: 2, q2: { row2: { col2: "b" } } },
    "Remove value for invisible row"
  );
});

QUnit.test("matrix.hasTotal property", function (assert) {
  var matrix = new QuestionMatrixDropdownModel("q1");
  matrix.addColumn("col1");
  assert.equal(matrix.hasTotal, false, "There is no total");
  matrix.columns[0].totalType = "sum";
  assert.equal(matrix.hasTotal, true, "There is total now, totalType");
  matrix.columns[0].totalType = "none";
  assert.equal(matrix.hasTotal, false, "There is no total again");
  matrix.columns[0].totalExpression = "sumInArray({q1}, 'col1')";
  assert.equal(matrix.hasTotal, true, "There is total, total expression");
});

QUnit.test("Test matrix.totalValue, expression question", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var matrix = new QuestionMatrixDynamicModel("q1");
  page.addElement(matrix);
  matrix.addColumn("col1");
  matrix.addColumn("col2");
  matrix.addColumn("col3");
  matrix.columns[0].totalType = "sum";
  matrix.columns[1].totalType = "sum";
  matrix.columns[2].totalExpression = "{row.col1} + {row.col2}";
  matrix.value = [
    { col1: 1, col2: 10 },
    { col1: 2, col2: 20 },
    {},
    { col1: 4, col2: 40 },
  ];
  var row = matrix.visibleTotalRow;
  assert.ok(row, "Total row is not empty");
  assert.equal(row.cells.length, 3, "There are three cells here");
  var question = row.cells[0].question;
  assert.equal(
    question.getType(),
    "expression",
    "We can have only expression type cells in total"
  );
  assert.equal(
    question.expression,
    "sumInArray({self}, 'col1')",
    "Set expression correctly"
  );
  assert.equal(question.value, 1 + 2 + 4, "Calculated correctly");
  assert.equal(
    row.cells[1].value,
    10 + 20 + 40,
    "Calculated correctly, the second cell"
  );
  assert.equal(
    row.cells[2].value,
    1 + 2 + 4 + 10 + 20 + 40,
    "Calculated correctly, {row.col1} + {row.col2}"
  );
  assert.deepEqual(
    matrix.totalValue,
    { col1: 7, col2: 70, col3: 77 },
    "Total value calculated correctly"
  );
  assert.deepEqual(
    survey.getValue("q1-total"),
    { col1: 7, col2: 70, col3: 77 },
    "Total value set into survey correctly"
  );
});

QUnit.test("Test totals, different value types", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var matrix = new QuestionMatrixDynamicModel("q1");
  page.addElement(matrix);
  matrix.addColumn("col1");
  matrix.columns[0].totalType = "count";
  var value = [
    { col1: 1, col2: 10 },
    { col1: 2, col2: 20 },
    {},
    { col1: 3, col2: 40 },
  ];
  matrix.value = value;
  var rows = matrix.visibleRows;
  var row = matrix.visibleTotalRow;
  var question = row.cells[0].question;
  assert.equal(question.value, 3, "There are 3 values");
  matrix.columns[0].totalType = "min";
  survey.setValue("q2", 1);
  assert.equal(question.value, 1, "Min is 1");
  matrix.columns[0].totalType = "max";
  survey.setValue("q2", 2);
  assert.equal(question.value, 3, "Max is 3");
  matrix.columns[0].totalType = "avg";
  survey.setValue("q2", 3);
  assert.equal(question.value, 2, "Average is 2");
  matrix.columns[0].totalType = "sum";
  matrix.columns[0].totalFormat = "Sum: {0}";
  matrix.columns[0].totalDisplayStyle = "currency";
  survey.setValue("q2", 4);
  assert.equal(
    question.displayValue,
    "Sum: $6.00",
    "Use total column properties"
  );
});

QUnit.test("Test totals, load from JSON", function (assert) {
  var json = {
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 2,
        columns: [
          {
            name: "Column 1",
            totalType: "count",
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  var row = matrix.visibleTotalRow;
  var question = row.cells[0].question;
  assert.equal(question.value, 0, "The initial value is zero");
});

QUnit.test(
  "enableIf for new rows, Bug# https://surveyjs.answerdesk.io/ticket/details/T2065",
  function (assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          rowCount: 2,
          columns: [
            {
              name: "col1",
              cellType: "text",
            },
          ],
          enableIf: "{q} = 'a'",
        },
      ],
    };
    var survey = new SurveyModel(json);
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    assert.equal(
      matrix.visibleRows[0].cells[0].question.isReadOnly,
      true,
      "It is readOnly by default"
    );
    assert.equal(
      matrix.visibleRows[0].cells[0].question.readOnly,
      false,
      "Property is not read-only"
    );
    survey.setValue("q", "a");
    assert.equal(
      matrix.visibleRows[0].cells[0].question.isReadOnly,
      false,
      "It is not readOnly now"
    );
    matrix.addRow();
    assert.equal(
      matrix.visibleRows[2].cells[0].question.isReadOnly,
      false,
      "New added row is not readonly"
    );
    survey.clearValue("q");
    assert.equal(
      matrix.visibleRows[0].cells[0].question.isReadOnly,
      true,
      "The first row is readOnly again"
    );
    assert.equal(
      matrix.visibleRows[2].cells[0].question.isReadOnly,
      true,
      "The last row is readOnly"
    );
  }
);

QUnit.test("matrix dropdown + renderedTable.headerRow", function (assert) {
  var matrix = new QuestionMatrixDropdownModel("q1");
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.addColumn("col2");
  matrix.columns[1].minWidth = "100px";
  matrix.rows = ["row1", "row2", "row3"];
  assert.equal(matrix.renderedTable.showHeader, true, "Header is shown");
  var cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells.length, 3, "rows + 2 column");
  assert.equal(cells[0].hasTitle, false, "header rows, nothing to render");
  assert.equal(cells[0].minWidth, "", "minWidth is empty for row header");
  assert.equal(cells[0].width, "", "width is empty for row header");
  assert.equal(cells[1].hasTitle, true, "col1");
  assert.equal(cells[1].hasQuestion, false, "no question");
  assert.equal(cells[1].minWidth, "", "col1.minWidth");
  assert.notOk(cells[1].isRemoveRow, "do not have remove row");
  assert.equal(cells[1].locTitle.renderedHtml, "col1", "col1");
  assert.equal(cells[2].locTitle.renderedHtml, "col2", "col2");
  assert.equal(cells[2].minWidth, "100px", "col2.minWidth");

  matrix.rowTitleWidth = "400px";
  cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells[0].width, "400px", "col1 width get from rowTitleWidth");
  assert.equal(cells[0].minWidth, "400px", "col1 min-width get from rowTitleWidth");

  matrix.showHeader = false;
  assert.equal(matrix.renderedTable.showHeader, false, "Header is not shown");
  assert.notOk(!!matrix.renderedTable.headerRow, "Header row is null");

  //Test case for #2346 - set width to <td> in first row if header is hidden
  var firstRow = matrix.renderedTable.rows[1];
  assert.equal(
    firstRow.cells[2].minWidth,
    "100px",
    "Header is hidden: col2.minWidth"
  );
  assert.equal(
    firstRow.cells[0].width,
    "400px",
    "Header is hidden: col1 width get from rowTitleWidth"
  );

  matrix.columnLayout = "vertical";
  cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells.length, 3, "3 rows");
  assert.equal(cells[0].locTitle.renderedHtml, "row1", "row1");
  assert.equal(cells[2].locTitle.renderedHtml, "row3", "row1");

  matrix.showHeader = true;
  cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells.length, 4, "3 rows + columns");
  assert.equal(cells[0].hasTitle, false, "empty for header");
  assert.equal(cells[1].locTitle.renderedHtml, "row1", "row1");
  assert.equal(cells[1].row.rowName, "row1", "row is set in vertical column");
  assert.equal(cells[3].locTitle.renderedHtml, "row3", "row3");
});

QUnit.test("matrix dynamic + renderedTable.headerRow", function (assert) {
  var matrix = new QuestionMatrixDynamicModel("q1");
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.addColumn("col2");
  matrix.columns[1].minWidth = "100px";
  matrix.rowCount = 3;
  assert.equal(matrix.renderedTable.showHeader, true, "Header is shown");
  var cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells.length, 3, "2 column + remove row");
  assert.equal(cells[0].hasTitle, true, "col1");
  assert.equal(cells[0].hasQuestion, false, "no question");
  assert.equal(cells[0].locTitle.renderedHtml, "col1", "col1");
  assert.notOk(cells[0].isRemoveRow, "do not have remove row");
  assert.equal(cells[1].locTitle.renderedHtml, "col2", "col2");
  assert.equal(cells[2].hasTitle, false, "remove row");
  matrix.minRowCount = 3;
  cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells.length, 2, "2 column");
  assert.equal(cells[0].hasTitle, true, "col1");
  assert.equal(cells[0].locTitle.renderedHtml, "col1", "col1");
  assert.equal(cells[1].locTitle.renderedHtml, "col2", "col2");
  matrix.addRow();
  cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells.length, 3, "2 column + removeRow");
  matrix.showHeader = false;
  assert.equal(matrix.renderedTable.showHeader, false, "Header is not shown");
  assert.notOk(!!matrix.renderedTable.headerRow, "Header row is null");

  matrix.columnLayout = "vertical";
  assert.equal(
    matrix.renderedTable.showHeader,
    false,
    "Header is not shown, columnLayout is vertical"
  );
  matrix.showHeader = true;
  assert.equal(
    matrix.renderedTable.showHeader,
    false,
    "Header is not shown, columnLayout is still vertical"
  );
});

QUnit.test("matrix dropdown + renderedTable.rows", function (assert) {
  var matrix = new QuestionMatrixDropdownModel("q1");
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.addColumn("col2");
  matrix.columns[1].minWidth = "100px";
  matrix.rows = ["row1", "row2", "row3"];
  var rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 3 * 2, "There are 3 rows");
  var cells = rows[1].cells;
  assert.equal(cells.length, 3, "rows + 2 column");
  assert.equal(cells[0].hasTitle, true, "header rows");
  assert.equal(cells[0].locTitle.renderedHtml, "row1", "row1");
  assert.equal(cells[1].hasTitle, false, "col1");
  assert.equal(cells[1].hasQuestion, true, "col1 question");
  assert.equal(cells[1].question.getType(), "text", "col1.cellType");
  assert.notOk(cells[1].isRemoveRow, "col1 do not have remove row");

  assert.equal(cells[2].hasTitle, false, "col2");
  assert.equal(cells[2].hasQuestion, true, "col2 question");
  assert.equal(cells[2].question.getType(), "dropdown", "col2.cellType");
  assert.notOk(cells[2].isRemoveRow, "col1 do not have remove row");

  cells = rows[5].cells;
  assert.equal(cells[0].locTitle.renderedHtml, "row3", "row3");
  assert.equal(cells[1].question.getType(), "text", "col1.cellType");
  assert.equal(cells[2].question.getType(), "dropdown", "col2.cellType");

  matrix.columnLayout = "vertical";
  var rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 4, "2 columns");
  cells = rows[1].cells;
  assert.equal(cells.length, 4, "column + 3 rows");
  assert.equal(cells[0].locTitle.renderedHtml, "col1", "col1 title");
  assert.equal(cells[0].hasQuestion, false, "col1 title, no question");
  assert.equal(cells[1].question.getType(), "text", "row1.col1 cellType-text");
  assert.equal(cells[1].cell.column.name, "col1", "row1.col1 correct column");
  assert.equal(cells[3].question.getType(), "text", "row3.col1 cellType-text");
  assert.equal(cells[3].cell.column.name, "col1", "row3.col1 correct column");
  cells = rows[3].cells;
  assert.equal(cells[0].locTitle.renderedHtml, "col2", "col2 title");
  assert.equal(
    cells[1].question.getType(),
    "dropdown",
    "row1.col2 cellType-text"
  );
  assert.equal(cells[1].cell.column.name, "col2", "row1.col2 correct column");
  assert.equal(
    cells[3].question.getType(),
    "dropdown",
    "row3.col2 cellType-text"
  );
  assert.equal(cells[3].cell.column.name, "col2", "row3.col2 correct column");
});

QUnit.test("matrix dropdown + renderedTable.rows - title width", function (assert) {
  var matrix = new QuestionMatrixDropdownModel("q1");
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.addColumn("col2");
  matrix.rows = ["row1", "row2"];

  var rows;
  var cells;
  rows = matrix.renderedTable.rows.filter(r => !(r instanceof QuestionMatrixDropdownRenderedErrorRow));

  cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells[0].width, "", "header row col1 width get from rowTitleWidth");
  assert.equal(cells[0].minWidth, "", "header row col1 min-width get from rowTitleWidth");

  cells = rows[0].cells;
  assert.equal(cells[0].width, "", "row 1 col1 width get from rowTitleWidth");
  assert.equal(cells[0].minWidth, "", "row 1 col1 min-width get from rowTitleWidth");

  cells = rows[1].cells;
  assert.equal(cells[0].width, "", "row 2 col1 width get from rowTitleWidth");
  assert.equal(cells[0].minWidth, "", "row 2 col1 min-width get from rowTitleWidth");

  matrix.rowTitleWidth = "400px";
  rows = matrix.renderedTable.rows.filter(r => !(r instanceof QuestionMatrixDropdownRenderedErrorRow));

  cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells[0].width, "400px", "header row col1 width get from rowTitleWidth");
  assert.equal(cells[0].minWidth, "400px", "header row col1 min-width get from rowTitleWidth");

  cells = rows[0].cells;
  assert.equal(cells[0].width, "400px", "row 1 col1 width get from rowTitleWidth");
  assert.equal(cells[0].minWidth, "400px", "row 1 col1 min-width get from rowTitleWidth");

  cells = rows[1].cells;
  assert.equal(cells[0].width, "400px", "row 2 col1 width get from rowTitleWidth");
  assert.equal(cells[0].minWidth, "400px", "row 2 col1 min-width get from rowTitleWidth");

});

QUnit.test("matrix dynamic + renderedTable.rows", function (assert) {
  var matrix = new QuestionMatrixDynamicModel("q1");
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.addColumn("col2");
  matrix.columns[1].minWidth = "100px";
  matrix.rowCount = 3;
  var rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 3 * 2, "There are 3 rows");
  var cells = rows[1].cells;
  assert.equal(cells.length, 3, "2 column + remove");
  assert.equal(cells[0].hasTitle, false, "col1");
  assert.equal(cells[0].hasQuestion, true, "col1 question");
  assert.equal(cells[0].question.getType(), "text", "col1.cellType");
  assert.notOk(
    cells[0].isActionsCell,
    "col1 do not have remove row (in actions cell)"
  );
  assert.ok(cells[0].row, "col1 has row property set");

  assert.equal(cells[1].hasTitle, false, "col2");
  assert.equal(cells[1].hasQuestion, true, "col2 question");
  assert.equal(cells[1].question.getType(), "dropdown", "col2.cellType");
  assert.notOk(
    cells[1].isActionsCell,
    "col2 do not have remove row (in actions cell)"
  );

  assert.equal(cells[2].hasTitle, false, "remove row");
  assert.equal(cells[2].hasQuestion, false, "col2 question");
  assert.equal(cells[2].isActionsCell, true, "is Remove row (in actions cell)");
  assert.ok(!!cells[2].row, "is Remove has row property");

  cells = rows[5].cells;
  assert.equal(cells[0].question.getType(), "text", "col1.cellType");
  assert.equal(cells[1].question.getType(), "dropdown", "col2.cellType");
  assert.equal(cells[2].isActionsCell, true, "is Remove row (in actions cell)");

  matrix.minRowCount = 3;
  cells = matrix.renderedTable.rows[1].cells;
  assert.equal(cells.length, 2, "2 columns only");
  matrix.minRowCount = 2;
  cells = matrix.renderedTable.rows[1].cells;
  assert.equal(cells.length, 3, "2 columns + remove again");

  matrix.columnLayout = "vertical";
  rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 5, "2 columns + remove + errors");
  cells = rows[1].cells;
  assert.equal(cells.length, 4, "column + 3 rows");
  assert.equal(cells[0].locTitle.renderedHtml, "col1", "col1 title");
  assert.equal(cells[0].hasQuestion, false, "col1 title, no question");
  assert.equal(cells[1].question.getType(), "text", "row1.col1 cellType-text");
  assert.equal(cells[1].cell.column.name, "col1", "row1.col1 correct column");
  assert.ok(cells[1].row, "col1 has row property set");
  assert.equal(cells[3].question.getType(), "text", "row3.col1 cellType-text");
  assert.equal(cells[3].cell.column.name, "col1", "row3.col1 correct column");
  cells = rows[3].cells;
  assert.equal(cells[0].locTitle.renderedHtml, "col2", "col2 title");
  assert.equal(
    cells[1].question.getType(),
    "dropdown",
    "row1.col2 cellType-text"
  );
  assert.equal(cells[1].cell.column.name, "col2", "row1.col2 correct column");
  assert.equal(
    cells[3].question.getType(),
    "dropdown",
    "row3.col2 cellType-text"
  );
  assert.equal(cells[3].cell.column.name, "col2", "row3.col2 correct column");

  cells = rows[4].cells;
  assert.equal(cells.length, 4, "column + 3 rows");
  assert.equal(cells[0].hasTitle, false, "for column header");
  assert.notOk(cells[0].isActionsCell, "not a remove button (in actions cell)");
  assert.equal(
    cells[1].isActionsCell,
    true,
    "row1: it is a remove row (in actions cell)"
  );
  assert.ok(cells[1].row, "row1: it has a row");
  assert.equal(
    cells[3].isActionsCell,
    true,
    "row3: it is a remove row (in actions cell)"
  );
  assert.ok(cells[3].row, "row3: it has a row");

  matrix.minRowCount = 3;
  rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 2 * 2, "2 columns + errors");

  matrix.showHeader = false;
  cells = matrix.renderedTable.rows[1].cells;
  assert.equal(cells.length, 3, "3 rows");
  assert.equal(cells[0].question.getType(), "text", "row1.col1 cellType-text");
  assert.equal(cells[2].question.getType(), "text", "row3.col1 cellType-text");
});

QUnit.test("matrix dropdown + renderedTable + totals", function (assert) {
  var matrix = new QuestionMatrixDropdownModel("q1");
  matrix.totalText = "ABC:";
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.columns[0].totalType = "count";
  matrix.addColumn("col2");
  matrix.columns[1].minWidth = "100px";
  matrix.rows = ["row1", "row2", "row3"];

  assert.equal(matrix.renderedTable.showFooter, true, "Footer is shown");
  assert.ok(matrix.renderedTable.footerRow, "Footer row exists");
  matrix.columns[0].totalType = "none";

  assert.equal(matrix.renderedTable.showFooter, false, "Footer is not shown");
  assert.notOk(matrix.renderedTable.footerRow, "Footer row not exists");

  matrix.columns[0].totalType = "count";
  matrix.columnLayout = "vertical";
  assert.equal(
    matrix.renderedTable.showFooter,
    false,
    "Footer is not shown, columnLayout is vertical"
  );
  assert.notOk(
    matrix.renderedTable.footerRow,
    "Footer row not exists, columnLayout is vertical"
  );
  assert.equal(
    matrix.renderedTable.headerRow.cells[4].locTitle.renderedHtml,
    "ABC:",
    "total text"
  );
  matrix.columnLayout = "horizontal";
  assert.equal(
    matrix.renderedTable.showFooter,
    true,
    "Footer is not shown again"
  );
  assert.ok(matrix.renderedTable.footerRow, "Footer row exists");

  var cells = matrix.renderedTable.footerRow.cells;
  assert.equal(cells.length, 3, "rowHeader + 2 columns");
  assert.equal(cells[0].hasTitle, true, "header rows");
  assert.equal(cells[0].locTitle.renderedHtml, "ABC:", "footer rows");
  assert.equal(cells[0].hasQuestion, false, "footer rows, no question");
  assert.equal(cells[1].hasTitle, false, "total, not title");
  assert.equal(
    cells[1].question.getType(),
    "expression",
    "total, it is expression"
  );
  assert.equal(cells[2].hasTitle, false, "total, not title");
  assert.equal(cells[2].question.getType(), "expression", "total, it is expression");
  assert.equal(cells[2].minWidth, "100px", "total, set minWidth");

  matrix.columnLayout = "vertical";
  var rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 4, "2 columns");
  cells = rows[1].cells;
  assert.equal(cells.length, 5, "column + 3 rows + total");
  assert.equal(cells[0].locTitle.renderedHtml, "col1", "col1 title");
  assert.equal(cells[0].hasQuestion, false, "col1 title, no question");
  assert.equal(cells[1].question.getType(), "text", "row1.col1 cellType-text");
  assert.equal(cells[1].cell.column.name, "col1", "row1.col1 correct column");
  assert.equal(cells[3].question.getType(), "text", "row3.col1 cellType-text");
  assert.equal(cells[3].cell.column.name, "col1", "row3.col1 correct column");
  assert.equal(cells[4].question.getType(), "expression", "total, question");
  assert.equal(cells[4].hasTitle, false, "total, no title");
});

QUnit.test("matrix dynamic + renderedTable + totals", function (assert) {
  var matrix = new QuestionMatrixDynamicModel("q1");
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.columns[0].totalType = "count";
  matrix.addColumn("col2");
  matrix.columns[1].minWidth = "100px";
  matrix.rowCount = 3;

  var cells = matrix.renderedTable.headerRow.cells;
  assert.equal(cells.length, 3, "2 columns + total");
  assert.equal(cells[0].hasTitle, true, "header, col1");
  assert.equal(cells[0].locTitle.renderedHtml, "col1", "header, col1");
  assert.equal(cells[1].locTitle.renderedHtml, "col2", "header, col2");
  assert.equal(cells[2].hasTitle, false, "header total, there is no title");

  matrix.columnLayout = "vertical";
  var rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 5, "2 columns + remove + errors");
  cells = rows[4].cells;
  assert.equal(cells.length, 5, "column + 3 rows + total");
  assert.equal(cells[0].hasTitle, false, "for column header");
  assert.notOk(cells[0].isActionsCell, "not a remove button (in actions cell)");
  assert.equal(
    cells[1].isActionsCell,
    true,
    "row1: it is a remove row (in actions cell)"
  );
  assert.ok(cells[1].row, "row1: it has a row");
  assert.equal(
    cells[3].isActionsCell,
    true,
    "row3: it is a remove row (in actions cell)"
  );
  assert.ok(cells[3].row, "row3: it has a row");
  assert.equal(cells[4].hasTitle, false, "for total");
});

QUnit.test("matrix dynamic + renderedTable + add/remove rows", function (
  assert
) {
  var matrix = new QuestionMatrixDynamicModel("q1");
  matrix.addColumn("col1");
  matrix.columns[0].cellType = "text";
  matrix.columns[0].totalType = "count";
  matrix.addColumn("col2");
  matrix.columns[1].minWidth = "100px";
  matrix.rowCount = 3;

  assert.equal(matrix.renderedTable.rows.length, 3 * 2, "There are 3 rows");
  var firstRowId = matrix.renderedTable.rows[1].id;
  var thirdRowId = matrix.renderedTable.rows[5].id;
  matrix.addRow();
  assert.equal(matrix.renderedTable.rows.length, 4 * 2, "There are 4 rows");
  assert.equal(
    matrix.renderedTable.rows[1].id,
    firstRowId,
    "Do not recreate row1 Id"
  );
  assert.equal(
    matrix.renderedTable.rows[5].id,
    thirdRowId,
    "Do not recreate row3 Id"
  );
  matrix.removeRow(1);
  assert.equal(
    matrix.renderedTable.rows.length,
    3 * 2,
    "There are 3 rows after remove"
  );
  assert.equal(
    matrix.renderedTable.rows[1].id,
    firstRowId,
    "Do not recreate row1 Id on remove"
  );
  assert.equal(
    matrix.renderedTable.rows[3].id,
    thirdRowId,
    "Do not recreate row3 Id on remove"
  );
});
QUnit.test("matrix dynamic + renderedTable + remove buttons", function (assert) {
  const matrix = new QuestionMatrixDynamicModel("q1");
  matrix.addColumn("col1");
  matrix.rowCount = 0;

  assert.equal(matrix.renderedTable.rows.length, 0, "There are no rows");
  matrix.addRow();
  matrix.addRow();
  matrix.addRow();
  var rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 3 * 2, "There are 3 rows");
  assert.equal(rows[0].cells.length, 2, "column + delete button");
  assert.equal(
    rows[1].cells[1].isActionsCell,
    true,
    "it is an action cell, row0"
  );
  assert.equal(
    rows[3].cells[1].isActionsCell,
    true,
    "it is an action cell, row1"
  );
  assert.equal(
    rows[5].cells[1].isActionsCell,
    true,
    "it is an action cell, row2"
  );
  //Bug #3449
  matrix.columnLayout = "vertical";
  rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 3, "one column and remove buttons rows + errors rows");
  assert.equal(rows[1].cells[0].locTitle.renderedHtml, "col1", "column header");
  assert.equal(rows[2].cells.length, 4, "One empty cell and 3 delete buttons");
  assert.equal(rows[2].cells[0].isActionsCell, false, "there is no actions in first cell delete row");
  assert.equal(rows[2].cells[0].isEmpty, true, "cell is empty");
  assert.equal(rows[2].cells[1].isActionsCell, true, "there are actions in the second cell delete row");
  assert.equal(rows[2].cells[3].isActionsCell, true, "there are actions in the last cell delete row");
});

QUnit.test("matrix dynamic + renderedTable + optionsCaption and columnColCount", function (assert) {
  const matrix = new QuestionMatrixDynamicModel("q1");
  matrix.addColumn("col1");
  matrix.addColumn("col2");
  matrix.addColumn("col3");
  matrix.addColumn("col4");
  matrix.columns[1].cellType = "radiogroup";
  matrix.columns[2].placeholder = "col2 options";
  matrix.columns[3].cellType = "radiogroup";
  matrix.columns[3].colCount = 2;
  matrix.rowCount = 3;

  assert.equal(matrix.renderedTable.rows.length, 3 * 2, "There are 3 rows");
  matrix.optionsCaption = "My Caption";
  assert.equal(matrix.renderedTable.rows[1].cells[0].question["optionsCaption"], "My Caption", "options caption get from matrix");
  assert.equal(matrix.renderedTable.rows[1].cells[2].question["optionsCaption"], "col2 options", "options caption get from column");
  matrix.columnColCount = 3;
  assert.equal(matrix.renderedTable.rows[1].cells[1].question["colCount"], 3, "question col count get from matrix");
  assert.equal(matrix.renderedTable.rows[1].cells[3].question["colCount"], 2, "question col count get from column");
}
);

QUnit.test("matrix.rowsVisibleIf + renderedTable", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var qCars = new QuestionCheckboxModel("cars");
  qCars.choices = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  page.addElement(qCars);
  var qBestCar = new QuestionMatrixDropdownModel("bestCar");
  qBestCar.addColumn("col1");
  qBestCar.rows = ["Audi", "BMW", "Mercedes", "Volkswagen"];
  qBestCar.rowsVisibleIf = "{cars} contains {item}";
  page.addElement(qBestCar);
  assert.equal(
    qBestCar.renderedTable.rows.length,
    0,
    "cars are not selected yet"
  );
  qCars.value = ["BMW"];
  assert.equal(qBestCar.renderedTable.rows.length, 1 * 2, "BMW is selected");
  qCars.value = ["Audi", "BMW", "Mercedes"];
  assert.equal(qBestCar.renderedTable.rows.length, 3 * 2, "3 cars are selected");
  qBestCar.rowsVisibleIf = "";
  assert.equal(qBestCar.renderedTable.rows.length, 4 * 2, "there is no filter");
});
QUnit.test(
  "Matrixdynamic column.visibleIf, hide column if all cells are invisible + rendered table",
  function (assert) {
    var survey = new SurveyModel({
      questions: [
        {
          type: "matrixdynamic",
          name: "q1",
          rowCount: 2,
          columns: [
            { name: "col1", totalType: "count" },
            { name: "col2", choices: [1, 2], visibleIf: "{q2}=1" },
            { name: "col3", visibleIf: "{row.col1} = 1" },
          ],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
    var table = matrix.renderedTable;
    assert.equal(
      table.headerRow.cells.length,
      2,
      "Header: There is one visible column + Remove button"
    );
    assert.equal(
      table.rows[1].cells.length,
      2,
      "Rows: There is one visible column + Remove button"
    );
    assert.equal(
      table.footerRow.cells.length,
      2,
      "Footer: There is one visible column + Remove button"
    );
    matrix.columnLayout = "vertical";
    var rows = matrix.renderedTable.rows;
    assert.equal(rows.length, 3, "Only one column is shown + remove button + errrors row");
  }
);

QUnit.test(
  "Matrix validation in cells and async functions in expression",
  function (assert) {
    var returnResult: (res: any) => void;
    function asyncFunc(params: any): any {
      returnResult = this.returnResult;
      return false;
    }
    FunctionFactory.Instance.register("asyncFunc", asyncFunc, true);

    var question = new QuestionMatrixDynamicModel("q1");
    question.rowCount = 1;
    var column = question.addColumn("col1");
    column.validators.push(new ExpressionValidator("asyncFunc() = 1"));
    var rows = question.visibleRows;
    question.hasErrors();
    var onCompletedAsyncValidatorsCounter = 0;
    question.onCompletedAsyncValidators = (hasErrors: boolean) => {
      onCompletedAsyncValidatorsCounter++;
    };
    assert.equal(
      question.isRunningValidators,
      true,
      "We have one running validator"
    );
    assert.equal(
      onCompletedAsyncValidatorsCounter,
      0,
      "onCompletedAsyncValidators is not called yet"
    );
    returnResult(1);
    assert.equal(question.isRunningValidators, false, "We are fine now");
    assert.equal(
      onCompletedAsyncValidatorsCounter,
      1,
      "onCompletedAsyncValidators is called"
    );

    FunctionFactory.Instance.unregister("asyncFunc");
  }
);

QUnit.test(
  "onValueChanged doesn't called on adding new row with calculated column, #1845",
  function (assert) {
    var rowCount = 0;
    function newIndexFor(params) {
      if (!params[0]) {
        rowCount++;
      }
      return params[0] || rowCount;
    }
    FunctionFactory.Instance.register("newIndexFor", newIndexFor);
    var survey = new SurveyModel({
      questions: [
        {
          type: "matrixdynamic",
          name: "foo",
          columns: [
            {
              name: "bar",
              cellType: "text",
            },
            {
              name: "id",
              cellType: "expression",
              expression: "newIndexFor({row.id})",
            },
          ],
          rowCount: 1,
        },
      ],
    });
    var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("foo");
    var visibleRows = question.visibleRows;
    var counter = 0;
    survey.onValueChanged.add(function (sender, options) {
      counter++;
    });
    question.addRow();
    assert.equal(counter, 1, "onValueChanged has been called");
  }
);
QUnit.test("survey.onMatrixAllowRemoveRow", function (assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 3,
        columns: ["1", "2"],
      },
      {
        type: "matrixdynamic",
        name: "q2",
        rowCount: 3,
        columns: ["1", "2"],
      },
    ],
  });
  survey.onMatrixAllowRemoveRow.add(function (sender, options) {
    options.allow = options.rowIndex % 2 == 0;
  });
  const firstMatrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[1];
  assert.equal(firstMatrix.visibleRows.length, 3, "Three rows");
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[1];
  assert.equal(matrix.canRemoveRows, true, "The row can be removed");
  const table = matrix.renderedTable;
  assert.equal(
    table.rows[1].cells[2].isActionsCell,
    true,
    "The first row can be removed (in actions cell)"
  );
  assert.equal(
    table.rows[3].cells[2].isActionsCell,
    false,
    "The second row can't be removed (in actions cell)"
  );
  assert.equal(
    table.rows[5].cells[2].isActionsCell,
    true,
    "The third row can be removed (in actions cell)"
  );
});

QUnit.test("survey.onMatrixAllowRemoveRow, show remove for new rows only, Bug#5533", function (assert) {
  const survey = new SurveyModel({
    questions: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 0,
        columns: [{ name: "col1", cellType: "text" }],
      },
    ],
  });
  survey.onMatrixAllowRemoveRow.add(function (sender, options) {
    options.allow = options.row.isEmpty;
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  matrix.value = [{ col1: 1 }, { col1: 2 }];
  assert.equal(matrix.canRemoveRows, true, "The row can be removed");
  const table = matrix.renderedTable;
  matrix.addRow();
  assert.equal(3, matrix.visibleRows.length, "3 rows");
  assert.equal(table.hasRemoveRows, true, "table.hasRemoveRows");
  assert.equal(table.rows[1].cells[1].isActionsCell, false, "First cell");
  assert.equal(table.rows[3].cells[1].isActionsCell, false, "Second cell");
  assert.equal(table.rows[5].cells[1].isActionsCell, true, "Third cell");
});

QUnit.test("remove action as icon or button, settings.matrixRenderRemoveAsIcon", function (assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 2,
        columns: [{ name: "1" }, { name: "2" }],
      },
    ],
  });
  survey.css.root = "sd-root-modern";
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  var table = matrix.renderedTable;
  assert.equal(
    table.rows[1].cells[2].isActionsCell,
    true,
    "The first row can be removed (in actions cell)"
  );
  assert.equal(survey.css.root, "sd-root-modern", "Survey css root set correctly");
  assert.equal(table.rows[1].cells[2].item.value.actions[0].component, "sv-action-bar-item", "Render as icon");
  settings.matrixRenderRemoveAsIcon = false;
  //Reset table
  matrix.showHeader = false;
  table = matrix.renderedTable;
  assert.equal(table.rows[1].cells[2].item.value.actions[0].component, "sv-matrix-remove-button", "Render as button");
  settings.matrixRenderRemoveAsIcon = true;
  survey.css.root = undefined;
});

QUnit.test("column is requriedText, Bug #2297", function (assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 2,
        columns: [{ name: "1", isRequired: true }, { name: "2" }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  var table = matrix.renderedTable;
  assert.equal(
    table.headerRow.cells[0].requiredMark,
    "*",
    "required Text is here"
  );
  assert.notOk(table.headerRow.cells[1].requiredMark, "required Text is empty");
  matrix.columnsLocation = "vertical";
  table = matrix.renderedTable;
  assert.equal(
    table.rows[1].cells[0].requiredMark,
    "*",
    "The first cell in the row is a column header now"
  );
});

QUnit.test(
  "two shared matrixdynamic - should be no errors, Bug #T3121 (https://surveyjs.answerdesk.io/ticket/details/T3121)",
  function (assert) {
    var survey = new SurveyModel({
      questions: [
        {
          type: "matrixdynamic",
          name: "employer_names",
          valueName: "qualita",
          isRequired: true,
          columns: [
            {
              name: "name",
              cellType: "text",
              isRequired: true,
            },
          ],
          rowCount: 4,
          minRowCount: 4,
          maxRowCount: 4,
        },
        {
          type: "radiogroup",
          name: "qualitypriority",
          choices: [
            {
              value: "0",
              text: "{qualita[0].name}",
            },
            {
              value: "1",
              text: "{qualita[1].name}",
            },
            {
              value: "2",
              text: "{qualita[2].name}",
            },
            {
              value: "3",
              text: "{qualita[3].name}",
            },
          ],
        },
        {
          type: "paneldynamic",
          name: "arrray_qualita",
          valueName: "qualita",
          templateElements: [
            {
              type: "radiogroup",
              name: "competenza",
              choices: [
                {
                  value: "0",
                },
                {
                  value: "1",
                },
                {
                  value: "2",
                },
                {
                  value: "3",
                },
              ],
            },
          ],
        },
      ],
    });
    var test_qualita = [
      { name: "Leadership", competenza: "3" },
      { name: "Team working", competenza: "2" },
      { name: "Iniziativa", competenza: "1" },
      { name: "Autonomia", competenza: "2" },
    ];
    survey.setValue("qualita", test_qualita);
    var matrixDynamic = survey.getQuestionByName("employer_names");
    assert.deepEqual(matrixDynamic.value, test_qualita, "Value set correctly");
  }
);

QUnit.test(
  "Totals in row using total in matrix, Bug #T3162 (https://surveyjs.answerdesk.io/ticket/details/T3162)",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columns: [
            {
              name: "paid",
            },
            {
              name: "free",
            },
            {
              name: "total",
              totalType: "sum",
              cellType: "expression",
              expression: "{row.free} + {row.paid}",
            },
            {
              name: "percentage",
              cellType: "expression",
              expression: "({row.free} + {row.paid}) / {totalRow.total}",
            },
          ],
          cellType: "text",
          rows: [
            {
              value: "international",
            },
          ],
        },
      ],
    });
    var matrix = <QuestionMatrixDropdownModel>(
      survey.getQuestionByName("matrix")
    );
    var rows = matrix.visibleRows;
    rows[0].cells[0].value = 100;
    rows[0].cells[1].value = 100;
    assert.equal(rows[0].cells[2].value, 200, "cell1 + cell2");
    assert.equal(rows[0].cells[3].value, 1, "(cell1 + cell2)/total");
  }
);

QUnit.test(
  "The row numbers is incorrect after setting the value: survey.data, Bug #1958",
  function (assert) {
    var survey = new SurveyModel({
      questions: [
        {
          type: "matrixdynamic",
          name: "teachersRate",
          cellType: "radiogroup",
          rowCount: 0,
          choices: [
            {
              value: 1,
            },
            {
              value: 0,
            },
            {
              value: -1,
            },
          ],
          columns: [
            {
              name: "subject",
              cellType: "dropdown",
              choices: [1, 2, 3],
            },
            {
              name: "explains",
            },
          ],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>(
      survey.getQuestionByName("teachersRate")
    );
    survey.data = {
      teachersRate: [
        { subject: 1, explains: 0 },
        { subject: 2, explains: 1 },
      ],
    };

    survey.data = { teachersRate: [{ subject: 1, explains: 0 }] };
    var rows = matrix.visibleRows;
    assert.equal(rows.length, 1, "we reset the number of rows to 1.");

    matrix.addRow();
    matrix.addRow();
    survey.data = { teachersRate: [{ subject: 1, explains: 0 }] };
    rows = matrix.visibleRows;
    assert.equal(rows.length, 1, "we reset the number of rows to 1 again.");
  }
);

QUnit.test(
  "Change question in rendered cell on changing column type, Bug https://github.com/surveyjs/survey-creator/issues/690",
  function (assert) {
    var survey = new SurveyModel({
      questions: [
        {
          type: "matrixdynamic",
          name: "teachersRate",
          rowCount: 1,
          choices: [1, 2],
          columns: [
            {
              name: "subject",
            },
          ],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>(
      survey.getQuestionByName("teachersRate")
    );

    assert.equal(
      matrix.renderedTable.rows[0].cells[0].question.getType(),
      "dropdown",
      "Default cell type"
    );

    matrix.columns[0].cellType = "radiogroup";
    assert.equal(
      matrix.renderedTable.rows[0].cells[0].question.getType(),
      "radiogroup",
      "Cell type should be changed"
    );
  }
);

QUnit.test(
  "Column.totalformat property doesn't changed on changing survey locale",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          isRequired: true,
          columns: [
            {
              name: "col1",
              cellType: "text",
              totalType: "sum",
              totalFormat: {
                default: "Total column 1: {0}",
                de: "Total Spalt 1: {0}",
                fr: "Total colonne 1: {0}",
              },
              inputType: "number",
            },
          ],
          rows: [
            {
              value: "one",
              text: {
                default: "One",
                fr: " Un",
                de: " Ein",
              },
            },
          ],
        },
      ],
    });
    survey.setValue("matrix", { one: { col1: 10 } });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(
      matrix.renderedTable.footerRow.cells.length,
      2,
      "There are two cells in the footer row"
    );
    assert.equal(
      <QuestionExpressionModel>(
        matrix.renderedTable.footerRow.cells[1].question.displayValue
      ),
      "Total column 1: 10",
      "total for en locale is correct"
    );
    survey.locale = "de";
    assert.equal(
      <QuestionExpressionModel>(
        matrix.renderedTable.footerRow.cells[1].question.displayValue
      ),
      "Total Spalt 1: 10",
      "total for de locale is correct"
    );
    survey.locale = "fr";
    assert.equal(
      <QuestionExpressionModel>(
        matrix.renderedTable.footerRow.cells[1].question.displayValue
      ),
      "Total colonne 1: 10",
      "total for fr locale is correct"
    );
    survey.locale = "";
    assert.equal(
      <QuestionExpressionModel>(
        matrix.renderedTable.footerRow.cells[1].question.displayValue
      ),
      "Total column 1: 10",
      "total for en locale again is correct"
    );
  }
);

QUnit.test(
  "Changing rows in matrix dropdown doesn't update the table",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columns: [
            {
              name: "col1",
            },
          ],
          rows: ["row1", "row2"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(matrix.renderedTable.rows.length, 4, "There are two rows");
    matrix.rows.push(new ItemValue("row2"));
    assert.equal(
      matrix.renderedTable.rows.length,
      6,
      "There are three rows now"
    );
    matrix.rows.splice(0, 1);
    assert.equal(
      matrix.renderedTable.rows.length,
      4,
      "There are two rows again"
    );
  }
);
QUnit.test("showInMultipleColumns property", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "text",
            totalType: "sum",
          },
          {
            name: "col2",
            cellType: "checkbox",
            choices: ["1", "2", "3"],
          },
          {
            name: "col3",
            cellType: "comment",
          },
        ],
        rows: ["row1", "row2"],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    1 + 3,
    "header: row value + 3 columns"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells.length,
    1 + 3,
    "first row: row value + 3 columns"
  );
  assert.equal(
    matrix.renderedTable.footerRow.cells.length,
    1 + 3,
    "footer: row value + 3 columns"
  );
  assert.equal(
    matrix.renderedTable.headerRow.cells[2].locTitle.renderedHtml,
    "col2",
    "Column header"
  );
  assert.notEqual(matrix.columns[1].templateQuestion.autoOtherMode, true, "It is turn off by default");
  matrix.columns[1].showInMultipleColumns = true;
  assert.equal(matrix.columns[1].templateQuestion.autoOtherMode, true, "It is turn on on setting showInMultipleColumns");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    1 + 2 + 3,
    "header: row value + 2 columns + showInMultipleColumns column"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells.length,
    1 + 2 + 3,
    "first row: row value + 2 columns + showInMultipleColumns column"
  );
  assert.equal(
    matrix.renderedTable.footerRow.cells.length,
    1 + 2 + 3,
    "footer:  row value + 2 columns + showInMultipleColumns column"
  );
  assert.equal(
    matrix.renderedTable.headerRow.cells[2].locTitle.renderedHtml,
    "1",
    "Column header, first choice"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells[2].isCheckbox,
    true,
    "first row, first choice: it is checkbox"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells[2].isChoice,
    true,
    "first row, first choice: isChoice"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells[2].choiceValue,
    "1",
    "first row, first choice: choiceValue = 1"
  );
  assert.equal(
    matrix.renderedTable.rows[0].cells[1].isErrorsCell,
    true,
    "first row, text question: showErrorOnTop"
  );
  assert.equal(
    matrix.renderedTable.rows[0].cells[2].isErrorsCell,
    true,
    "first row, first choice: showErrorOnTop"
  );
  assert.equal(
    matrix.renderedTable.rows[0].cells[3].isErrorsCell,
    false,
    "first row, second choice: showErrorOnTop"
  );
  assert.equal(
    matrix.renderedTable.footerRow.cells[2].isChoice,
    false,
    "footer cell:  isChoice should be false"
  );
});
QUnit.test("showInMultipleColumns property, change column choices in running", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "text",
            totalType: "sum",
          },
          {
            name: "col2",
            cellType: "checkbox",
            showInMultipleColumns: true
          },
          {
            name: "col3",
            cellType: "comment",
          },
        ],
        rows: ["row1", "row2"],
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    1 + 2 + 0,
    "header: row value + 0 choices"
  );
  assert.equal(
    matrix.renderedTable.rows[0].cells.length,
    1 + 2 + 0,
    "first row: row value + 0 choices"
  );
  assert.equal(
    matrix.renderedTable.footerRow.cells.length,
    1 + 2 + 0,
    "footer: row value + 0 choices"
  );
  matrix.renderedTable["testId"] = 1;
  const column = matrix.columns[1];
  column.choices = ["1", "2", "3", "4", "5"];
  assert.notEqual(matrix.renderedTable["testId"], 1, "table re-created");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    1 + 2 + 5,
    "header: row value + 5 choices"
  );
  assert.equal(
    matrix.renderedTable.rows[0].cells.length,
    1 + 2 + 5,
    "first row: row value + 5 choices"
  );
  assert.equal(
    matrix.renderedTable.footerRow.cells.length,
    1 + 2 + 5,
    "footer: row value + 5 choices"
  );
  matrix.renderedTable["testId"] = 1;
  assert.ok(column.templateQuestion.loadedChoicesFromServerCallback, "Calback is set");
  column.templateQuestion.loadedChoicesFromServerCallback();
  assert.notEqual(matrix.renderedTable["testId"], 1, "table re-created");
});
QUnit.test("showInMultipleColumns and hasOther properties", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            showInMultipleColumns: true,
            hasOther: true,
            choices: [1, 2, 3]
          },
          { name: "col2", cellType: "comment" }
        ],
        rows: ["row1", "row2"],
      },
    ],
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.columns[0].templateQuestion.autoOtherMode, true, "Other mode is set for column template question");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    1 + 3 + 2,
    "header: row value + 3 choices + hasOther"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells.length,
    1 + 3 + 2,
    "first row: row value + 3 choices + hasOther"
  );
  assert.equal(matrix.renderedTable.headerRow.cells[4].locTitle.text, "Other (describe)", "Column text is correct");
  const cell = matrix.renderedTable.rows[1].cells[4];
  assert.equal(cell.question.getType(), "checkbox", "question is checkbox");
  assert.equal(cell.question.autoOtherMode, true, "autoOtherMode is set");
  assert.equal(cell.isOtherChoice, true, "it is other choice index");
  assert.equal(cell.isCheckbox, false, "it is not check");
  assert.equal(cell.isRadio, false, "it is not radio");
  const commentCell = matrix.renderedTable.rows[1].cells[5];
  assert.equal(commentCell.isOtherChoice, false, "it is not other choice index");
  cell.question.comment = "comment1";
  assert.deepEqual(matrix.value, { row1: { col1: ["other"], "col1-Comment": "comment1" } }, "Matrix value col1-comment is set");
  cell.question.comment = "comment2";
  assert.deepEqual(matrix.value, { row1: { col1: ["other"], "col1-Comment": "comment2" } }, "Matrix value col1-comment is set, #2");
  cell.question.comment = "";
  assert.notOk(matrix.value, "Reset comment value");
});
QUnit.test("showInMultipleColumns and showNoneItem property", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            showInMultipleColumns: true,
            showNoneItem: true,
            noneText: "None abc",
            choices: [1, 2, 3]
          },
          { name: "col2", cellType: "comment" }
        ],
        rows: ["row1", "row2"],
      },
    ],
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.renderedTable.headerRow.cells.length, 1 + 3 + 1 + 1, "header: row value + 3 choices + none item + one column");
  assert.equal(matrix.renderedTable.rows[1].cells.length, 1 + 3 + 1 + 1, "first row: row value + 3 choices + none item + one column");
  assert.equal(matrix.renderedTable.headerRow.cells[4].locTitle.text, "None abc", "Column text is correct");
  const cell = matrix.renderedTable.rows[1].cells[4];
  assert.equal(cell.question.getType(), "checkbox", "question is checkbox");
  assert.equal(cell.question.showNoneItem, true, "showNoneItem is set");
});
QUnit.test("showInMultipleColumns  and showNoneItem property properties & choices from question Bug#8279", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            showInMultipleColumns: true,
            showNoneItem: true,
            noneText: "None abc"
          },
          { name: "col2", cellType: "comment" }
        ],
        choices: [1, 2, 3],
        rows: ["row1", "row2"]
      },
    ],
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.renderedTable.headerRow.cells.length, 1 + 3 + 1 + 1, "header: row value + 3 choices + none item + one column");
  assert.equal(matrix.renderedTable.rows[1].cells.length, 1 + 3 + 1 + 1, "first row: row value + 3 choices + none item  + one column");
  assert.equal(matrix.renderedTable.headerRow.cells[4].locTitle.text, "None abc", "Column text is correct");
  const cell = matrix.renderedTable.rows[1].cells[4];
  assert.equal(cell.question.getType(), "checkbox", "question is checkbox");
  assert.equal(cell.question.showNoneItem, true, "showNoneItem is set");
});
QUnit.test("showInMultipleColumns and hasOther properties, change in run-time", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            showInMultipleColumns: true,
            choices: [1, 2, 3]
          }
        ],
        rows: ["row1", "row2"],
      },
    ],
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.renderedTable.headerRow.cells.length, 1 + 3, "header: row value + 3 choices");
  matrix.renderedTable["test_id"] = "#1";
  matrix.columns[0].hasOther = true;
  assert.notEqual(matrix.renderedTable["test_id"], "#1", "Re-create renderedTable");
  assert.equal(matrix.columns[0].templateQuestion.autoOtherMode, true, "Other mode is set for column template question");
  assert.equal(matrix.renderedTable.headerRow.cells.length, 1 + 3 + 1, "header: row value + 3 choices + hasOther");
  assert.equal(matrix.renderedTable.rows[0].cells.length, 1 + 3 + 1, "first row: row value + 3 choices + hasOther");
  assert.equal(matrix.renderedTable.headerRow.cells[4].locTitle.text, "Other (describe)", "Column text is correct");
});
QUnit.test("showInMultipleColumns and hasOther properties, change in run-time in matrix dynamic", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        allowRemoveRows: false,
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            showInMultipleColumns: true,
            choices: [1, 2]
          }
        ]
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.renderedTable.headerRow.cells.length, 2, "header: 2 choices");
  matrix.renderedTable["test_id"] = "#1";
  matrix.columns[0].hasOther = true;
  assert.notEqual(matrix.renderedTable["test_id"], "#1", "Re-create renderedTable");
  assert.equal(matrix.columns[0].templateQuestion.autoOtherMode, true, "Other mode is set for column template question");
  assert.equal(matrix.renderedTable.headerRow.cells.length, 2 + 1, "header: 2 choices + hasOther");
  assert.equal(matrix.renderedTable.rows[0].cells.length, 2 + 1, "first row: 2 choices + hasOther");
  assert.equal(matrix.renderedTable.headerRow.cells[2].locTitle.text, "Other (describe)", "Column text is correct");
});
QUnit.test("showInMultipleColumns property, and visibleIf in choices", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "radiogroup", name: "q1", choices: [1, 2, 3, 4] },
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "text",
            totalType: "sum",
          },
          {
            name: "col2",
            cellType: "checkbox",
            showInMultipleColumns: true,
            showNoneItem: true,
            choices: [
              { value: "A", visibleIf: "{q1} = 1" },
              { value: "B", visibleIf: "{q1} = 2" },
              { value: "C", visibleIf: "{q1} = 3" }
            ]
          }
        ],
        rows: ["row1", "row2"],
      },
    ],
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  const column = matrix.getColumnByName("col2");
  const choices = column.templateQuestion.visibleChoices;
  assert.equal(choices.length, 4, "There are 4 choices");
  assert.equal(column.isFilteredMultipleColumns, true, "multiple column has visibleIf in choices");

  let table = matrix.renderedTable;
  let multipleChoices = column.getVisibleMultipleChoices();
  assert.equal(multipleChoices.length, 1, "One visible choice");
  assert.equal(multipleChoices[0].value, "none", "none is only visible");
  assert.equal(table.headerRow.cells.length, 1 + 1 + 1, "header: row value + 1 choices");
  assert.equal(table.rows[1].cells.length, 1 + 1 + 1, "first row: row value + 1 choices");
  assert.equal(table.headerRow.cells[2].locTitle.textOrHtml, "None", "Header None");
  assert.equal(table.rows[1].cells[2].choiceValue, "none", "none index in the first row");

  survey.setValue("q1", 1);
  table = matrix.renderedTable;
  multipleChoices = column.getVisibleMultipleChoices();
  assert.equal(multipleChoices.length, 2, "Two visible choice");
  assert.equal(multipleChoices[0].value, "A", "A is visible");
  assert.equal(multipleChoices[1].value, "none", "none is visible");
  assert.equal(table.headerRow.cells.length, 1 + 1 + 2, "header: row value + 1 choices, #2");
  assert.equal(table.rows[1].cells.length, 1 + 1 + 2, "first row: row value + 1 choices, #2");
  assert.equal(table.headerRow.cells[2].locTitle.textOrHtml, "A", "Header A, #2");
  assert.equal(table.headerRow.cells[3].locTitle.textOrHtml, "None", "Header None, #2");
  assert.equal(table.rows[1].cells[2].choiceValue, "A", "none in the first row, #2");
  assert.equal(table.rows[1].cells[3].choiceValue, "none", "none in the first row, #2");

  survey.setValue("q1", 3);
  table = matrix.renderedTable;
  multipleChoices = column.getVisibleMultipleChoices();
  assert.equal(multipleChoices.length, 2, "Two visible choice");
  assert.equal(multipleChoices[0].value, "C", "C is visible");
  assert.equal(multipleChoices[1].value, "none", "none is visible");
  assert.equal(table.headerRow.cells.length, 1 + 1 + 2, "header: row value + 1 choices, #3");
  assert.equal(table.rows[1].cells.length, 1 + 1 + 2, "first row: row value + 1 choices, #3");
  assert.equal(table.headerRow.cells[2].locTitle.textOrHtml, "C", "Header C, #3");
  assert.equal(table.headerRow.cells[3].locTitle.textOrHtml, "None", "Header None, #3");
  assert.equal(table.rows[1].cells[2].choiceValue, "C", "none in the first row, #3");
  assert.equal(table.rows[1].cells[3].choiceValue, "none", "none in the first row, #3");

  survey.setValue("q1", 4);
  table = matrix.renderedTable;
  multipleChoices = column.getVisibleMultipleChoices();
  assert.equal(multipleChoices.length, 1, "Two visible choice");
  assert.equal(multipleChoices[0].value, "none", "none is visible");
  assert.equal(table.headerRow.cells.length, 1 + 1 + 1, "header: row value + 1 choices, #4");
  assert.equal(table.rows[1].cells.length, 1 + 1 + 1, "first row: row value + 1 choices, #4");
  assert.equal(table.headerRow.cells[2].locTitle.textOrHtml, "None", "Header None, #4");
  assert.equal(table.rows[1].cells[2].choiceValue, "none", "none in the first row, #4");
});
QUnit.test(
  "showInMultipleColumns property + columnLayout = 'vertical'",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columnLayout: "vertical",
          columns: [
            {
              name: "col1",
              cellType: "text",
              totalType: "sum",
            },
            {
              name: "col2",
              cellType: "radiogroup",
              showInMultipleColumns: true,
              choices: ["1", "2", "3"],
            },
            {
              name: "col3",
              cellType: "comment",
            },
          ],
          rows: ["row1", "row2"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(
      matrix.renderedTable.headerRow.cells.length,
      1 + 2 + 1,
      "header: column header + 2 rows + total"
    );
    assert.equal(
      matrix.renderedTable.rows.length,
      (2 + 3) * 2,
      "rows.length = 2 columns + showInMultipleColumns column"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[0].locTitle.renderedHtml,
      "1",
      "header for showInMultipleColumns column"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[1].isChoice,
      true,
      "showInMultipleColumns, first choice: isChoice"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[1].choiceValue,
      "1",
      "showInMultipleColumns, first choice: choiceValue"
    );
    assert.equal(
      matrix.renderedTable.rows[3 + 2 * 2].cells[0].locTitle.renderedHtml,
      "3",
      "header for showInMultipleColumns column, third choice"
    );
    assert.equal(
      matrix.renderedTable.rows[3 + 2 * 2].cells[1].isChoice,
      true,
      "showInMultipleColumns, third choice: isChoice"
    );
    assert.equal(
      matrix.renderedTable.rows[3 + 2 * 2].cells[1].choiceValue,
      "3",
      "showInMultipleColumns, third choice: choiceValue"
    );
  }
);
QUnit.test(
  "showInMultipleColumns property, update on visibleChoices change",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columns: [
            {
              name: "col1",
              cellType: "text",
            },
            {
              name: "col2",
              cellType: "checkbox",
              showInMultipleColumns: true,
              choices: ["1", "2", "3"],
            },
            {
              name: "col3",
              cellType: "comment",
            },
          ],
          rows: ["row1", "row2"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(
      matrix.renderedTable.headerRow.cells.length,
      1 + 2 + 3,
      "header: row value + 3 columns"
    );
    matrix.columns[1].choices.push(new ItemValue(4));
    assert.equal(
      matrix.renderedTable.headerRow.cells.length,
      1 + 2 + 4,
      "header: row value + 4 columns"
    );
  }
);
QUnit.test(
  "showInMultipleColumns property, using default choices and cellType",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columns: [
            {
              name: "col1",
              cellType: "text",
            },
            {
              name: "col2",
              cellType: "radiogroup",
              showInMultipleColumns: true,
            },
            {
              name: "col3",
              cellType: "comment",
            },
          ],
          rows: ["row1", "row2"],
          choices: ["1", "2", "3"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(
      matrix.renderedTable.headerRow.cells.length,
      1 + 2 + 3,
      "header: row value + 3 columns"
    );
  }
);
QUnit.test(
  "showInMultipleColumns property, using default choices and cellType",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          cellType: "text",
          columns: [
            {
              name: "col1",
            },
            {
              name: "col2",
            },
            {
              name: "col3",
            },
          ],
          rowCount: 1,
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");

    var rows = matrix.visibleRows;
    matrix.addRow();
    matrix.setRowValue(1, { col1: "1", col2: 2, col3: "3" });
    rows = matrix.visibleRows;
    assert.equal(rows.length, 2, "There are two rows");
    assert.equal(
      rows[1].getQuestionByColumnName("col1").value,
      "1",
      "Set the value correctly"
    );
  }
);

QUnit.test(
  "showInMultipleColumns property, using default choices and cellType, Bug #2151",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columns: [
            {
              name: "Column 1",
            },
            {
              name: "Column 2",
            },
            {
              name: "Column 3",
              totalType: "sum",
            },
            {
              name: "Column 4",
              cellType: "boolean",
            },
          ],
          choices: [1, 2, 3, 4, 5],
          cellType: "text",
          rows: ["Row 1", "Row 2"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");

    assert.equal(matrix.renderedTable.rows.length, 4, "There are two rows");
    assert.equal(
      matrix.renderedTable.footerRow.cells[3].question.value,
      0,
      "Summary is 0"
    );
    var totalBoolQuestion = matrix.renderedTable.footerRow.cells[4].question;
    assert.equal(
      totalBoolQuestion.value,
      null,
      "There is no question value for boolean column"
    );
    assert.equal(
      totalBoolQuestion.getType(),
      "expression",
      "Total question for boolean column is expression"
    );
  }
);
QUnit.test(
  "showInMultipleColumns property, columnLayout: 'vertical' and other is empty value, Bug #2200",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columnLayout: "vertical",
          columns: [
            {
              name: "col1",
              cellType: "radiogroup",
              hasOther: true,
              showInMultipleColumns: true,
              choices: [1, 2],
            },
          ],
          rows: ["row1", "row2"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(matrix.columns[0].choices.length, 2, "There are two choices");
    assert.equal(
      matrix.columns[0].templateQuestion.choices.length,
      2,
      "There are two choices in question"
    );
    assert.equal(
      matrix.columns[0].templateQuestion.visibleChoices.length,
      3,
      "There are two visible choices in question + hasOther"
    );
    assert.equal(
      matrix.renderedTable.rows.length,
      6,
      "There are two choices + other"
    );
    matrix.value = { row1: { col1: "other" } };
    assert.equal(matrix.hasErrors(), true, "There is error");
    assert.equal(
      matrix.renderedTable.rows[1].cells[1].isChoice,
      true,
      "The first cell is checkbox"
    );
    assert.equal(
      matrix.renderedTable.rows[5].cells[1].isChoice,
      true,
      "The third cell is checkbox"
    );
    assert.equal(
      matrix.renderedTable.rows[1].cells[1].isFirstChoice,
      true,
      "The first cell is firstchoice"
    );
    assert.equal(
      matrix.renderedTable.rows[5].cells[1].isFirstChoice,
      false,
      "The third cell is not firstchoice"
    );
    assert.equal(
      matrix.renderedTable.rows[5].cells[1].choiceIndex,
      2,
      "The third cell choiceIndex is not 0"
    );
    assert.equal(
      matrix.renderedTable.rows[0].cells[1].isErrorsCell,
      true,
      "Show errors for the first cell"
    );
    assert.equal(
      matrix.renderedTable.rows[2].cells[1].isErrorsCell,
      false,
      "Do not show errors for the second cell"
    );
    assert.equal(
      matrix.renderedTable.rows[2].cells[1].isEmpty,
      true,
      "Do not show errors for the second cell"
    );
    assert.equal(
      matrix.renderedTable.rows[4].cells[1].isEmpty,
      true,
      "Do not show errors for the third cell"
    );
    assert.equal(
      matrix.renderedTable.rows[4].cells[1].isErrorsCell,
      false,
      "Do not show errors for the third cell"
    );
  }
);
QUnit.test(
  "showInMultipleColumns property, and enabledIf in item, Bug #2926",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columns: [
            {
              name: "col1",
              cellType: "radiogroup",
              showInMultipleColumns: true,
            },
          ],
          choices: [
            { value: 1, enableIf: "{row.col1}<>1" },
            { value: 2, enableIf: "{row.col1}=1" },
          ],
          rows: ["row1", "row2"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    matrix.value = { row1: { col1: 1 }, row2: { col1: 2 } };
    assert.equal(matrix.renderedTable.rows.length, 4, "There are two rows");
    assert.equal(
      matrix.renderedTable.rows[1].cells.length,
      3,
      "There are two cells and one row name"
    );
    assert.equal(
      matrix.renderedTable.rows[1].cells[1].item.isEnabled,
      false,
      "cell[0, 0] is disabled"
    );
    assert.equal(
      matrix.renderedTable.rows[1].cells[2].item.isEnabled,
      true,
      "cell[0, 1] is enabled"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[1].item.isEnabled,
      true,
      "cell[1, 0] is enabled"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[2].item.isEnabled,
      false,
      "cell[1, 1] is disabled"
    );
    matrix.value = { row1: { col1: 2 }, row2: { col1: 2 } };
    assert.equal(
      matrix.renderedTable.rows[1].cells[1].item.isEnabled,
      true,
      "cell[0, 0] is disabled, #2"
    );
    assert.equal(
      matrix.renderedTable.rows[1].cells[2].item.isEnabled,
      false,
      "cell[0, 1] is enabled, #2"
    );
  }
);
QUnit.test(
  "showInMultipleColumns property, columnLayout: 'vertical'  and enabledIf in item, Bug #2926",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columnLayout: "vertical",
          columns: [
            {
              name: "col1",
              cellType: "radiogroup",
              showInMultipleColumns: true,
            },
          ],
          choices: [
            { value: 1, enableIf: "{row.col1}<>1" },
            { value: 2, enableIf: "{row.col1}=1" },
          ],
          rows: ["row1", "row2"],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    matrix.value = { row1: { col1: 1 }, row2: { col1: 2 } };
    assert.equal(matrix.renderedTable.rows.length, 4, "There are two rows");
    assert.equal(
      matrix.renderedTable.rows[1].cells.length,
      3,
      "There are two cells and one row name"
    );
    assert.equal(
      matrix.renderedTable.rows[1].cells[1].item.isEnabled,
      false,
      "cell[0, 0] is disabled"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[1].item.isEnabled,
      true,
      "cell[1, 0] is enabled"
    );
    assert.equal(
      matrix.renderedTable.rows[1].cells[2].item.isEnabled,
      true,
      "cell[0, 1] is enabled"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[2].item.isEnabled,
      false,
      "cell[1, 1] is disabled"
    );
    matrix.value = { row1: { col1: 2 }, row2: { col1: 2 } };
    assert.equal(
      matrix.renderedTable.rows[1].cells[1].item.isEnabled,
      true,
      "cell[0, 0] is disabled, #2"
    );
    assert.equal(
      matrix.renderedTable.rows[3].cells[1].item.isEnabled,
      false,
      "cell[1, 0] is enabled, #2"
    );
  }
);

QUnit.test(
  "Filter choices on value change in the next column, Bug #2182",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          columns: [
            {
              name: "column1",
              cellType: "text",
            },
            {
              name: "column2",
              cellType: "dropdown",
              choices: [
                { value: "A", visibleIf: "{row.column1} = 1" },
                { value: "B", visibleIf: "{row.column1} = 2" },
                { value: "C", visibleIf: "{row.column1} = 2" },
              ],
            },
          ],
          rowCount: 1,
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    var rows = matrix.visibleRows;
    var q1 = rows[0].cells[0].question;
    var q2 = <QuestionDropdownModel>rows[0].cells[1].question;
    assert.equal(q2.visibleChoices.length, 0, "There is no visible choices");
    q1.value = 1;
    assert.equal(q2.visibleChoices.length, 1, "There is 'A' item");
    q1.value = 2;
    assert.equal(q2.visibleChoices.length, 2, "There is 'B' and 'C' items");
  }
);
QUnit.test(
  "Survey.checkErrorsMode=onValueChanged, some errors should be shown onNextPage only, multipletext",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "question1",
          columns: [
            {
              name: "Column 1",
              isRequired: true,
            },
            {
              name: "Column 2",
              isRequired: true,
            },
          ],
        },
      ],
      checkErrorsMode: "onValueChanged",
    });
    var matrix = <QuestionMatrixDynamicModel>(
      survey.getQuestionByName("question1")
    );
    var rows = matrix.visibleRows;
    rows[0].cells[0].value = 1;
    assert.equal(
      rows[0].cells[1].question.errors.length,
      0,
      "There is no errors yet in the cell, first row, second column"
    );
    assert.equal(
      rows[1].cells[0].question.errors.length,
      0,
      "There is no errors yet in the cell, second row, first column"
    );
    survey.tryComplete();
    assert.equal(
      rows[0].cells[1].question.errors.length,
      1,
      "There is error in the cell, first row, second column"
    );
    assert.equal(
      rows[1].cells[0].question.errors.length,
      1,
      "There is error in the cell, second row, first column"
    );
    rows[0].cells[0].value = 2;
    assert.equal(
      rows[0].cells[1].question.errors.length,
      1,
      "The error in the cell is not fixed, first row, second column"
    );
    assert.equal(
      rows[1].cells[0].question.errors.length,
      1,
      "The error in the cell is not fixed, first column"
    );
    rows[0].cells[1].value = 1;
    assert.equal(
      rows[0].cells[1].question.errors.length,
      0,
      "The error in the cell is gone, first row, second column"
    );
    assert.equal(
      rows[1].cells[0].question.errors.length,
      1,
      "The error in the cell is not fixed, first column, #2"
    );
    rows[1].cells[0].value = 1;
    assert.equal(
      rows[1].cells[0].question.errors.length,
      0,
      "The error in the cell is gone, first column, #2"
    );
  }
);
QUnit.test("Survey.checkErrorsMode=onValueChanging", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "question1",
        rowCount: 2,
        columns: [
          {
            name: "col1",
            cellType: "text",
            validators: [{ type: "emailvalidator" }],
          },
          {
            name: "col2",
            cellType: "text",
          },
        ],
      },
    ],
    checkErrorsMode: "onValueChanging",
  });
  var matrix = <QuestionMatrixDynamicModel>(
    survey.getQuestionByName("question1")
  );
  var rows = matrix.visibleRows;
  rows[0].cells[0].value = "val";
  assert.equal(
    rows[0].cells[0].question.errors.length,
    1,
    "There is error, e-mail is incorrect"
  );
  assert.equal(
    rows[0].cells[1].question.errors.length,
    0,
    "There is no errors yet in the cell, first row, second column"
  );
  assert.equal(
    rows[1].cells[0].question.errors.length,
    0,
    "There is no errors yet in the cell, second row, first column"
  );
  assert.notOk(matrix.value, "do not set value to matrix");
  assert.deepEqual(survey.data, {}, "do not set value into survey");
  rows[0].cells[0].value = "a@a.com";
  assert.deepEqual(
    matrix.value,
    [{ col1: "a@a.com" }, {}],
    "set value to matrix"
  );
  assert.deepEqual(
    survey.data,
    { question1: [{ col1: "a@a.com" }, {}] },
    "set value into survey"
  );
});

QUnit.test(
  "Survey.checkErrorsMode=onValueChanging and column.isUnique",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "question1",
          rowCount: 2,
          columns: [
            {
              name: "col1",
              cellType: "text",
              isUnique: true,
            },
            {
              name: "col2",
              cellType: "text",
            },
          ],
        },
      ],
      checkErrorsMode: "onValueChanging",
    });
    var matrix = <QuestionMatrixDynamicModel>(
      survey.getQuestionByName("question1")
    );
    var rows = matrix.visibleRows;
    rows[0].cells[0].value = "val1";
    assert.equal(
      rows[0].cells[0].question.errors.length,
      0,
      "There is no error"
    );
    assert.deepEqual(matrix.value, [{ col1: "val1" }, {}]);
    rows[1].cells[0].value = "val1";
    assert.equal(
      rows[1].cells[0].question.errors.length,
      1,
      "There is a duplication error, second row, first column"
    );
    assert.deepEqual(matrix.value, [{ col1: "val1" }, {}]);
    rows[1].cells[0].value = "val2";
    assert.equal(
      rows[1].cells[0].question.errors.length,
      0,
      "There is no errors yet in the cell, second row, first column"
    );
  }
);

QUnit.test("column should call property changed on custom property", function (
  assert
) {
  Serializer.addProperty("text", "prop1");
  var matrix = new QuestionMatrixDynamicModel("q1");
  var column = matrix.addColumn("col1");
  column.cellType = "text";
  var counter = 0;
  column.registerPropertyChangedHandlers(["prop1"], () => {
    counter++;
  });
  column["prop1"] = 3;
  assert.equal(column.templateQuestion["prop1"], 3, "Property is set");
  assert.equal(counter, 1, "Notification is called");
  Serializer.removeProperty("text", "prop1");
});
QUnit.test("getProgressInfo", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [
          {
            name: "col1",
            isRequired: true,
          },
          {
            name: "col2",
          },
          {
            name: "col3",
            visibleIf: "{row.col2} notempty",
          },
        ],
      },
    ],
  });
  survey.data = { matrix: [{ col1: "1" }, { col2: "2" }, []] };
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.ok(question.renderedTable);
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 9 - 2,
    answeredQuestionCount: 2,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 1,
  });
});
QUnit.test("getProgressInfo with non input questions in matrix dropdown Bug#5255", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            isRequired: true,
          },
          {
            name: "col2",
            cellType: "expression"
          },
          {
            name: "col3",
            cellType: "html"
          },
        ],
        rows: ["row1", "row2", "row3"]
      },
    ],
  });
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 3,
    answeredQuestionCount: 0,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 0,
  });
  survey.data = { matrix: { row1: { col1: "1" }, row2: { col1: "2" }, row3: {} } };
  assert.ok(question.renderedTable);
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 3,
    answeredQuestionCount: 2,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 2,
  });
});
QUnit.test("getProgressInfo with non input questions in matrix dynamic Bug#5255", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [
          {
            name: "col1",
            isRequired: true,
          },
          {
            name: "col2",
            cellType: "expression"
          },
          {
            name: "col3",
            cellType: "html"
          },
        ]
      },
    ],
  });
  var question = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  question.rowCount = 3;
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 3,
    answeredQuestionCount: 0,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 0,
  });
  survey.data = { matrix: [{ col1: "1" }, { col1: "2" }, {}] };
  assert.ok(question.renderedTable);
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 3,
    answeredQuestionCount: 2,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 2,
  });
});

QUnit.test("getProgressInfo, matrix dynamic without creating table", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [
          {
            name: "col1",
            isRequired: true,
          },
          {
            name: "col2",
          },
          {
            name: "col3",
          },
        ],
      },
    ],
  });
  survey.data = { matrix: [{ col1: "1" }, { col2: "2" }, []] };
  var question = survey.getQuestionByName("matrix");
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 9,
    answeredQuestionCount: 2,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 1,
  });
  assert.notOk(question["generatedVisibleRows"]);
});

QUnit.test("getProgressInfo, matrix dropdown without creating table", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            isRequired: true,
          },
          {
            name: "col2",
          },
          {
            name: "col3",
          },
        ],
        rows: ["row1", "row2", "row3"]
      },
    ],
  });
  survey.data = { matrix: { row1: { col1: "1" }, row2: { col2: "2" } } };
  var question = survey.getQuestionByName("matrix");
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 9,
    answeredQuestionCount: 2,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 1,
  });
  assert.notOk(question["generatedVisibleRows"]);
});

QUnit.test(
  "Change item value in column/templateQuestion and change it in row questions",
  function (assert) {
    var matrix = new QuestionMatrixDynamicModel("q1");
    var column = matrix.addColumn("col1");
    column.cellType = "checkbox";
    column.templateQuestion.choices.push(new ItemValue("item1"));
    column.templateQuestion.choices.push(new ItemValue("item2"));
    var cellQuestion = matrix.visibleRows[0].cells[0].question;
    assert.equal(cellQuestion.choices.length, 2, "There are two choices");
    assert.equal(
      cellQuestion.choices[0].value,
      "item1",
      "Value is correct, choice1"
    );
    assert.equal(
      cellQuestion.choices[1].value,
      "item2",
      "Value is correct, choice2"
    );
    column.templateQuestion.choices.push(new ItemValue("item3"));
    assert.equal(cellQuestion.choices.length, 3, "There are three choices");
    assert.equal(
      cellQuestion.choices[2].value,
      "item3",
      "Value is correct, choice3"
    );
    column.templateQuestion.choices[0].value = "newItem1";
    assert.equal(
      cellQuestion.choices[0].value,
      "newItem1",
      "Value is correct, updated, choice1"
    );
    column.templateQuestion.choices[2].text = "Item3 text";
    assert.equal(
      cellQuestion.choices[2].text,
      "Item3 text",
      "Text is correct, updated, choice3"
    );
  }
);

QUnit.test("isAnswered on setitting from survey.setValue(), Bug#2399", function (
  assert
) {
  var survey = new SurveyModel({
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "matrixdynamic",
            name: "HospitalAdmissions_Table",
            columns: [
              {
                name: "TreatmentProcedure",
                cellType: "text",
                width: "20",
              },
              {
                name: "Hospital",
                cellType: "text",
                width: "20",
              },
              {
                name: "Year",
                cellType: "dropdown",
              },
            ],
            choices: ["2020", "2019"],
            rowCount: 1,
          },
        ],
      },
    ],
  });
  var question = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  survey.setValue("HospitalAdmissions_Table", [
    {
      TreatmentProcedure: "A",
      Hospital: "B",
      Year: "2020",
    },
  ]);
  assert.equal(question.visibleRows.length, 1, "There is one row");
  assert.equal(question.isAnswered, true, "matrix is answered");
});
QUnit.test(
  "Use survey.storeOthersAsComment in matrix, cellType = dropdown",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          columns: [
            {
              name: "col1",
              cellType: "dropdown",
              choices: [1, 2, 3],
              hasOther: true,
            },
          ],
          rowCount: 1,
        },
      ],
    });
    var question = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
    var cellQuestion = <QuestionDropdownModel>(
      question.visibleRows[0].cells[0].question
    );
    assert.equal(
      cellQuestion.getType(),
      "dropdown",
      "Cell question was created correctly"
    );
    cellQuestion.value = cellQuestion.otherItem.value;
    cellQuestion.comment = "My Comment";
    assert.deepEqual(
      question.value,
      [{ col1: "other", "col1-Comment": "My Comment" }],
      "Has comment"
    );
    question.value = [{ col1: 1 }];
    assert.equal(cellQuestion.value, 1, "value sets correctly into cell");
    assert.equal(
      cellQuestion.comment,
      "",
      "comment clears correctly in cell question"
    );
    question.value = [{ col1: "other", "col1-Comment": "New Comment" }];
    assert.equal(
      cellQuestion.value,
      "other",
      "value other sets correctly into cell"
    );
    assert.equal(
      cellQuestion.comment,
      "New Comment",
      "comment sets correctly into cell question"
    );
    question.value = [{ col1: 1 }];
    question.value = [{ col1: "NotInList" }];
    assert.equal(
      cellQuestion.value,
      "other",
      "value other sets correctly into cell using NotInList"
    );
    assert.equal(
      cellQuestion.comment,
      "NotInList",
      "comment sets correctly into cell question using NotInList"
    );
  }
);
QUnit.test(
  "Use survey.storeOthersAsComment in matrix, cellType = checkbox",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          columns: [
            {
              name: "col1",
              cellType: "checkbox",
              choices: [1, 2, 3],
              hasOther: true,
            },
          ],
          rowCount: 1,
        },
      ],
    });
    var question = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
    var cellQuestion = <QuestionCheckboxModel>(
      question.visibleRows[0].cells[0].question
    );
    assert.equal(
      cellQuestion.getType(),
      "checkbox",
      "Cell question was created correctly"
    );
    cellQuestion.value = [1, cellQuestion.otherItem.value];
    cellQuestion.comment = "My Comment";
    assert.deepEqual(cellQuestion.value, [1, "other"], "question.value #1");
    assert.deepEqual(
      question.value,
      [{ col1: [1, "other"], "col1-Comment": "My Comment" }],
      "Has comment"
    );
    assert.deepEqual(survey.data, { q1: [{ col1: [1, "other"], "col1-Comment": "My Comment" }] }, "survey.data is correct, set");
    question.value = [{ col1: [1] }];
    assert.deepEqual(cellQuestion.value, [1], "value sets correctly into cell");
    assert.deepEqual(survey.data, { q1: [{ col1: [1] }] }, "survey.data is correct, clear");
    assert.equal(
      cellQuestion.comment,
      "",
      "comment clears correctly in cell question"
    );
    question.value = [{ col1: [1, "other"], "col1-Comment": "New Comment" }];
    assert.deepEqual(
      cellQuestion.value,
      [1, "other"],
      "value other sets correctly into cell"
    );
    assert.equal(
      cellQuestion.comment,
      "New Comment",
      "comment sets correctly into cell question"
    );
    question.value = [{ col1: [1] }];
    question.value = [{ col1: [1, "NotInList"] }];
    assert.deepEqual(
      cellQuestion.value,
      [1, "other"],
      "value other sets correctly into cell using NotInList"
    );
    assert.equal(
      cellQuestion.comment,
      "NotInList",
      "comment sets correctly into cell question using NotInList"
    );
  }
);
QUnit.test(
  "Use survey.storeOthersAsComment = false in matrix, cellType = checkbox",
  function (assert) {
    var survey = new SurveyModel({
      storeOthersAsComment: false,
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          columns: [
            {
              name: "col1",
              cellType: "checkbox",
              choices: [1, 2, 3],
              hasOther: true,
            },
          ],
          rowCount: 1,
        },
      ],
    });
    var question = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
    var cellQuestion = <QuestionCheckboxModel>(
      question.visibleRows[0].cells[0].question
    );
    assert.equal(
      cellQuestion.getType(),
      "checkbox",
      "Cell question was created correctly"
    );
    cellQuestion.value = [1, cellQuestion.otherItem.value];
    cellQuestion.comment = "My Comment";
    assert.deepEqual(
      question.value,
      [{ col1: [1, "My Comment"] }],
      "Has comment in value"
    );
    assert.deepEqual(survey.data, { q1: [{ col1: [1, "My Comment"] }] }, "survey.data is correct, set");
    question.value = [{ col1: [1] }];
    assert.deepEqual(cellQuestion.value, [1], "value sets correctly into cell");
    assert.deepEqual(survey.data, { q1: [{ col1: [1] }] }, "survey.data is correct, clear");
    assert.equal(
      cellQuestion.comment,
      "",
      "comment clears correctly in cell question"
    );
    question.value = [{ col1: [1, "New Comment"] }];
    assert.deepEqual(
      cellQuestion.value,
      [1, "New Comment"],
      "value other sets correctly into cell"
    );
    assert.equal(
      cellQuestion.comment,
      "New Comment",
      "comment sets correctly into cell question"
    );
    question.value = [{ col1: [1] }];
    question.value = [{ col1: [1, "NotInList"] }];
    assert.deepEqual(
      cellQuestion.value,
      [1, "NotInList"],
      "value other sets correctly into cell using NotInList"
    );
    assert.equal(
      cellQuestion.comment,
      "NotInList",
      "comment sets correctly into cell question using NotInList"
    );
  }
);
QUnit.test(
  "Use survey.storeOthersAsComment in matrix, cellType = dropdown, set comment from survey",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "q1",
          columns: [
            {
              name: "col1",
              cellType: "dropdown",
              choices: [1, 2, 3],
              hasOther: true,
            },
          ],
        },
      ],
    });
    survey.data = {
      q1: [{ col1: 1 }, { col1: "other", "col1-Comment": "a comment" }],
    };
    var matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
    assert.equal(
      matrix.visibleRows[1].cells[0].question.comment,
      "a comment",
      "The comment set correctly"
    );
  }
);

QUnit.test("Detail panel, get/set values", function (assert) {
  var survey = new SurveyModel({});
  survey.css = {
    matrixdynamic: { detailIcon: "icon1", detailIconExpanded: "icon2", detailIconId: "#icon1", detailIconExpandedId: "#icon2" },
  };
  survey.addNewPage("p1");
  var matrix = new QuestionMatrixDynamicModel("q1");
  survey.pages[0].addQuestion(matrix);
  var column = matrix.addColumn("col1");
  column.cellType = "text";
  matrix.detailPanel.addNewQuestion("text", "q2");
  matrix.value = [
    { col1: "r1v1", q2: "r1v2" },
    { col1: "r2v1", q2: "r2v2" },
  ];
  assert.equal(matrix.detailPanelMode, "none", "Default value");
  assert.equal(matrix.visibleRows[0].hasPanel, false, "There is no panel here");
  assert.equal(matrix.visibleRows[0].detailPanel, null, "Panel is not created");
  matrix.detailPanelMode = "underRow";
  assert.equal(
    matrix.visibleRows[0].hasPanel,
    true,
    "The panel has been created"
  );
  assert.equal(
    matrix.visibleRows[0].isDetailPanelShowing,
    false,
    "detail panel is not showing"
  );
  assert.equal(
    matrix.visibleRows[0].detailPanel,
    null,
    "Panel is not created, it is hidden"
  );
  assert.equal(
    matrix.getDetailPanelIconCss(matrix.visibleRows[0]),
    "icon1",
    "detail button is closed"
  );
  assert.equal(
    matrix.getDetailPanelIconId(matrix.visibleRows[0]),
    "#icon1",
    "detail button has collapsed icon"
  );
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(
    matrix.visibleRows[0].isDetailPanelShowing,
    true,
    "detail panel is showing"
  );
  assert.ok(matrix.visibleRows[0].detailPanel, "Detail Panel is created");
  assert.equal(
    matrix.getDetailPanelIconCss(matrix.visibleRows[0]),
    "icon1 icon2",
    "detail button is opened"
  );
  assert.equal(
    matrix.getDetailPanelIconId(matrix.visibleRows[0]),
    "#icon2",
    "detail button has expanded icon"
  );
  assert.equal(
    matrix.visibleRows[0].detailPanel.questions.length,
    1,
    "There is one question here"
  );
  assert.equal(
    matrix.visibleRows[0].detailPanel.questions[0].value,
    "r1v2",
    "The value is set correctly"
  );
  matrix.visibleRows[0].detailPanel.questions[0].value = "r1v2_changed";
  assert.deepEqual(
    matrix.value,
    [
      { col1: "r1v1", q2: "r1v2_changed" },
      { col1: "r2v1", q2: "r2v2" },
    ],
    "matrix value changed from detail panel"
  );
  matrix.value = [
    { col1: "r1v1", q2: "r1v2_changed_2" },
    { col1: "r2v1", q2: "r2v2_changed" },
  ];
  assert.equal(
    matrix.visibleRows[0].detailPanel.questions[0].value,
    "r1v2_changed_2",
    "The value in detail panel changed correctly from outside"
  );
  matrix.visibleRows[0].hideDetailPanel();
  assert.equal(
    matrix.visibleRows[0].isDetailPanelShowing,
    false,
    "detail panel is closed"
  );
  assert.equal(
    matrix.getDetailPanelIconCss(matrix.visibleRows[0]),
    "icon1",
    "detail button is closed again"
  );
  assert.equal(
    matrix.getDetailPanelIconId(matrix.visibleRows[0]),
    "#icon1",
    "detail button has collapsed icon again"
  );
});
QUnit.test("Detail panel in matrix dropdown, get/set values", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        detailPanelMode: "underRow",
        detailElements: [{ type: "text", name: "q1" }],
        rows: ["row1", "row2"],
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2" },
        ],
      },
    ],
  });
  var matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows[0].hasPanel, true, "Panel is here");
  assert.equal(matrix.visibleRows[0].detailPanel, null, "Panel is not created");
  assert.equal(
    matrix.visibleRows[0].isDetailPanelShowing,
    false,
    "detail panel is not showing"
  );
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(
    matrix.visibleRows[0].isDetailPanelShowing,
    true,
    "detail panel is showing"
  );
  assert.ok(matrix.visibleRows[0].detailPanel, "Detail Panel is created");
  matrix.visibleRows[0].detailPanel.getQuestionByName("q1").value = 1;
  assert.deepEqual(
    survey.data,
    { matrix: { row1: { q1: 1 } } },
    "Survey data set correctly"
  );
  survey.data = { matrix: { row1: { q1: 2 }, row2: { col1: 1, q1: 3 } } };
  assert.equal(
    matrix.visibleRows[0].detailPanel.getQuestionByName("q1").value,
    2,
    "The value set from the survey correctly into opened detail panel question"
  );
  matrix.visibleRows[1].showDetailPanel();
  assert.equal(
    matrix.visibleRows[1].detailPanel.getQuestionByName("q1").value,
    3,
    "The value set from the survey correctly into closed detail panel question"
  );
});
QUnit.test("Detail panel and matrix read-only", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        detailPanelMode: "underRow",
        detailElements: [{ type: "text", name: "q1" }],
        rows: ["row1", "row2"],
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2" },
        ],
      },
    ],
  });
  var matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  matrix.readOnly = true;
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(matrix.visibleRows[0].detailPanel.readOnly, true, "Panel is read-only");
  matrix.readOnly = false;
  assert.equal(matrix.visibleRows[0].detailPanel.readOnly, false, "Panel is not read-only");
  matrix.readOnly = true;
  assert.equal(matrix.visibleRows[0].detailPanel.readOnly, true, "Panel is read-only again");
});
QUnit.test(
  "Detail panel column and detail Panel have the same names, get/set values",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          detailPanelMode: "underRow",
          detailElements: [{ type: "text", name: "q1" }],
          rows: ["row1", "row2"],
          columns: [{ cellType: "text", name: "q1" }],
        },
      ],
    });
    var matrix = <QuestionMatrixDropdownModel>(
      survey.getQuestionByName("matrix")
    );
    var row = matrix.visibleRows[0];
    row.showDetailPanel();
    row.getQuestionByColumnName("q1").value = "val1";
    assert.equal(
      row.getQuestionByColumnName("q1").value,
      "val1",
      "Value is changed in row, #1"
    );
    assert.equal(
      row.detailPanel.getQuestionByName("q1").value,
      "val1",
      "Value is changed in detail, #1"
    );
    row.detailPanel.getQuestionByName("q1").value = "val2";
    assert.equal(
      row.getQuestionByColumnName("q1").value,
      "val2",
      "Value is changed in row, #2"
    );
    assert.equal(
      row.detailPanel.getQuestionByName("q1").value,
      "val2",
      "Value is changed in detail, #2"
    );
    row.getQuestionByColumnName("q1").value = "val3";
    assert.equal(
      row.getQuestionByColumnName("q1").value,
      "val3",
      "Value is changed in row, #3"
    );
    assert.equal(
      row.detailPanel.getQuestionByName("q1").value,
      "val3",
      "Value is changed in detail, #3"
    );
  }
);

QUnit.test("Detail panel, run conditions", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }],
        detailElements: [
          { type: "text", name: "q1", visibleIf: "{question1} = 'val1'" },
          { type: "text", name: "q2", visibleIf: "{row.col1} = 'val2'" },
          { type: "text", name: "q3", visibleIf: "{row.q2} = 'val3'" },
          { type: "text", name: "q4", visibleIf: "{question1} != 'val1'" },
        ],
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.detailPanelMode, "underRow", "detail panel mode load correctly");
  assert.equal(matrix.detailElements.length, 4, "detail elements loads correctly");
  matrix.visibleRows[0].showDetailPanel();
  assert.ok(matrix.visibleRows[0].detailPanel, "Detail Panel is created");
  const panel = matrix.visibleRows[0].detailPanel;
  assert.equal(panel.questions[0].isVisible, false, "first question is invisible");
  assert.equal(panel.questions[1].isVisible, false, "second question is invisible");
  assert.equal(panel.questions[2].isVisible, false, "third question is invisible");
  assert.equal(panel.questions[3].isVisible, true, "fourth question is invisible");
  survey.setValue("question1", "val1");
  assert.equal(panel.questions[0].isVisible, true, "first question is visible now");
  assert.equal(panel.questions[3].isVisible, false, "fourth question is invisible now");
  matrix.visibleRows[0].cells[0].question.value = "val2";
  assert.equal(panel.questions[1].isVisible, true, "second question is visible now");
  panel.getQuestionByName("q2").value = "val3";
  assert.equal(panel.questions[2].isVisible, true, "third question is visible now");
});
QUnit.test("Detail panel, run conditions & matrix before elements, bug#9137", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }],
        cellType: "text",
        detailElements: [
          { type: "matrixdynamic", name: "m1", columns: [{ name: "col1", defaultValue: "v1" }, { name: "col2", visibleIf: "{row.col1} notempty" }] },
          { type: "text", name: "q1", visibleIf: "{row.col1} = 'val2'" },
          { type: "text", name: "q2", visibleIf: "{row.q1} = 'val3'" }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.visibleRows[0].showDetailPanel();
  assert.ok(matrix.visibleRows[0].detailPanel, "Detail Panel is created");
  const panel = matrix.visibleRows[0].detailPanel;
  assert.equal(panel.getQuestionByName("m1").visibleRows.length, 2, "nested matrix rows are created");
  assert.equal(panel.getQuestionByName("q1").isVisible, false, "first question is invisible, #1");
  assert.equal(panel.getQuestionByName("q2").isVisible, false, "second question is invisible, #1");
  matrix.visibleRows[0].cells[0].question.value = "val2";
  assert.equal(panel.getQuestionByName("q1").isVisible, true, "first question is visible, #2");
  assert.equal(panel.getQuestionByName("q2").isVisible, false, "second question is invisible, #2");
  panel.getQuestionByName("q1").value = "val3";
  assert.equal(panel.getQuestionByName("q1").isVisible, true, "first question is visible, #3");
  assert.equal(panel.getQuestionByName("q2").isVisible, true, "second question is visible, #3");
});
QUnit.test("Detail panel and copyDefaultValueFromLastEntry", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        detailPanelMode: "underRow",
        copyDefaultValueFromLastEntry: true,
        detailElements: [{ type: "text", name: "q1" }],
        rowCount: 1,
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2" },
        ],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.value = [{ col1: "col1Value", q1: "q1Value" }];
  matrix.addRow();
  assert.deepEqual(matrix.value, [{ col1: "col1Value", q1: "q1Value" }, { col1: "col1Value", q1: "q1Value" }]);
});
QUnit.test("Detail panel, rendered table", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var rows = matrix.renderedTable.rows;
  assert.equal(rows.length, 4, "There are two rows in rendering table");
  assert.equal(
    rows[1].cells.length,
    5,
    "detail cell + 3 columns + delete button"
  );
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    5,
    "Header has for detail button space two"
  );
  assert.equal(
    rows[1].cells[0].isActionsCell,
    true,
    "it is a detail cell (in actions cell)"
  );
  var lastrowId = rows[3].id;
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(rows.length, 5, "detail row is added");
  assert.equal(
    matrix.renderedTable.rows[4].id,
    lastrowId,
    "We use the same rows"
  );
  assert.equal(
    rows[2].cells.length,
    3,
    "There are only 3 cells in detail panel row"
  );
  assert.equal(
    rows[2].cells[0].colSpans,
    1,
    "the first cell in detail panel has one colspan"
  );
  assert.equal(
    rows[2].cells[0].isEmpty,
    true,
    "the first cell in detail panel is empty"
  );
  assert.equal(
    rows[2].cells[1].colSpans,
    3,
    "colSpans set correctly for detail panel cell"
  );
  assert.equal(
    rows[2].cells[2].colSpans,
    1,
    "the last cell in detail panel has one colspan"
  );
  assert.equal(
    rows[2].cells[2].isEmpty,
    true,
    "the last cell in detail panel is empty"
  );
  matrix.addRow();
  assert.equal(rows.length, 7, "We added a new row");
  matrix.removeRow(1);
  assert.equal(rows.length, 5, "We removed one row");
  assert.equal(rows[2].isDetailRow, true, "We removed correct row");
  matrix.removeRow(0);
  assert.equal(rows.length, 2, "We removed data and detail panel row");
  assert.equal(rows[1].isDetailRow, false, "We removed correct row");
});

QUnit.test("Detail panel, rendered table design mode", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  survey.setDesignMode(true);
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var rows = matrix.renderedTable.rows;

  matrix.visibleRows[0].showDetailPanel();

  assert.equal(
    rows[2].cells[0].colSpans,
    4,
    "colSpans set correctly for detail panel cell design mode"
  );
});

QUnit.test("Detail panel, rendered table mobile", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  survey.setIsMobile(true);
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var rows = matrix.renderedTable.rows;

  matrix.visibleRows[0].showDetailPanel();

  assert.equal(
    rows[2].cells[rows[2].cells.length - 1].isActionsCell,
    true,
    "the last cell in detail panel is actions cell"
  );

  assert.deepEqual(
    rows[2].cells[6].item.value.actions.map(a => a.id),
    ["show-detail-mobile", "remove-row"]
  );
});

QUnit.test("Detail panel, rendered table mobile - expand collapse", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  survey.setIsMobile(true);
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var rows = matrix.renderedTable.rows;

  var action1 = rows[1].cells[rows[1].cells.length - 1].item.value.actions[0];
  assert.notOk(matrix.visibleRows[1].isDetailPanelShowing);
  assert.equal(action1.title, "Show Details");
  action1.action(action1);
  assert.ok(matrix.visibleRows[1].isDetailPanelShowing);
  assert.equal(action1.title, "Hide Details");

  action1.action(action1);
  assert.notOk(matrix.visibleRows[1].isDetailPanelShowing);
  assert.equal(action1.title, "Show Details");

});

QUnit.test("Detail panel, create elements in code", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.onHasDetailPanelCallback = (
    row: MatrixDropdownRowModelBase
  ): boolean => {
    return true;
  };
  var createThirdQuestion = false;
  matrix.onCreateDetailPanelCallback = (
    row: MatrixDropdownRowModelBase,
    panel: PanelModel
  ) => {
    panel.addNewQuestion("text", "q1");
    panel.addNewQuestion("text", "q2");
    if (createThirdQuestion) {
      panel.addNewQuestion("text", "q3");
    }
  };
  assert.equal(matrix.visibleRows[0].hasPanel, true, "There is a panel");
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(
    matrix.visibleRows[0].detailPanel.questions.length,
    2,
    "There are two questions"
  );
  matrix.visibleRows[0].hideDetailPanel();
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(
    matrix.visibleRows[0].detailPanel.questions.length,
    2,
    "There are still two questions"
  );
  createThirdQuestion = true;
  matrix.visibleRows[0].hideDetailPanel(true);
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(
    matrix.visibleRows[0].detailPanel.questions.length,
    3,
    "We have 3 questions now"
  );
});
QUnit.test("Detail panel created in code + custom actions, create elements in code", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 1,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.onHasDetailPanelCallback = (
    row: MatrixDropdownRowModelBase
  ): boolean => {
    return true;
  };
  matrix.onCreateDetailPanelCallback = (
    row: MatrixDropdownRowModelBase,
    panel: PanelModel
  ) => {
    panel.addNewQuestion("text", "q1");
    panel.getQuestionByName("q1").value = row.getValue("col1");
    panel.footerActions.push({
      id: "saveDetailPanel",
      action: () => {
        row.getQuestionByName("col1").value = panel.getQuestionByName("q1").value;
        row.hideDetailPanel(true);
      }
    });
  };
  matrix.value = [{ col1: "value1" }];
  assert.equal(matrix.visibleRows[0].hasPanel, true, "There is a panel");
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(matrix.visibleRows[0].isDetailPanelShowing, true);
  assert.equal(
    matrix.visibleRows[0].detailPanel.questions[0].value,
    "value1",
    "Value is set"
  );
  matrix.visibleRows[0].detailPanel.questions[0].value = "value2";
  matrix.visibleRows[0].detailPanel.footerActions[0].action();
  assert.equal(matrix.visibleRows[0].isDetailPanelShowing, false, "We close detail panel");
  assert.deepEqual(matrix.value, [{ col1: "value2", q1: "value2" }]);
});
QUnit.test("Detail panel, detailPanelShowOnAdding property", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        detailPanelShowOnAdding: true,
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.detailPanelShowOnAdding, true, "load property correctly");
  assert.equal(
    matrix.visibleRows[1].isDetailPanelShowing,
    false,
    "We show detail panels collapsed"
  );
  matrix.addRow();
  assert.equal(
    matrix.visibleRows[2].isDetailPanelShowing,
    true,
    "Show detail panel on adding row"
  );
  matrix.detailPanelShowOnAdding = false;
  matrix.addRow();
  assert.equal(
    matrix.visibleRows[3].isDetailPanelShowing,
    false,
    "Do not show detail panel on adding row"
  );
});
QUnit.test("Do not clear all rows if minRowCount is set", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [
          {
            name: "col1",
            cellType: "dropdown",
            choices: [1, 2, 3],
          },
        ],
        rowCount: 1,
        minRowCount: 1,
      },
    ],
  });
  survey.data = {
    q1: [{ col1: 1 }, { col1: 2 }],
  };
  var matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  assert.equal(matrix.rowCount, 2, "There are two rows");
  survey.clear();
  assert.equal(matrix.rowCount, 1, "We should have one row");
});
QUnit.test("Detail panel in designer", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
      },
    ],
  });
  survey.setDesignMode(true);
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(
    matrix.visibleRows.length,
    2,
    "There are two visible rows by default"
  );
  assert.equal(
    matrix.visibleRows[0].isDetailPanelShowing,
    false,
    "We do not have detail row"
  );
  matrix.detailPanelMode = "underRow";
  assert.equal(
    matrix.visibleRows[0].isDetailPanelShowing,
    true,
    "We show the first detail panel now"
  );
  assert.equal(
    matrix.visibleRows[1].isDetailPanelShowing,
    false,
    "We do not show detail panel for the second row"
  );
  assert.equal(
    matrix.visibleRows[1].hasPanel,
    true,
    "Second row still has panel"
  );
  assert.equal(
    matrix.visibleRows[0].detailPanel.id,
    matrix.detailPanel.id,
    "We use matrix detail panel in designer"
  );
  assert.equal(
    matrix.detailPanel.isDesignMode,
    true,
    "detail panel in design mode"
  );
});
QUnit.test("Detail panel, show errors in panels", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1", isRequired: true }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var rows = matrix.visibleRows;
  rows[0].showDetailPanel();
  assert.equal(
    matrix.hasErrors(true),
    true,
    "There is an error in the first row"
  );
  rows[0].detailPanel.getQuestionByName("q1").value = "val1";
  assert.equal(
    matrix.hasErrors(true),
    true,
    "There is an error in the second row"
  );
  assert.equal(
    rows[1].isDetailPanelShowing,
    true,
    "We show the detail panel in the second row"
  );
  rows[1].detailPanel.getQuestionByName("q1").value = "val2";
  assert.equal(matrix.hasErrors(true), false, "There is no errors anymore");
});
QUnit.test("Detail panel, underRowSingle", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 3,
        detailPanelMode: "underRowSingle",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1", isRequired: true }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var rows = matrix.visibleRows;
  rows[0].showDetailPanel();
  rows[1].showDetailPanel();
  assert.equal(
    rows[1].isDetailPanelShowing,
    true,
    "Second row shows detail panel"
  );
  assert.equal(
    rows[0].isDetailPanelShowing,
    false,
    "We automatically hide detail panel in the first row"
  );
});
QUnit.test(
  "Detail panel, show errors in panels and underRowSingle mode, Bug#2530",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          rowCount: 2,
          detailPanelMode: "underRowSingle",
          columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
          detailElements: [{ type: "text", name: "q1", isRequired: true }],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    var rows = matrix.visibleRows;
    assert.equal(
      rows[0].isDetailPanelShowing || rows[1].isDetailPanelShowing,
      false,
      "The the first and second rows are hidden by default"
    );
    assert.equal(
      matrix.hasErrors(true),
      true,
      "There is an error in the first row"
    );
    assert.equal(
      rows[0].isDetailPanelShowing,
      true,
      "We show the detail panel in the first row"
    );
    assert.equal(
      rows[1].isDetailPanelShowing,
      false,
      "We do not show the detail panel in the second row yet"
    );
    rows[0].detailPanel.getQuestionByName("q1").value = "val1";
    assert.equal(
      matrix.hasErrors(true),
      true,
      "There is an error in the second row"
    );
    assert.equal(
      rows[1].isDetailPanelShowing,
      true,
      "We show the detail panel in the second row"
    );
    rows[1].detailPanel.getQuestionByName("q1").value = "val2";
    assert.equal(matrix.hasErrors(true), false, "There is no errors anymore");
  }
);
QUnit.test("Detail panel, rendered table and className", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }],
        rows: ["row1", "row2"],
      },
    ],
  });
  setOldTheme(survey);
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.visibleRows[0].showDetailPanel();
  assert.equal(matrix.renderedTable.headerRow.cells[1].className, "sv_matrix_cell_header sv_matrix_cell--dropdown", "Set header cell");
  var rows = matrix.renderedTable.rows;
  assert.equal(
    rows[1].cells[0].className,
    "sv_matrix_cell sv_matrix_cell_actions",
    "Detail button css (in actions cell)"
  );

  assert.equal(
    rows[1].cells[1].className,
    "sv_matrix_cell sv-table__cell--row-text sv_matrix_cell_detail_rowtext",
    "row text css"
  );
  assert.equal(
    rows[1].cells[2].className,
    "sv_matrix_cell",
    "row question cell css"
  );
  assert.equal(rows[1].className, "sv_matrix_row");
  assert.equal(rows[2].className, "sv_matrix_row sv_matrix_detail_row");
  assert.equal(
    rows[2].cells[1].className,
    "sv_matrix_cell_detail_panel",
    "panel cell css"
  );
});

QUnit.test("Detail panel, Process text in titles", function (assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", name: "rootQ" },
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [
          {
            type: "text",
            name: "q1",
            title:
              "rowIndex:{rowIndex},rootQ:{rootQ},row.col1:{row.col1},row.q2:{row.q2}",
          },
          { type: "text", name: "q2" },
        ],
      },
    ],
  });
  survey.data = {
    rootQ: "rootVal",
    matrix: [{}, { col1: "val1", q2: "valQ2" }],
  };
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");

  matrix.visibleRows[1].showDetailPanel();
  var q1 = matrix.visibleRows[1].detailPanel.getQuestionByName("q1");
  assert.equal(
    q1.locTitle.renderedHtml,
    "rowIndex:2,rootQ:rootVal,row.col1:val1,row.q2:valQ2",
    "Text preprocessed correctly"
  );
});
QUnit.test("Detail panel & survey.onValueChanged & empty value, Bug#9169", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        columns: [{ name: "col1" }, { name: "col2" }],
        detailElements: [
          { type: "text", name: "q1" }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");

  matrix.visibleRows[0].showDetailPanel();
  const q1 = matrix.visibleRows[0].detailPanel.getQuestionByName("q1");
  const logs: any = [];
  survey.onValueChanged.add((sender, options) => {
    logs.push({ name: options.name, value: options.value });
  });
  q1.value = "abc";
  assert.deepEqual(logs, [{ name: "matrix", value: [{ q1: "abc" }, {}] }], "#1");
  q1.clearValue();
  assert.deepEqual(logs, [
    { name: "matrix", value: [{ q1: "abc" }, {}] },
    { name: "matrix", value: [] }
  ], "#2");
});

QUnit.test("copyvalue trigger for dropdown matrix cell", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "q1",
        rows: ["item1", "Item2"],
        columns: [{ name: "c1", cellType: "text" }],
      },
      {
        type: "matrixdropdown",
        name: "q2",
        rows: ["item1", "Item2"],
        columns: [{ name: "c1", cellType: "text" }],
      },
    ],
    triggers: [
      {
        type: "copyvalue",
        expression: "{q1.item1.c1} notempty",
        setToName: "q2.item1.c1",
        fromName: "q1.item1.c1",
      },
      {
        type: "copyvalue",
        expression: "{q1.Item2.c1} notempty",
        setToName: "q2.Item2.c1",
        fromName: "q1.Item2.c1",
      },
    ],
  });
  var q1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  var q2 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q2");
  q1.visibleRows[0].cells[0].value = "val1";
  q1.visibleRows[1].cells[0].value = "val2";
  assert.equal(
    q2.visibleRows[0].cells[0].value,
    "val1",
    "copy value for item1"
  );
  assert.equal(
    survey.runCondition("{q1.Item2.c1} notempty"),
    true,
    "The expression returns true"
  );
  assert.equal(
    survey.runExpression("{q1.Item2.c1}"),
    "val2",
    "The expression returns val2"
  );
  assert.equal(
    q2.visibleRows[1].cells[0].value,
    "val2",
    "copy value for Item2"
  );
});
QUnit.test(
  "MatrixDynamic, test renderedTable.showTable&showAddRowOnBottom",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          rowCount: 0,
          hideColumnsIfEmpty: true,
          columns: [{ name: "col1" }],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(matrix.renderedTable.showTable, false, "There is no rows");
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      false,
      "Do not show add button"
    );
    matrix.addRow();
    assert.equal(matrix.renderedTable.showTable, true, "There is a row");
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      true,
      "Show add button"
    );
    matrix.removeRow(0);
    assert.equal(
      matrix.renderedTable.showTable,
      false,
      "Matrix is empty again"
    );
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      false,
      "Do not show add button again"
    );
    matrix.hideColumnsIfEmpty = false;
    assert.equal(
      matrix.renderedTable.showTable,
      true,
      "hideColumnsIfEmpty is false"
    );
    survey.setDesignMode(true);
    matrix.hideColumnsIfEmpty = true;
    assert.equal(matrix.renderedTable.showTable, true, "survey in design mode");
  }
);
QUnit.test(
  "MatrixDynamic, Hide/show add row button on changing allowAddRows",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          rowCount: 2,
          maxRowCount: 3,
          hideColumnsIfEmpty: true,
          columns: [{ name: "col1" }],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      true,
      "We have a row here"
    );
    matrix.allowAddRows = false;
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      false,
      "We do not allow add rows"
    );
    matrix.allowAddRows = true;
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      true,
      "We have a row here again"
    );
    matrix.addRow();
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      false,
      "max row count is 3"
    );
    matrix.rowCount = 1;
    assert.equal(
      matrix.renderedTable.showAddRowOnBottom,
      true,
      "row count is 1"
    );
  }
);

QUnit.test("Matrixdynamic change column.readOnly property", function (assert) {
  var question = new QuestionMatrixDynamicModel("matrixDynamic");
  question.rowCount = 2;
  question.columns.push(new MatrixDropdownColumn("column1"));
  question.columns[0].readOnly = true;
  assert.equal(
    question.columns[0].templateQuestion.isReadOnly,
    true,
    "set correctly"
  );
});

QUnit.test("Row actions, check onGetMatrixRowActions Event", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [{ name: "col1" }],
        rows: ["row1"],
      },
    ],
  });
  var options;
  var surveyFromEvent;
  survey.onGetMatrixRowActions.add((s, opt) => {
    options = opt;
    surveyFromEvent = s;
  });
  const matrix = survey.getQuestionByName("matrix");
  (<QuestionMatrixDynamicModel>matrix).renderedTable.rows;
  assert.ok(surveyFromEvent == survey);
  assert.ok(options.question == matrix);
  assert.ok(options.row == matrix.visibleRows[0]);
  assert.deepEqual(options.actions, []);
});

QUnit.test("Row actions, check getUpdatedMatrixRowActions", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [{ name: "col1" }],
        rows: ["row1"],
      },
    ],
  });
  var expectedActions = [{ title: "Action 1" }, { title: "Action 2" }];
  survey.onGetMatrixRowActions.add((survey, opt) => {
    opt.actions = expectedActions;
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  var actions = [];
  assert.deepEqual(
    survey.getUpdatedMatrixRowActions(matrix, matrix.visibleRows[0], actions),
    expectedActions
  );
});

QUnit.test("moveRowByIndex test", function (assert) {
  var matrixD = new QuestionMatrixDynamicModel("q1");
  matrixD.value = [{ v1: "v1" }, { v2: "v2" }];
  matrixD.moveRowByIndex(1, 0);
  assert.deepEqual(matrixD.value, [{ v2: "v2" }, { v1: "v1" }]);
});

QUnit.test("Row actions, rendered table and className", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [{ name: "col1" }],
        rows: ["row1"],
      },
    ],
  });
  setOldTheme(survey);
  survey.onGetMatrixRowActions.add((_, opt) => {
    opt.actions = [
      { title: "Action 1" },
      { title: "Action 2", location: "end" },
    ];
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    4,
    "Actions headers should appear"
  );
  var rows = matrix.renderedTable.rows;
  assert.equal(
    rows[1].cells[0].className,
    "sv_matrix_cell sv_matrix_cell_actions",
    "Actions cell css"
  );
  const leftActions = rows[1].cells[0].item.getData().actions;
  assert.ok(leftActions.length === 1, "left actions count: 1");
  assert.ok(
    leftActions[0].title === "Action 1",
    "action 1 in left actions cell"
  );
  assert.ok(
    leftActions[0] instanceof Action,
    "actions in cell are instances of Action"
  );
  assert.equal(rows[1].cells[1].className, "sv_matrix_cell sv-table__cell--row-text", "text cell");
  assert.equal(rows[1].cells[2].className, "sv_matrix_cell", "ordinary cell");
  assert.equal(
    rows[1].cells[3].className,
    "sv_matrix_cell sv_matrix_cell_actions",
    "Actions cell css"
  );
  const rightActions = rows[1].cells[3].item.getData().actions;
  assert.ok(rightActions.length === 1, "right actions count: 1");
  assert.ok(
    rightActions[0].title === "Action 2",
    "action 2 in right actions cell"
  );
  assert.ok(
    rightActions[0] instanceof Action,
    "actions in cell are instances of Action"
  );
});
QUnit.test("onGetMatrixRowActions should be called 1 time", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [{ name: "col1" }],
        rows: ["row1"],
      },
    ],
  });
  var count = 0;
  survey.onGetMatrixRowActions.add((_, opt) => {
    count++;
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.renderedTable;
  assert.equal(count, 1);
});

QUnit.test(
  "Matrixdynamic change column.question.choices on changing choices in matrix",
  function (assert) {
    var question = new QuestionMatrixDynamicModel("matrixDynamic");
    question.rowCount = 2;
    question.choices = ["item1", "item2", "item3"];
    question.addColumn("col1");
    question.addColumn("col2").cellType = "checkbox";
    assert.equal(question.choices.length, 3, "There are 5 choices in matrix");
    var rows = question.visibleRows;
    assert.equal(
      rows[0].cells[0].question.choices.length,
      3,
      "There are 3 items in col1 question "
    );
    assert.equal(
      rows[0].cells[1].question.choices.length,
      3,
      "There are 3 items in col2 question "
    );
    question.choices.push(new ItemValue("item4"));
    rows = question.visibleRows;
    assert.equal(
      rows[0].cells[0].question.choices.length,
      4,
      "There are 4 items in col1 question "
    );
    assert.equal(
      rows[0].cells[1].question.choices.length,
      4,
      "There are 4 items in col2 question "
    );
    question.choices[0].value = "item11";
    question.choices[3].text = "text4";
    rows = question.visibleRows;
    assert.equal(
      rows[0].cells[0].question.choices[0].value,
      "item11",
      "value item in col1 question changed"
    );
    assert.equal(
      rows[0].cells[1].question.choices[0].value,
      "item11",
      "value item in col2 question changed"
    );
    assert.equal(
      rows[0].cells[0].question.choices[3].text,
      "text4",
      "text item in col1 question changed"
    );
    assert.equal(
      rows[0].cells[1].question.choices[3].text,
      "text4",
      "text item in col2 question changed"
    );
  }
);
QUnit.test(
  "survey.onMatrixRowRemoving. Clear the row if it is the last one",
  function (assert) {
    var survey = new SurveyModel();
    var removedRowIndex = -1;
    var visibleRowsCount = -1;
    survey.onMatrixRowRemoving.add(function (survey, options) {
      removedRowIndex = options.rowIndex;
      visibleRowsCount = options.question.visibleRows.length;
      options.allow = options.question.rowCount > 1;
      if (!options.allow) {
        options.row.clearValue();
      }
    });
    var page = survey.addNewPage("Page 1");
    var q1 = new QuestionMatrixDynamicModel("matrixdynamic");
    page.addElement(q1);
    q1.addColumn("col1");
    q1.rowCount = 3;
    q1.value = [{ col1: 1 }, { col1: 2 }, { col1: 3 }];
    assert.equal(q1.rowCount, 3, "there are three rows");
    q1.removeRow(1);
    assert.equal(q1.rowCount, 2, "there are two rows");
    assert.equal(
      removedRowIndex,
      1,
      "onMatrixRowRemoved event has been fired correctly"
    );
    assert.equal(
      visibleRowsCount,
      3,
      "There should be three visible rows in event"
    );
    q1.removeRow(1);
    assert.equal(q1.rowCount, 1, "there is one row now");
    assert.deepEqual(q1.value, [{ col1: 1 }], "We have value in the cell");
    q1.removeRow(0);
    assert.equal(q1.rowCount, 1, "We do not allow to remove the row");
    assert.deepEqual(q1.value, [], "We clear value in the row");
  }
);
QUnit.test("Text processing in rows and columns, rendered table", function (
  assert
) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "text",
        name: "q1",
        defaultValue: "value1",
      },
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [{ name: "col1", title: "Col:{q1}" }],
        rows: [{ value: "row1", text: "Row:{q1}" }],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    2,
    "Row column + column"
  );
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    2,
    "Row column + column"
  );

  assert.equal(
    matrix.renderedTable.headerRow.cells[1].locTitle.textOrHtml,
    "Col:value1",
    "column text"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells[0].locTitle.textOrHtml,
    "Row:value1",
    "row text"
  );
  survey.setValue("q1", "val2");
  assert.equal(
    matrix.renderedTable.headerRow.cells[1].locTitle.textOrHtml,
    "Col:val2",
    "column text, #2"
  );
  assert.equal(
    matrix.renderedTable.rows[1].cells[0].locTitle.textOrHtml,
    "Row:val2",
    "row text, #2"
  );
});
QUnit.test("getDisplayValue() function in matrix dynamic, Bug#", function (
  assert
) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        columns: [
          {
            name: "col1",
            title: "Column 1",
            cellType: "dropdown",
            choices: [
              { value: 1, text: "A" },
              { value: 2, text: "B" },
              { value: 3, text: "C" },
            ],
          },
        ],
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.value = [{ col1: 1 }, { col1: 3 }];
  var counter = 0;
  survey.onValueChanged.add((sender, options) => {
    counter++;
  });
  var displayValue = matrix.getDisplayValue(true, [{ col1: 2 }]);
  assert.deepEqual(displayValue, [{ "Column 1": "B" }], "Do not use value");
  assert.deepEqual(
    matrix.value,
    [{ col1: 1 }, { col1: 3 }],
    "Value is still the same"
  );
  assert.equal(counter, 0, "We do not change the value during processing");
});

QUnit.test("getDisplayValue() function in matrix Dropdown, Bug#", function (
  assert
) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            title: "Column 1",
            cellType: "dropdown",
            choices: [
              { value: 1, text: "A" },
              { value: 2, text: "B" },
              { value: 3, text: "C" },
            ],
          },
        ],
        rows: [{ value: "row1", text: "Row 1" }],
      },
    ],
  });
  var matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  matrix.value = { row1: { col1: 1 } };
  var counter = 0;
  survey.onValueChanged.add((sender, options) => {
    counter++;
  });
  var displayValue = matrix.getDisplayValue(true, { row1: { col1: 2 } });
  assert.deepEqual(
    displayValue,
    { "Row 1": { "Column 1": "B" } },
    "Do not use value"
  );
  assert.deepEqual(
    matrix.value,
    { row1: { col1: 1 } },
    "Value is still the same"
  );
  assert.equal(counter, 0, "We do not change the value during processing");
});
QUnit.test("getDisplayValue() function in matrix Dropdown with rowsVisibleIf, Bug#3430", function (
  assert
) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        rowsVisibleIf: "{val} contains {item}",
        columns: [
          {
            name: "col1",
            cellType: "dropdown",
            choices: [
              { value: 1, text: "A" },
              { value: 2, text: "B" },
              { value: 3, text: "C" },
              { value: 4, text: "C" },
              { value: 5, text: "C" },
            ],
          },
        ],
        rows: ["row1", "row2", "row3", "row4", "row5"],
      },
    ],
  });
  var matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  survey.setValue("val", ["row2", "row3"]);
  assert.equal(matrix.visibleRows.length, 2, "There are two rows visible");

  matrix.value = { row2: { col1: 1 }, row3: { col1: 2 } };
  const displayValue = matrix.getDisplayValue(true);
  assert.deepEqual(
    displayValue,
    { "row2": { "col1": "A" }, "row3": { "col1": "B" } },
    "Rows are filtered"
  );
});

QUnit.test(
  "Error on setting properties into column cellType:'text', Bug#2897",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdropdown",
          name: "matrix",
          columns: [
            {
              name: "col1",
              cellType: "text",
            },
          ],
          rows: [{ value: "row1", text: "Row 1" }],
        },
      ],
    });
    var matrix = <QuestionMatrixDropdownModel>(
      survey.getQuestionByName("matrix")
    );
    var rows = matrix.visibleRows;
    matrix.columns[0].inputType = "date";
    assert.equal(
      rows[0].cells[0].question.inputType,
      "date",
      "Set the property correctly"
    );
  }
);
QUnit.test(
  "MatrixDynamic, test renderedTable column locString on adding new column",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          columns: [{ name: "col1" }],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(
      matrix.renderedTable.headerRow.cells.length,
      1 + 1,
      "We have one column and delete row"
    );
    assert.equal(
      matrix.renderedTable.headerRow.cells[0].locTitle.renderedHtml,
      "col1",
      "Title rendered from JSON"
    );
    matrix.addColumn("col2");
    assert.equal(
      matrix.renderedTable.headerRow.cells[1].locTitle.renderedHtml,
      "col2",
      "Title rendered from addColumn"
    );
    matrix.columns.push(new MatrixDropdownColumn("col3"));
    assert.equal(
      matrix.renderedTable.headerRow.cells[2].locTitle.renderedHtml,
      "col3",
      "Title rendered from columns.push"
    );
  }
);
QUnit.test(
  "MatrixDynamic, test renderedTable, do not render empty locTitle in header",
  function (assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          columns: [{ name: "col1" }],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    assert.equal(
      matrix.renderedTable.headerRow.cells.length,
      1 + 1,
      "We have one column and delete row"
    );
    assert.equal(
      matrix.renderedTable.headerRow.cells[0].hasTitle,
      true,
      "column header"
    );
    assert.equal(
      matrix.renderedTable.headerRow.cells[1].hasTitle,
      false,
      "nothing"
    );
    matrix.columnLayout = "vertical";
    assert.equal(
      matrix.renderedTable.rows[1].cells[0].hasTitle,
      true,
      "column header, vertical"
    );
    assert.equal(
      matrix.renderedTable.rows[2].cells[0].hasTitle,
      false,
      "nothing, vertical"
    );
  }
);
QUnit.test(
  "Focus first visible enabled cell on adding a new row from UI",
  function (assert) {
    var focusedQuestionId = "";
    var oldFunc = SurveyElement.FocusElement;
    SurveyElement.FocusElement = function (elId: string): boolean {
      focusedQuestionId = elId;
      return true;
    };

    var survey = new SurveyModel({
      elements: [
        {
          type: "matrixdynamic",
          name: "matrix",
          cellType: "text",
          minRowCount: 1,
          maxRowCount: 2,
          rowCount: 1,
          columns: [
            { name: "col1", visible: false },
            { name: "col2", readOnly: true },
            { name: "col3" },
            { name: "col4" },
          ],
        },
      ],
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
    matrix.addRowUI();
    assert.equal(
      focusedQuestionId,
      matrix.visibleRows[1].cells[2].question.inputId,
      "focus correct value"
    );
    focusedQuestionId = "";
    matrix.addRowUI();
    assert.equal(focusedQuestionId, "", "new row can't be added");
    SurveyElement.FocusElement = oldFunc;
  }
);
QUnit.test(
  "Matrixdynamic onMatrixValueChanging - do not call event on clear empty cell",
  function (assert) {
    var json = {
      questions: [
        {
          type: "matrixdynamic",
          name: "q1",
          rowCount: 1,
          columns: [
            {
              name: "col1",
              cellType: "dropdown",
              choices: [1, 2, 3, 4, 5],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var counter = 0;
    survey.onMatrixCellValueChanging.add(function (sender, options) {
      counter++;
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    var cellQuestion = matrix.visibleRows[0].cells[0].question;
    cellQuestion.clearIncorrectValues();
    assert.equal(counter, 0, "There is not value to clear");
    cellQuestion.value = 1;
    assert.equal(counter, 1, "value is set");
    cellQuestion.clearIncorrectValues();
    assert.equal(counter, 1, "value is correct");
  }
);
QUnit.test(
  "Matrixdynamic onMatrixValueChanging - do not call event on set the same renderedValue",
  function (assert) {
    var json = {
      questions: [
        {
          type: "matrixdynamic",
          name: "q1",
          rowCount: 1,
          columns: [
            {
              name: "col1",
              choices: [1, 2, 3, 4, 5],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var counter = 0;
    survey.onMatrixCellValueChanging.add(function (sender, options) {
      counter++;
    });
    var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
    var cellQuestion = <QuestionDropdownModel>(
      matrix.visibleRows[0].cells[0].question
    );
    cellQuestion.renderedValue = undefined;
    assert.equal(counter, 0, "There is not value to clear");
    cellQuestion.renderedValue = 1;
    assert.equal(counter, 1, "Call one time");
    cellQuestion.renderedValue = 1;
    assert.equal(counter, 1, "Do not call on the same value");
    cellQuestion.renderedValue = undefined;
    assert.equal(counter, 2, "Value is undefined");
    cellQuestion.renderedValue = undefined;
    assert.equal(counter, 2, "Value is still undefined");
  }
);

QUnit.test("Drag handler cell in rendered table", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        allowRowsDragAndDrop: true,
        columns: ["col1"]
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(
    matrix.renderedTable.headerRow.cells.length,
    3,
    "Drag handler cell + one column + actions cell"
  );
  var rows = matrix.renderedTable.rows;
  assert.equal(
    rows[1].cells[0].isDragHandlerCell,
    true,
    "isDragHandlerCell"
  );
  assert.equal(
    rows[3].cells[0].isDragHandlerCell,
    true,
    "isDragHandlerCell"
  );
  assert.equal(
    rows[1].cells[2].isActionsCell,
    true,
    "isActionsCell"
  );
  assert.equal(
    rows[3].cells[2].isActionsCell,
    true,
    "isActionsCell"
  );
});

QUnit.test("allowRowReorder with readOnly", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        allowRowsDragAndDrop: true,
        "readOnly": true,
        columns: ["col1"]
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.renderedTable.isRowsDragAndDrop, false, "#1");
  matrix.readOnly = false;
  assert.equal(matrix.renderedTable.isRowsDragAndDrop, true, "#2");
});

QUnit.test("allowRowReorder &mode=display", function (assert) {
  const survey = new SurveyModel({
    mode: "display",
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        allowRowReorder: true,
        columns: ["col1"]
      },
    ],
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.renderedTable.isRowsDragAndDrop, false, "#1");
  survey.mode = "edit";
  assert.equal(matrix.renderedTable.isRowsDragAndDrop, true, "#2");
});
QUnit.test("Drag&drop and column visibleIf", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        allowRowsDragAndDrop: true,
        columns: [{ name: "col1", cellType: "text" }, { name: "col2", cellType: "text", visibleIf: "{row.col1}='a'" }]
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.value = [{ col1: "a", col2: "b" }, { col1: "c" }];
  let rows = matrix.visibleRows;
  assert.equal(rows[0].cells[0].question.value, "a", "cell[0,0].value #1");
  assert.equal(rows[0].cells[1].question.value, "b", "cell[0,1].value #1");
  assert.equal(rows[0].cells[1].question.isVisible, true, "cell[0,1].isVisible #1");
  assert.equal(rows[1].cells[0].question.value, "c", "cell[1,0].value #1");
  assert.equal(rows[1].cells[1].question.isVisible, false, "cell[1,1].isVisible #1");

  matrix.moveRowByIndex(1, 0);
  rows = matrix.visibleRows;
  assert.equal(rows[0].cells[0].question.value, "c", "cell[1,0].value #2");
  assert.equal(rows[0].cells[1].question.isVisible, false, "cell[1,1].isVisible #2");
  assert.equal(rows[1].cells[0].question.value, "a", "cell[0,0].value #2");
  assert.equal(rows[1].cells[1].question.value, "b", "cell[0,1].value #2");
  assert.equal(rows[1].cells[1].question.isVisible, true, "cell[0,1].isVisible #2");
  assert.deepEqual(matrix.value, [{ col1: "c" }, { col1: "a", col2: "b" }], "matrix.value #2");
  const renderedRows = matrix.renderedTable.rows;
  assert.equal(renderedRows.length, 4, "There are 4 rendered rows");
  assert.equal(renderedRows[0].cells.length, 4, "There are 4 cells in row");
  assert.equal(renderedRows[0].cells[1].question.value, "c", "rendred.cell[1,0].value #2");
});

QUnit.test("Drag&drop row with dropdown and column visibleIf", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        allowRowsDragAndDrop: true,
        columns: [{ name: "col1", cellType: "dropdown", "choices": ["a", "b", "c"] }, { name: "col2", cellType: "text", visibleIf: "{row.col1}='a'" }]
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  let rows = matrix.visibleRows;
  let row1Col1ListModel = rows[0].cells[0].question.dropdownListModel.listModel;
  let row2Col1ListModel = rows[1].cells[0].question.dropdownListModel.listModel;
  row1Col1ListModel.onItemClick(row1Col1ListModel.actions[0]);
  row2Col1ListModel.onItemClick(row2Col1ListModel.actions[2]);
  rows[0].cells[1].question.value = "b";
  matrix.renderedTable.rows.forEach(row => {
    row.cells.forEach(cell => {
      if (cell.hasQuestion) cell.question?.afterRenderCore({} as any);
    });
  });

  assert.equal(rows[0].cells[0].question.value, "a", "cell[0,0].value #1");
  assert.equal(rows[1].cells[0].question.showSelectedItemLocText, true, "cell[0,0].showSelectedItemLocText #1");
  assert.equal(rows[0].cells[0].question.dropdownListModel.inputString, "", "cell[0,0].dropdownListModel.inputString #1");
  assert.equal(rows[0].cells[0].question.dropdownListModel.showHintString, "", "cell[0,0].dropdownListModel.showHintString #1");
  assert.equal(rows[0].cells[1].question.value, "b", "cell[0,1].value #1");
  assert.equal(rows[0].cells[1].question.isVisible, true, "cell[0,1].isVisible #1");
  assert.equal(rows[1].cells[0].question.value, "c", "cell[1,0].value #1");
  assert.equal(rows[1].cells[1].question.isVisible, false, "cell[1,1].isVisible #1");

  matrix.moveRowByIndex(1, 0);
  rows = matrix.visibleRows;
  assert.equal(rows[0].cells[0].question.value, "c", "cell[1,0].value #2");
  assert.equal(rows[0].cells[1].question.isVisible, false, "cell[1,1].isVisible #2");
  assert.equal(rows[1].cells[0].question.value, "a", "cell[0,0].value #2");
  assert.equal(rows[1].cells[0].question.showSelectedItemLocText, true, "cell[0,0].showSelectedItemLocText #2");
  assert.equal(rows[1].cells[0].question.dropdownListModel.inputString, "", "cell[0,0].dropdownListModel.inputString #2");
  assert.equal(rows[0].cells[0].question.dropdownListModel.showHintString, "", "cell[0,0].dropdownListModel.showHintString #2");
  assert.equal(rows[1].cells[1].question.value, "b", "cell[0,1].value #2");
  assert.equal(rows[1].cells[1].question.isVisible, true, "cell[0,1].isVisible #2");
  assert.deepEqual(matrix.value, [{ col1: "c" }, { col1: "a", col2: "b" }], "matrix.value #2");
  const renderedRows = matrix.renderedTable.rows;
  assert.equal(renderedRows.length, 4, "There are 4 rendered rows");
  assert.equal(renderedRows[0].cells.length, 4, "There are 4 cells in row");
  assert.equal(renderedRows[0].cells[1].question.value, "c", "rendred.cell[1,0].value #2");
});

QUnit.test("QuestionMatrixDropdownRenderedRow isAdditionalClasses", (assert) => {
  const rowClass = "rowClass";
  const detailRowClass = "detailRowClass";
  const rowAdditionalClass = "rowAdditionalClass";

  const renderedRow = new QuestionMatrixDropdownRenderedRow({
    row: rowClass,
    detailRow: detailRowClass,
    rowAdditional: rowAdditionalClass
  });

  let className = renderedRow.className;
  assert.notEqual(className.indexOf(rowClass), -1);
  assert.equal(className.indexOf(detailRowClass), -1);
  assert.equal(className.indexOf(rowAdditionalClass), -1);

  renderedRow.isDetailRow = true;
  renderedRow.isAdditionalClasses = true;
  className = renderedRow.className;
  assert.notEqual(className.indexOf(rowClass), -1);
  assert.notEqual(className.indexOf(detailRowClass), -1);
  assert.notEqual(className.indexOf(rowAdditionalClass), -1);
});
QUnit.test("Column title equals to name", (assert) => {
  const column = new MatrixDropdownColumn("col1");
  assert.notOk(column.locTitle.getLocaleText(""), "Column title is empty # 1");
  assert.equal(column.locTitle.renderedHtml, "col1");
  column.title = "col1";
  assert.equal(column.locTitle.getLocaleText(""), "col1", "Column title is empty # 2");
  assert.equal(column.locTitle.renderedHtml, "col1");
});

QUnit.test("matrix beginUpdate/endUpdate", function (assert) {
  var matrix = new QuestionMatrixDynamicModel("q1");
  matrix.addColumn("col1");
  matrix.addColumn("col2");
  matrix.allowRemoveRows = false;
  matrix.rowCount = 2;
  assert.equal(matrix.renderedTable.headerRow.cells.length, 2, "renderedTable: 2 columns, #1");
  assert.equal(matrix.visibleRows.length, 2, "visibleRows.length, #1");
  assert.equal(matrix.visibleRows[0].cells.length, 2, "visibleRows[0]: 2 columns, #1");

  matrix.beginUpdate();
  matrix.rowCount = 3;
  matrix.addColumn("col3");
  assert.equal(matrix.renderedTable.headerRow.cells.length, 2, "renderedTable: 2 columns, #2 - locUpdate");
  assert.notOk(matrix.visibleRows, "visibleRows.length, #2 - locUpdate");
  matrix.endUpdate();

  assert.equal(matrix.renderedTable.headerRow.cells.length, 3, "renderedTable: 3 columns, #2 - unlock Update");
  assert.equal(matrix.visibleRows.length, 3, "visibleRows.length, #3 - unlock Update");
  assert.equal(matrix.visibleRows[0].cells.length, 3, "visibleRows[0]: 3 columns, #3 - unloc Update");
});
QUnit.test("TextProcessing matrix in panel dynamic, Bug#3491",
  function (assert) {
    const survey = new SurveyModel({
      elements: [
        { type: "text", name: "root_q1", defaultValue: "root_val1" },
        {
          type: "paneldynamic",
          name: "root",
          panelCount: 1,
          templateElements: [
            { type: "text", name: "q1", defaultValue: "panel_val1" },
            {
              type: "matrixdynamic",
              name: "matrix",
              rowCount: 1,
              cellType: "text",
              columns: [{ name: "col1", defaultValue: "col_val1" }]
            }
          ],
        },
      ],
    });
    const matrix: QuestionMatrixDynamicModel = survey.getQuestionByName("root").panels[0].questions[1];
    const row = matrix.visibleRows[0];
    const textProc = row.getTextProcessor();
    assert.equal(textProc.processText("{root_q1}", false), "root_val1", "root_q1");
    assert.equal(textProc.processText("{row.col1}", false), "col_val1", "row.col1");
    assert.equal(textProc.processText("{panel.q1}", false), "panel_val1", "panel.q1");
  });
QUnit.test("Question defaultValueExpression in matrix dynamic", function (
  assert
) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 1,
        columns: [
          { cellType: "text", name: "q1", defaultValue: 1 },
          { cellType: "text", name: "q2", defaultValueExpression: "{row.q1} + 2" },
        ],
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const row = matrix.visibleRows[0];
  const q1 = row.getQuestionByName("q1");
  const q2 = row.getQuestionByName("q2");
  assert.equal(q2.value, 3, "initial value");
  q1.value = 5;
  assert.equal(q2.value, 7, "q1 is changed");
  q2.value = 4;
  assert.equal(q2.value, 4, "changed dirrectly");
  q1.value = 10;
  assert.equal(q2.value, 4, "stop react on defaultValueExpression");
});
QUnit.test("Question defaultValueExpression in matrix dynamic delete/add rows, Bug#5193", function (
  assert
) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [{ cellType: "text", name: "col1" }]
      },
      {
        type: "matrixdynamic",
        name: "q2",
        defaultValueExpression: "{q1}",
        columns: [{ cellType: "text", name: "col1" }]
      }
    ]
  });
  const matrix1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const matrix2 = <QuestionMatrixDynamicModel>survey.getQuestionByName("q2");
  const rows1 = matrix1.visibleRows;
  rows1[0].cells[0].value = "val1";
  rows1[1].cells[0].value = "val2";
  assert.deepEqual(matrix2.value, [{ col1: "val1" }, { col1: "val2" }]);
  matrix2.removeRow(1);
  assert.deepEqual(matrix2.value, [{ col1: "val1" }]);
  matrix2.addRow();
  const rows2 = matrix2.visibleRows;
  rows2[1].cells[0].value = "val2_2";
  assert.deepEqual(matrix2.value, [{ col1: "val1" }, { col1: "val2_2" }]);
});
QUnit.test("call locationChangedCallback for cell question", function (
  assert
) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        columns: [
          { name: "q1" }
        ],
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const row = matrix.visibleRows[1];
  let counter = 0;
  row.cells[0].question.localeChangedCallback = () => { counter++; };
  survey.locale = "de";
  survey.locale = "";
  assert.equal(counter, 2, "locationChangedCallback called");
});
QUnit.test("Restore read-only on setting mode display/edit", function (assert) {
  const json = {
    elements: [
      {
        type: "matrixdynamic",
        name: "question1",
        rowCount: 1,
        columns: [
          {
            name: "Column1",
          },
          {
            name: "Column2",
            readOnly: true
          },
        ],
        cellType: "text",
      },
    ],
  };

  const survey = new SurveyModel(json);
  const question = <QuestionMatrixDynamicModel>(
    survey.getQuestionByName("question1")
  );
  const row = question.visibleRows[0];
  assert.equal(row.cells[0].question.readOnly, false, "It is not read-only cell1 #1");
  assert.equal(row.cells[0].question.isReadOnly, false, "isReadOnly-false cell1 #1");
  assert.equal(row.cells[1].question.readOnly, true, "It is read-only cell2 #1");
  assert.equal(row.cells[1].question.isReadOnly, true, "isReadOnly-true cell2 #1");
  survey.mode = "display";
  assert.equal(row.cells[0].question.readOnly, false, "It is not read-only cell1 #2");
  assert.equal(row.cells[0].question.isReadOnly, true, "isReadOnly-true cell1 #2");
  assert.equal(row.cells[1].question.readOnly, true, "It is read-only cell2 #2");
  assert.equal(row.cells[1].question.isReadOnly, true, "isReadOnly-true cell2 #2");
  survey.mode = "edit";
  assert.equal(row.cells[0].question.readOnly, false, "It is not read-only cell1 #3");
  assert.equal(row.cells[0].question.isReadOnly, false, "isReadOnly-false cell1 #3");
  assert.equal(row.cells[1].question.readOnly, true, "It is read-only cell2 #3");
  assert.equal(row.cells[1].question.isReadOnly, true, "isReadOnly-true cell2 #3");
});
QUnit.test("getTitle", function (assert) {
  const survey = new SurveyModel({
    pages: [
      {
        elements: [
          {
            type: "matrixdynamic", name: "q1",
            rowCount: 1,
            columns: [
              { name: "col1", cellType: "text", cellHint: "true hint" },
              { name: "col2", cellType: "text" },
              { name: "col3", cellType: "text", cellHint: " " }
            ]
          }]
      }
    ]
  });
  const question = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  var renderedTable = question.renderedTable;
  const rendredRow = renderedTable.rows[1];
  assert.equal(rendredRow.cells[0].getTitle(), "true hint", "cell0, #1");
  assert.equal(rendredRow.cells[1].getTitle(), "col2", "cell1, #1");
  assert.equal(rendredRow.cells[2].getTitle(), "", "cell2, #1");
  const row = question.visibleRows[0];
  row.cells[0].question.title = "Custom title 1";
  row.cells[1].question.title = "Custom title 2";
  row.cells[2].question.title = "Custom title 3";
  assert.equal(rendredRow.cells[0].getTitle(), "true hint", "cell0, #2");
  assert.equal(rendredRow.cells[1].getTitle(), "Custom title 2", "cell1, #2");
  assert.equal(rendredRow.cells[2].getTitle(), "", "cell2, #2");
});
QUnit.test("matrixdropdowncolumn renderAs property", function (assert) {
  const survey = new SurveyModel({
    pages: [
      {
        elements: [
          {
            type: "matrixdynamic", name: "q1",
            columns: [
              { name: "col1", cellType: "dropdown" },
            ]
          }]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  matrix.columns[0].renderAs = "myRender";
  assert.equal(matrix.columns[0].templateQuestion.renderAs, "myRender", "Apply render as to template question");
});
QUnit.test("Summary doesn't work correctly if there is invisible column and clearInvisibleValues: 'onHiddenContainer'", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "text",
            inputType: "number",
          },
          {
            name: "col2",
            cellType: "text",
            totalType: "sum",
            inputType: "number",
          },
          {
            name: "col_sum",
            cellType: "expression",
            totalType: "sum",
            expression: "{row.col1}+{row.col2}",
          },
          {
            name: "col3",
            cellType: "boolean",
            visibleIf: "false",
          },
        ],
        rows: ["row1", "row2"],
      },
    ],
    clearInvisibleValues: "onHiddenContainer"
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  const rows = matrix.visibleRows;
  assert.equal(rows.length, 2, "two rows");
  assert.equal(rows[0].cells.length, 4, "row[0].cells.length = 4");
  assert.equal(rows[1].cells.length, 4, "row[1].cells.length = 4");
  matrix.visibleRows[0].cells[0].question.value = 1;
  matrix.visibleRows[0].cells[1].question.value = 2;
  matrix.visibleRows[1].cells[0].question.value = 3;
  matrix.visibleRows[1].cells[1].question.value = 4;
  assert.equal(matrix.visibleTotalRow.cells.length, 4, "There are 4 cells");
  assert.equal(matrix.visibleTotalRow.cells[2].value, 1 + 2 + 3 + 4, "summary calculated correctly");
});
QUnit.test("Set empty string to expression with empty total type", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "text",
        name: "col1",
      },
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 1,
        columns: [
          {
            name: "col1",
            cellType: "text"
          },
          {
            name: "col2",
            cellType: "text",
            totalType: "sum"
          },
        ]
      },
    ]
  });
  const q = survey.getQuestionByName("col1");
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  q.value = "1";
  assert.notOk(matrix.visibleTotalRow.cells[0].value, "summary for first column is empty");
  assert.deepEqual(survey.data, { col1: "1", "matrix-total": { col2: 0 } }, "matrix is empty");
});
QUnit.test("Get choices from matrix for default column type", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix1",
        rowCount: 1,
        columns: [
          {
            name: "col1",
            choices: [1, 2]
          }
        ],
        choices: ["item1", "item2", "item3"]
      },
      {
        type: "matrixdynamic",
        name: "matrix2",
        rowCount: 1,
        columns: [
          {
            name: "col1",
            cellType: "dropdown",
            choices: [1, 2]
          }
        ]
      }
    ]
  });
  const matrix1 = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  const cellQuestion1 = <QuestionDropdownModel>matrix1.visibleRows[0].cells[0].question;
  assert.equal(matrix1.columns[0].cellType, "dropdown", "Set correct celltype");
  assert.equal(cellQuestion1.getType(), "dropdown", "Set correct question type");
  assert.equal(cellQuestion1.choices.length, 2, "Take choices from column choices");
  assert.equal(cellQuestion1.choices[0].value, 1, "First choice is correct");
  const matrix2 = <QuestionMatrixDynamicModel>survey.getAllQuestions()[1];
  const cellQuestion2 = <QuestionDropdownModel>matrix2.visibleRows[0].cells[0].question;
  assert.equal(cellQuestion2.choices.length, 2, "Take choices from matrix choices, #2");
  assert.equal(cellQuestion2.choices[0].value, 1, "First choice is correct, #2");
});
QUnit.test("Serialize default column type correctly", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix1",
        cellType: "rating",
        columns: [
          {
            name: "col1",
            cellType: "rating",
            rateMax: 10
          }
        ],
      },
      {
        type: "matrixdynamic",
        name: "matrix2",
        columns: [
          {
            name: "col1",
            cellType: "dropdown",
            choices: [1, 2]
          }
        ]
      }
    ]
  });

  const matrix1 = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  assert.equal(matrix1.columns[0].rateMax, 10, "rateMax loaded correctly");
  matrix1.columns[0].cellType = "default";
  assert.deepEqual(matrix1.toJSON(), {
    name: "matrix1",
    cellType: "rating",
    columns: [{ name: "col1" }]
  }, "There is no rateMax");
  const matrix2 = <QuestionMatrixDynamicModel>survey.getAllQuestions()[1];
  assert.equal(matrix2.columns[0].choices.length, 2, "choices loaded correctly");
  matrix2.columns[0].cellType = "default";
  assert.deepEqual(matrix2.toJSON(), {
    name: "matrix2",
    columns: [{ name: "col1" }]
  }, "There is no choices");
});
QUnit.test("Test property hideIfRowsEmpty for matrix dropdown", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p1");
  var question = new QuestionMatrixDropdownModel("q1");
  page.addQuestion(question);
  assert.equal(question.isVisible, true, "By default it is visible");
  question.hideIfRowsEmpty = true;
  assert.equal(question.isVisible, false, "Rows are empty");
  question.rows = [1, 2, 3];
  assert.equal(question.isVisible, true, "Rows are not empty");
  question.rowsVisibleIf = "{item} = {val1}";
  assert.equal(question.isVisible, false, "Filtered rows are empty");
  survey.setValue("val1", 2);
  assert.equal(question.isVisible, true, "There is one visible item");
});
QUnit.test("Test property hideIfRowsEmpty for matrix dropdown on loading, Bug#8824", function (assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "matrixdropdown", name: "matrix", rowsVisibleIf: "{q1} != 'a'",
        columns: [{ name: "col1", cellType: "text" }],
        rows: ["row1", "row2"], hideIfRowsEmpty: true
      }
    ]
  });
  const matrix = survey.getQuestionByName("matrix");
  assert.equal(matrix.getPropertyValue("isVisible"), true, "#1");
  survey.setValue("q1", "a");
  assert.equal(matrix.getPropertyValue("isVisible"), false, "#2");
  survey.setValue("q1", "aa");
  assert.equal(matrix.getPropertyValue("isVisible"), true, "#3");
});

QUnit.test("Load old JSON where columns without cellType set correctly", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 1,
        columns: [
          {
            name: "col1",
            choices: ["a", "b", "c", "d"]
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const colQuestion = matrix.columns[0].templateQuestion;
  assert.equal(colQuestion.getType(), "dropdown", "template is dropdown");
  assert.deepEqual(colQuestion.choices.length, 4, "template has 4 choices");
  assert.equal(colQuestion.choices[2].value, "c", "template has correct choices");
  const rows = matrix.visibleRows;
  const cellQuestion = rows[0].cells[0].question;
  assert.equal(cellQuestion.getType(), "dropdown", "update the cell type");
  assert.deepEqual(cellQuestion.choices.length, 4, "load 4 choices");
  assert.equal(cellQuestion.choices[2].value, "c", "load choices correctly");
});
QUnit.test("Vertical column layout & allowRowReorder, rendered table", function (assert) {
  var survey = new SurveyModel({
    "elements": [
      {
        "type": "matrixdynamic",
        "name": "matrix",
        "allowRowReorder": true,
        "columnLayout": "vertical",
        columns: [
          { cellType: "text", name: "col1" },
          { cellType: "text", name: "col2" },
        ],
        "rowCount": 2
      }
    ]
  });
  var matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.renderedTable.isRowsDragAndDrop, false, "vertical column layout");
  matrix.columnLayout = "horizontal";
  assert.equal(matrix.renderedTable.isRowsDragAndDrop, true, "horizontal column layout");
  matrix.onPointerDown(<any>undefined, <any>undefined);
});

QUnit.test("Update expressions on setting matrixdropdown rows, Bug#5526", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "matrixdropdown",
        "name": "matrix",
        columns: [
          { cellType: "text", name: "col1", totalType: "sum" },
          { cellType: "text", name: "col2" },
          { cellType: "expression", name: "col3", expression: "{row.col1} + {row.col2}", totalType: "sum" },
        ],
        rows: ["row1", "row2"]
      }
    ]
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  const rows = matrix.visibleRows;
  assert.equal(2, rows.length, "2 rows");
  rows[0].cells[0].value = 1;
  rows[0].cells[1].value = 2;
  rows[1].cells[0].value = 3;
  rows[1].cells[1].value = 4;
  assert.deepEqual(survey.data, {
    matrix: {
      row1: { col1: 1, col2: 2, col3: 3, },
      row2: { col1: 3, col2: 4, col3: 7 }
    },
    "matrix-total": { col1: 4, col3: 10 }
  }, "#1");
  matrix.rows = ["row1"];
  assert.deepEqual(survey.data, {
    matrix: { row1: { col1: 1, col2: 2, col3: 3, } },
    "matrix-total": { col1: 1, col3: 3 }
  }, "#2");
});

QUnit.test("Carry forward in matrix cells", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "matrixdynamic",
        "name": "matrix",
        columns: [
          { cellType: "checkbox", name: "col1", choices: [1, 2, 3, 4, 5] },
          { cellType: "dropdown", name: "col2", choicesFromQuestion: "row.col1", choicesFromQuestionMode: "selected" }
        ],
        rowCount: 1
      }
    ]
  });
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  const rows = matrix.visibleRows;
  const cellQ1 = rows[0].cells[0].question;
  const cellQ2 = <QuestionDropdownModel>rows[0].cells[1].question;
  assert.equal("col1", cellQ1.name, "col1 question is correct");
  assert.equal("col2", cellQ2.name, "col2 question is correct");
  assert.equal(cellQ2.choicesFromQuestion, "row.col1", "choicesFromQuestion is loaded");
  assert.equal(cellQ2.choicesFromQuestionMode, "selected", "choicesFromQuestionMode is loaded");
  assert.equal(cellQ2.visibleChoices.length, 0, "There is no visible choices");
  cellQ1.value = [1, 3, 5];
  assert.equal(cellQ2.visibleChoices.length, 3, "Choices are here");
  assert.equal(cellQ2.visibleChoices[1].value, 3, "A choice value is correct");
});
QUnit.test("Doesn't update value correctly for nested matrix with expressions, bug#5549", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "text",
            isRequired: true,
            inputType: "number",
          },
          {
            name: "col2",
            cellType: "expression",
            expression: "{row.col1} + 10"
          }
        ],
        rowCount: 1,
      }
    ]
  });
  let questionValue;
  survey.onValueChanged.add((sender, options) => {
    questionValue = options.value;
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const cell = matrix.visibleRows[0].cells[0].question;
  cell.value = 10;
  assert.deepEqual(matrix.value, [{ col1: 10, col2: 20 }], "matrix question value");
  assert.deepEqual(matrix.value, [{ col1: 10, col2: 20 }], "event options.value");
  assert.deepEqual(survey.data, { matrix: [{ col1: 10, col2: 20 }] }, "survey.data");
});
QUnit.test("Do not run total expressions if matrix is read-only, bug#5644", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "text",
        name: "q1",
        defaultValue: 1
      },
      {
        type: "text",
        name: "q2",
        defaultValue: 2
      },
      {
        type: "matrixdynamic",
        name: "matrix",
        readOnly: true,
        columns: [
          {
            name: "col1",
            cellType: "text",
            inputType: "number",
            defaultValue: 1,
            totalExpression: "{q1} + {q2}"
          },
          {
            name: "col2",
            cellType: "expression",
            expression: "{row.col1} + 10"
          }
        ],
        rowCount: 1,
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const expQuestion = matrix.visibleRows[0].cells[1].question;
  const totalQuestion = matrix.visibleTotalRow.cells[0].question;
  assert.equal(expQuestion.isReadOnly, true, "Expression question is readOnly");
  assert.equal(expQuestion.isEmpty(), true, "Expression question is empty");
  assert.equal(totalQuestion.isReadOnly, false, "Total Expression question is readOnly");
  assert.equal(totalQuestion.isEmpty(), false, "Total Expression question is empty");
  assert.deepEqual(survey.data, {
    q1: 1, q2: 2, "matrix-total": { col1: 3 },
    "matrix": [{ "col1": 1 }]
  }, "Data set in survey correctly.");
});
QUnit.test("Check rightIndents set correctly for detailElements with defaultV2 theme - 5988", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        detailPanelShowOnAdding: true,
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }, { type: "text", name: "q2", startWithNewLine: false, visibleIf: "{row.q1} notempty" }],
      },
    ],
  });
  survey.css = { root: "sd-root-modern" };
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.visibleRows[0].showHideDetailPanelClick();
  assert.equal(matrix.renderedTable.rows[2].cells[1].panel.elements[0].rightIndent, 0);
  survey.css.root = undefined;
});

QUnit.test("matrixDragHandleArea = 'icon'", function (assert) {
  const survey = new SurveyModel({
    matrixDragHandleArea: "icon",
    elements: [
      {
        type: "matrixdynamic",
        allowRowsDragAndDrop: "true",
        name: "matrix",
        rowCount: 2,
        detailPanelMode: "underRow",
        detailPanelShowOnAdding: true,
        columns: [{ name: "col1" }, { name: "col2" }, { name: "col3" }],
        detailElements: [{ type: "text", name: "q1" }, { type: "text", name: "q2", startWithNewLine: false, visibleIf: "{row.q1} notempty" }],
      },
    ],
  });
  survey.css = { root: "sd-root-modern" };
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  let nodeMock = document.createElement("div");
  assert.equal(matrix.isDragHandleAreaValid(nodeMock), false);

  nodeMock.classList.add("some-class");
  assert.equal(matrix.isDragHandleAreaValid(nodeMock), false);

  nodeMock.classList.add(matrix.cssClasses.dragElementDecorator);
  assert.equal(matrix.isDragHandleAreaValid(nodeMock), true);

  survey.matrixDragHandleArea = "entireItem";

  nodeMock.classList.remove(matrix.cssClasses.dragElementDecorator);
  assert.equal(matrix.isDragHandleAreaValid(nodeMock), true);

  nodeMock.remove();
  survey.css.root = undefined;
});
QUnit.test("column validation, bug#6449", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        "type": "text",
        "name": "age"
      },
      {
        "type": "matrixdropdown",
        "name": "matrix",
        "columns": [
          {
            "name": "col1",
            "cellType": "text",
            "validators": [
              {
                "type": "expression",
                "expression": "{row.col1} < {age}"
              }
            ]
          }
        ],
        "rows": ["Row1"]
      }]
  });
  survey.setValue("age", 50);
  const matrix = <QuestionMatrixDropdownModel>survey.getQuestionByName("matrix");
  const cellQuestion = matrix.visibleRows[0].cells[0].question;
  assert.equal(cellQuestion.name, "col1", "question is correct");
  cellQuestion.value = 51;
  assert.equal(survey.hasErrors(), true, "51<50");
  cellQuestion.value = 41;
  assert.equal(survey.hasErrors(), false, "41<50");
});
QUnit.test("matrixDynamic & defaultValueExpression", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix", rowCount: 1,
        columns: [{ name: "col1", cellType: "text", defaultValueExpression: "1 + 1" }, { name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 1, "one row");
  assert.deepEqual(q.value, [{ col1: 2 }], "matrix.data");
  assert.deepEqual(survey.data, { matrix: [{ col1: 2 }] }, "survey.data");
});

QUnit.test("Errors: matrixdropdown", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown", name: "matrix",
        rows: ["Row1", "Row2"],
        choices: ["Item1"],
        columns: [{ name: "col1", isRequired: true }, { name: "col2", isRequired: true }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 2, "two rows");
  const table = q.renderedTable;
  assert.equal(table.rows.length, 4, "2 rows + 2 error rows");

  assert.equal(table.rows[0].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow, false);
  assert.equal(table.rows[2].isErrorsRow, true);
  assert.equal(table.rows[3].isErrorsRow, false);

  assert.equal(table.rows[0].visible, false);
  assert.equal(table.rows[0].cells.length, 3);
  assert.equal(table.rows[0].cells[0].isEmpty, true);
  assert.equal(table.rows[0].cells[1].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[1].question, table.rows[1].cells[1].question);
  assert.equal(table.rows[0].cells[2].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[2].question, table.rows[1].cells[2].question);

  survey.tryComplete();
  assert.equal(table.rows[0].visible, true);
  assert.equal(table.rows[2].visible, true);
  table.rows[1].cells[1].question.value = "Item1";
  assert.equal(table.rows[0].visible, true);
  assert.equal(table.rows[2].visible, true);
  table.rows[1].cells[2].question.value = "Item1";
  assert.equal(table.rows[0].visible, false);
  assert.equal(table.rows[2].visible, true);
  table.rows[3].cells[1].question.value = "Item1";
  assert.equal(table.rows[0].visible, false);
  assert.equal(table.rows[2].visible, true);
  table.rows[3].cells[2].question.value = "Item1";
  assert.equal(table.rows[0].visible, false);
  assert.equal(table.rows[2].visible, false);
});

QUnit.test("Errors: matrixdynamic", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix",
        rowCount: 3,
        columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 3, "3 rows");
  const table = q.renderedTable;
  assert.equal(table.rows.length, 6, "3 rows + 3 error rows");

  assert.equal(table.rows[0].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow, false);
  assert.equal(table.rows[2].isErrorsRow, true);
  assert.equal(table.rows[3].isErrorsRow, false);
  assert.equal(table.rows[4].isErrorsRow, true);
  assert.equal(table.rows[5].isErrorsRow, false);

  assert.equal(table.rows[0].cells.length, 3);
  assert.equal(table.rows[0].cells[0].isErrorsCell, true);
  assert.equal(table.rows[0].cells[1].isErrorsCell, true);
  assert.equal(table.rows[0].cells[2].isEmpty, true);

  const rowId0 = table.rows[1].id;
  const rowId2 = table.rows[5].id;

  q.removeRow(1);
  assert.equal(table.rows.length, 4, "2 rows + 2 error rows");

  assert.equal(table.rows[1].id, rowId0);
  assert.equal(table.rows[3].id, rowId2);

  assert.equal(table.rows[0].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[0].question, table.rows[1].cells[0].question);
  assert.equal(table.rows[2].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[2].cells[0].question, table.rows[3].cells[0].question);

  q.addRow();
  assert.equal(table.rows.length, 6, "3 rows + 3 error rows");

  assert.equal(table.rows[1].id, rowId0);
  assert.equal(table.rows[3].id, rowId2);

  assert.equal(table.rows[0].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[0].question, table.rows[1].cells[0].question);
  assert.equal(table.rows[2].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[2].cells[0].question, table.rows[3].cells[0].question);

  assert.strictEqual(table.rows[5].row, q.visibleRows[2]);
  assert.equal(table.rows[4].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[4].cells[0].question, table.rows[5].cells[0].question);
});

QUnit.test("Errors: matrixdynamic + errors location bottom", function (assert) {
  const survey = new SurveyModel({
    questionErrorLocation: "bottom",
    elements: [
      {
        type: "matrixdynamic", name: "matrix",
        rowCount: 3,
        columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 3, "3 rows");
  const table = q.renderedTable;
  assert.equal(table.rows.length, 6, "3 rows + 3 error rows");

  assert.equal(table.rows[0].isErrorsRow, false);
  assert.equal(table.rows[1].isErrorsRow, true);
  assert.equal(table.rows[2].isErrorsRow, false);
  assert.equal(table.rows[3].isErrorsRow, true);
  assert.equal(table.rows[4].isErrorsRow, false);
  assert.equal(table.rows[5].isErrorsRow, true);

  assert.equal(table.rows[1].cells.length, 3);
  assert.equal(table.rows[1].cells[0].isErrorsCell, true);
  assert.equal(table.rows[1].cells[1].isErrorsCell, true);
  assert.equal(table.rows[1].cells[2].isEmpty, true);

  const rowId0 = table.rows[0].id;
  const rowId2 = table.rows[4].id;

  q.removeRow(1);
  assert.equal(table.rows.length, 4, "2 rows + 2 error rows");

  assert.equal(table.rows[0].id, rowId0);
  assert.equal(table.rows[2].id, rowId2);

  assert.equal(table.rows[1].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[1].cells[0].question, table.rows[0].cells[0].question);
  assert.equal(table.rows[3].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[3].cells[0].question, table.rows[2].cells[0].question);

  q.addRow();
  assert.equal(table.rows.length, 6, "3 rows + 3 error rows");

  assert.equal(table.rows[0].id, rowId0);
  assert.equal(table.rows[2].id, rowId2);

  assert.equal(table.rows[1].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[1].cells[0].question, table.rows[0].cells[0].question);
  assert.equal(table.rows[3].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[3].cells[0].question, table.rows[2].cells[0].question);

  assert.strictEqual(table.rows[4].row, q.visibleRows[2]);
  assert.equal(table.rows[5].cells[0].isErrorsCell, true);
  assert.strictEqual(table.rows[5].cells[0].question, table.rows[4].cells[0].question);
});

QUnit.test("Errors: matrixdynamic + showDetailPanel", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix",
        rowCount: 3,
        detailPanelMode: "underRow",
        detailElements: [{ type: "text", name: "q1" }],
        columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 3, "3 rows");
  const table = q.renderedTable;
  q.visibleRows[1].showDetailPanel();
  assert.equal(table.rows.length, 7, "3 rows + 3 error rows + detail panel");

  assert.equal(table.rows[0].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow || table.rows[1].isDetailRow, false);
  assert.equal(table.rows[2].isErrorsRow, true);
  assert.equal(table.rows[3].isErrorsRow || table.rows[3].isDetailRow, false);
  assert.equal(table.rows[4].isDetailRow, true);
  assert.equal(table.rows[5].isErrorsRow, true);
  assert.equal(table.rows[6].isErrorsRow || table.rows[6].isDetailRow, false);

  q.visibleRows[1].hideDetailPanel();

  assert.equal(table.rows.length, 6, "3 rows + 3 error rows");

  assert.equal(table.rows[0].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow || table.rows[1].isDetailRow, false);
  assert.equal(table.rows[2].isErrorsRow, true);
  assert.equal(table.rows[3].isErrorsRow || table.rows[3].isDetailRow, false);
  assert.equal(table.rows[4].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow || table.rows[1].isDetailRow, false);

  q.visibleRows[1].showDetailPanel();

  const rowId0 = table.rows[1].id;
  const rowId2 = table.rows[5].id;

  q.removeRow(1);
  assert.equal(table.rows.length, 4, "2 rows + 2 error rows");

  assert.equal(table.rows[1].id, rowId0);
  assert.equal(table.rows[2].id, rowId2);

  assert.equal(table.rows[0].cells[1].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[1].question, table.rows[1].cells[1].question);
  assert.equal(table.rows[2].cells[1].isErrorsCell, true);
  assert.strictEqual(table.rows[2].cells[1].question, table.rows[3].cells[1].question);
});

QUnit.test("Errors: matrixdynamic + showDetailPanel + errors bottom", function (assert) {
  const survey = new SurveyModel({
    questionErrorLocation: "bottom",
    elements: [
      {
        type: "matrixdynamic", name: "matrix",
        rowCount: 3,
        detailPanelMode: "underRow",
        detailElements: [{ type: "text", name: "q1" }],
        columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 3, "3 rows");
  const table = q.renderedTable;
  q.visibleRows[1].showDetailPanel();
  assert.equal(table.rows.length, 7, "3 rows + 3 error rows + detail panel");

  assert.equal(table.rows[0].isErrorsRow || table.rows[0].isDetailRow, false);
  assert.equal(table.rows[1].isErrorsRow, true);
  assert.equal(table.rows[2].isErrorsRow || table.rows[2].isDetailRow, false);
  assert.equal(table.rows[3].isErrorsRow, true);
  assert.equal(table.rows[4].isDetailRow, true);
  assert.equal(table.rows[5].isErrorsRow || table.rows[5].isDetailRow, false);
  assert.equal(table.rows[6].isErrorsRow, true);

  q.visibleRows[1].hideDetailPanel();

  assert.equal(table.rows.length, 6, "3 rows + 3 error rows");

  assert.equal(table.rows[0].isErrorsRow || table.rows[0].isDetailRow, false);
  assert.equal(table.rows[1].isErrorsRow, true);
  assert.equal(table.rows[2].isErrorsRow || table.rows[2].isDetailRow, false);
  assert.equal(table.rows[3].isErrorsRow, true);
  assert.equal(table.rows[4].isErrorsRow || table.rows[4].isDetailRow, false);
  assert.equal(table.rows[5].isErrorsRow, true);

  q.visibleRows[1].showDetailPanel();

  const rowId0 = table.rows[0].id;
  const rowId2 = table.rows[5].id;

  q.removeRow(1);
  assert.equal(table.rows.length, 4, "2 rows + 2 error rows");

  assert.equal(table.rows[0].id, rowId0);
  assert.equal(table.rows[2].id, rowId2);

  assert.equal(table.rows[1].cells[1].isErrorsCell, true);
  assert.strictEqual(table.rows[1].cells[1].question, table.rows[0].cells[1].question);
  assert.equal(table.rows[3].cells[1].isErrorsCell, true);
  assert.strictEqual(table.rows[3].cells[1].question, table.rows[2].cells[1].question);
});

QUnit.test("Errors: matrixdynamic + vertical columns", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 3,
        columnLayout: "vertical",
        columns: [{ name: "col1" }, { name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 3, "3 rows");
  const table = q.renderedTable;
  assert.equal(table.rows.length, 5, "2 rows + 2 error rows + actions");

  assert.equal(table.rows[0].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow, false);
  assert.equal(table.rows[2].isErrorsRow, true);
  assert.equal(table.rows[3].isErrorsRow, false);

  assert.equal(table.rows[0].cells.length, 4);
  assert.equal(table.rows[0].cells[0].isEmpty, true);
  assert.equal(table.rows[0].cells[1].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[1].question, table.rows[1].cells[1].question);
  assert.equal(table.rows[0].cells[2].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[2].question, table.rows[1].cells[2].question);
  assert.equal(table.rows[0].cells[3].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[3].question, table.rows[1].cells[3].question);
});

QUnit.test("Errors: matrixdropdown + show in multiple columns", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        rows: ["row1"],
        columns: [
          {
            name: "col1",
            cellType: "radiogroup",
            showInMultipleColumns: true,
            choices: ["Item1", "Item2"]
          },
          {
            name: "col2"
          }
        ]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 1, "3 rows");
  const table = q.renderedTable;
  assert.equal(table.rows.length, 2, "1 row + error row");

  assert.equal(table.rows[0].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow, false);

  assert.equal(table.rows[0].cells.length, 4);
  assert.equal(table.rows[0].cells[0].isEmpty, true);
  assert.equal(table.rows[0].cells[1].isErrorsCell, true, "error only for first choice");
  assert.strictEqual(table.rows[0].cells[1].question, table.rows[1].cells[1].question);
  assert.equal(table.rows[0].cells[2].isEmpty, true, "there is no error for second choice");
  assert.equal(table.rows[0].cells[3].isErrorsCell, true);
  assert.strictEqual(table.rows[0].cells[3].question, table.rows[1].cells[3].question);
});

QUnit.test("Errors: matrixdynamic + show in multiple columns + vertical layout", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        rows: ["row1"],
        columnLayout: "vertical",
        columns: [
          {
            name: "col1",
            cellType: "radiogroup",
            showInMultipleColumns: true,
            choices: ["Item1", "Item2"]
          },
          {
            name: "col2"
          }
        ]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.visibleRows.length, 1, "3 rows");
  const table = q.renderedTable;
  assert.equal(table.rows.length, 6, "1 row + error row");

  assert.equal(table.rows[0].isErrorsRow, true);
  assert.equal(table.rows[1].isErrorsRow, false);
  assert.equal(table.rows[2].isErrorsRow, true);
  assert.equal(table.rows[3].isErrorsRow, false);
  assert.equal(table.rows[4].isErrorsRow, true);
  assert.equal(table.rows[5].isErrorsRow, false);

  assert.equal(table.rows[0].cells.length, 2);
  assert.equal(table.rows[0].cells[0].isEmpty, true);
  assert.equal(table.rows[0].cells[1].isErrorsCell, true, "error only for first choice");
  assert.strictEqual(table.rows[0].cells[1].question, table.rows[1].cells[1].question);

  assert.equal(table.rows[2].cells.length, 2);
  assert.equal(table.rows[2].cells[0].isEmpty, true);
  assert.equal(table.rows[2].cells[1].isEmpty, true, "there is not error for second choice");

  assert.equal(table.rows[4].cells.length, 2);
  assert.equal(table.rows[4].cells[0].isEmpty, true);
  assert.equal(table.rows[4].cells[1].isErrorsCell, true, "error for col2");
  assert.strictEqual(table.rows[4].cells[1].question, table.rows[5].cells[1].question);
});

QUnit.test("transposeData property", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        rows: ["row1"],
        columnLayout: "vertical",
        columns: [
          {
            name: "col1",
          }
        ]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.transposeData, true, "transposeData #1");
  q.columnLayout = "horizontal";
  assert.equal(q.transposeData, false, "transposeData #2");
  q.transposeData = true;
  assert.equal(q.columnLayout, "vertical", "columnsLayout #1");
  assert.equal(q.isColumnLayoutHorizontal, false, "isColumnLayoutHorizontal #1");
  q.transposeData = false;
  assert.equal(q.columnLayout, "horizontal", "columnsLayout #2");
  assert.equal(q.isColumnLayoutHorizontal, true, "isColumnLayoutHorizontal #2");
  q.transposeData = true;
  const json1 = q.toJSON();
  const json2 = q.toJSON({ version: "1.9.129" });
  assert.equal(json1.transposeData, true, "json #1");
  assert.notOk(json1.columnLayout, "json #2");
  assert.notOk(json2.transposeData, "json #3");
  assert.equal(json2.columnLayout, "vertical", "json #4");
});

QUnit.test("transposeData property load from json", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown",
        name: "matrix",
        rows: ["row1"],
        transposeData: true,
        columns: [
          {
            name: "col1",
          }
        ]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(q.transposeData, true, "transposeData #1");
  assert.equal(q.columnLayout, "vertical", "columnsLayout #1");
});

QUnit.test("Errors: matrixdropdown + mobile mode", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdropdown", name: "matrix",
        rows: ["Row1", "Row2"],
        choices: ["Item1"],
        columns: [{ name: "col1", isRequired: true }, { name: "col2", isRequired: true }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  q.isMobile = true;
  assert.equal(q.visibleRows.length, 2, "two rows");
  const table = q.renderedTable;
  assert.equal(table.rows.length, 2, "2 rows");

  assert.equal(table.rows[0].isErrorsRow, false);
  assert.equal(table.rows[1].isErrorsRow, false);

  assert.equal(table.rows[0].visible, true);
  assert.equal(table.rows[0].cells.length, 5, "header + 2 columns + 2 errors");
  assert.equal(table.rows[0].cells[0].hasTitle, true);
  assert.equal(table.rows[0].cells[1].isErrorsCell, true);
  assert.equal(table.rows[0].cells[2].hasQuestion, true);
  assert.equal(table.rows[0].cells[3].isErrorsCell, true);
  assert.equal(table.rows[0].cells[4].hasQuestion, true);
});
QUnit.test("matrixdynamic.removeRow & confirmActionAsync, #6736", function (assert) {
  const prevAsync = settings.confirmActionAsync;

  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix",
        columns: [{ name: "col1" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  q.value = [{ col1: 1 }, { col1: 2 }, { col1: 3 }];
  let f_resFunc = (res: boolean): void => { };
  settings.confirmActionAsync = (message: string, resFunc: (res: boolean) => void): boolean => {
    f_resFunc = resFunc;
    return true;
  };
  q.removeRow(1, true);
  assert.equal(q.visibleRows.length, 3, "We are waiting for async function");
  f_resFunc(false);
  assert.equal(q.visibleRows.length, 3, "confirm action return false");
  q.removeRow(1, true);
  assert.equal(q.visibleRows.length, 3, "We are waiting for async function, #2");
  f_resFunc(true);
  assert.equal(q.visibleRows.length, 2, "confirm action return true");
  assert.deepEqual(q.value, [{ col1: 1 }, { col1: 3 }], "Row is deleted correctly");

  settings.confirmActionAsync = prevAsync;
});
QUnit.test("matrix dynamic getPlainData", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix",
        columns: [{ cellType: "text", name: "col1" }, { cellType: "text", name: "col2" }]
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  q.value = [{ col1: 1, col2: 2 }, { col1: 3, col2: 4 }];
  const data: any = survey.getPlainData();//["matrix"];
  const row1Name = data[0].data[0].name;
  const row1Title = data[0].data[0].title;
  const row2Name = data[0].data[1].name;
  const row2Title = data[0].data[1].title;
  assert.equal(row1Name, "row1", "row1 name");
  assert.equal(row1Title, "row 1", "row1 title");
  assert.equal(row2Name, "row2", "row2 name");
  assert.equal(row2Title, "row 2", "row2 title");
});
QUnit.test("matrix dynamic getPlainData & comment", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic", name: "matrix",
        columns: [{ cellType: "text", name: "col1" }, { cellType: "text", name: "col2" }],
        showCommentArea: true
      }
    ]
  });
  const q = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  q.value = [{ col1: 1, col2: 2 }, { col1: 3, col2: 4 }];
  q.comment = "Some comments";
  const data: any = survey.getPlainData();//["matrix"];
  const qData = data[0].data;
  assert.equal(qData.length, 3, "There are 3 records");
  const row1Name = qData[0].name;
  const row1Title = qData[0].title;
  const row2Name = qData[1].name;
  const row2Title = qData[1].title;
  assert.equal(row1Name, "row1", "row1 name");
  assert.equal(row1Title, "row 1", "row1 title");
  assert.equal(row2Name, "row2", "row2 name");
  assert.equal(row2Title, "row 2", "row2 title");
  assert.equal(qData[2].title, "Comment", "comment title");
  assert.equal(qData[2].isComment, true, "comment isComment");
});
QUnit.test("matrix dynamic expression & checkbox ValuePropertyName", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "checkbox",
        "name": "q1",
        "choices": [
          "Item 1",
          "Item 2"
        ],
        "valuePropertyName": "testItem"
      },
      {
        "type": "matrixdynamic",
        "name": "q2",
        "valueName": "q1",
        "columns": [
          {
            "name": "col1",
            "cellType": "expression",
            "expression": "{row.testItem} + ' - matrix'"
          }
        ],
        "rowCount": 0
      }
    ]
  });
  const checkbox = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q2");
  assert.equal(matrix.visibleRows.length, 0, "matrix rows #0");
  assert.notOk(matrix.value, "matrix is empty");
  checkbox.renderedValue = ["Item 1"];
  assert.equal(matrix.visibleRows.length, 1, "matrix rows #1");
  assert.deepEqual(matrix.value, [{ testItem: "Item 1", col1: "Item 1 - matrix" }], "matrix value #1");
  checkbox.renderedValue = ["Item 1", "Item 2"];
  assert.equal(matrix.visibleRows.length, 2, "matrix rows #2");
  assert.deepEqual(matrix.value, [{ testItem: "Item 1", col1: "Item 1 - matrix" }, { testItem: "Item 2", col1: "Item 2 - matrix" }], "matrix value #2");
});
QUnit.test("matrix dynamic expression & checkbox valuePropertyName & sumInArray function", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "checkbox",
        "name": "q1",
        "choices": [
          "Item 1",
          "Item 2"
        ],
        "valuePropertyName": "testItem"
      },
      {
        "type": "matrixdynamic",
        "name": "q2",
        "valueName": "q1",
        "columns": [
          {
            "name": "col1",
            "cellType": "text",
            "inputType": "text"
          }
        ],
        "rowCount": 0
      },
      {
        "type": "expression",
        "name": "q3",
        "expression": "sumInArray({q1}, 'col1')"
      }
    ]
  });
  const checkbox = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q2");
  const expression = survey.getQuestionByName("q3");
  checkbox.renderedValue = ["Item 1", "Item 2"];
  const rows = matrix.visibleRows;
  rows[0].getQuestionByColumnName("col1").value = 5;
  rows[1].getQuestionByColumnName("col1").value = 7;
  assert.equal(expression.value, 12, "Calculate values correctly");
});

QUnit.test("matrix dynamic & share data in cells & detail panel, Bug8697", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [
          {
            name: "col1",
            cellType: "text"
          }
        ],
        detailPanelMode: "underRow",
        detailElements: [
          {
            name: "q2",
            type: "text",
            valueName: "col1"
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const rows = matrix.visibleRows;
  rows[0].showDetailPanel();
  const col1 = rows[0].getQuestionByName("col1");
  const q2Cell = rows[0].getQuestionByName("q2");
  col1.value = "abc";
  assert.equal(q2Cell.value, "abc", "#1");
  q2Cell.value = "edf";
  assert.equal(col1.value, "edf", "#2");
  rows[1].getQuestionByName("col1").value = "123";
  rows[1].showDetailPanel();
  assert.equal(rows[1].getQuestionByName("q2").value, "123", "#3");
});
QUnit.test("matrix dynamic detail panel & shared matrix dynamics, Bug8697", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [
          {
            name: "col1",
            cellType: "text"
          }
        ],
        detailPanelMode: "underRow",
        detailElements: [
          {
            name: "matrix1",
            type: "matrixdynamic",
            valueName: "data",
            columns: [{ cellType: "text", name: "col1" }]
          },
          {
            name: "matrix2",
            type: "matrixdynamic",
            valueName: "data",
            columns: [{ cellType: "text", name: "col1" }],
            rowCount: 0
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const rows = matrix.visibleRows;
  rows[0].showDetailPanel();
  const matrix1 = <QuestionMatrixDynamicModel>rows[0].getQuestionByName("matrix1");
  const matrix2 = <QuestionMatrixDynamicModel>rows[0].getQuestionByName("matrix2");
  matrix1.visibleRows[0].getQuestionByName("col1").value = "a1";
  matrix1.visibleRows[1].getQuestionByName("col1").value = "a2";
  assert.deepEqual(matrix2.value, [{ col1: "a1" }, { col1: "a2" }], "#1");
});
QUnit.test("matrix dynamic detail panel & checkbox valuePropertyName, Bug8697", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            choices: [1, 2, 3, 4, 5],
            valuePropertyName: "prop1"
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const rows = matrix.visibleRows;
  const checkbox = rows[0].getQuestionByName("col1");
  checkbox.renderedValue = [1, 4];
  assert.deepEqual(checkbox.renderedValue, [1, 4], "renderedValue #1");
  assert.deepEqual(checkbox.value, [{ prop1: 1 }, { prop1: 4 }], "value #1");
});
QUnit.test("matrix dynamic detail panel & checkbox valuePropertyName & matrix dynamic in detail panel, Bug8697", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "q1",
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            choices: [1, 2, 3, 4, 5],
            valuePropertyName: "prop1"
          }
        ],
        detailPanelMode: "underRow",
        detailElements: [
          {
            name: "matrix1",
            type: "matrixdynamic",
            valueName: "col1",
            columns: [{ cellType: "text", name: "prop1" }],
            rowCount: 0
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("q1");
  const rows = matrix.visibleRows;
  rows[0].showDetailPanel();
  rows[0].getQuestionByName("col1").renderedValue = [1, 3, 4, 5];
  let matrix1 = <QuestionMatrixDynamicModel>rows[0].getQuestionByName("matrix1");
  assert.deepEqual(matrix1.value, [{ prop1: 1 }, { prop1: 3 }, { prop1: 4 }, { prop1: 5 }], "#1");
  rows[1].getQuestionByName("col1").renderedValue = [3];
  rows[1].showDetailPanel();
  matrix1 = <QuestionMatrixDynamicModel>rows[1].getQuestionByName("matrix1");
  assert.deepEqual(matrix1.value, [{ prop1: 3 }], "#2");
});
QUnit.test("matrix dynamic & detail panel, add a new row when the last row is expanded, errorLocation: 'bottom', Bug9147", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        errorLocation: "bottom",
        columns: [
          {
            name: "col1",
            cellType: "text"
          }
        ],
        detailPanelMode: "underRow",
        detailElements: [
          {
            name: "q2",
            type: "text"
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const rendredTable = matrix.renderedTable;
  const rows = matrix.visibleRows;
  rows[1].showDetailPanel();
  assert.equal(rendredTable.rows.length, 2 * 2 + 1, "There are 5 rows");
  assert.equal(rendredTable.rows[4].isDetailRow, true, "The last row is a detail row");
  matrix.addRow();
  assert.equal(rendredTable.rows.length, 3 * 2 + 1, "There are 7 rows");
  assert.equal(rendredTable.rows[4].isDetailRow, true, "The 5th row is a detail row");
  assert.equal(rendredTable.rows[5].cells[1].question.name, "col1", "The 6th row is a data row");
  assert.equal(rendredTable.rows[5].isDetailRow, false, "The 6th row is not a detail row");
  assert.equal(rendredTable.rows[6].isErrorsRow, true, "The 7th row is an error row");
  assert.equal(rendredTable.rows[6].isDetailRow, false, "The 7th row is not a detail row");
});
QUnit.test("matrix dynamic & detail panel, add a new row when the last row is expanded, errorLocation: 'top' (default), Bug9147", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [
          {
            name: "col1",
            cellType: "text"
          }
        ],
        detailPanelMode: "underRow",
        detailElements: [
          {
            name: "q2",
            type: "text"
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const rendredTable = matrix.renderedTable;
  const rows = matrix.visibleRows;
  rows[1].showDetailPanel();
  assert.equal(rendredTable.rows.length, 2 * 2 + 1, "There are 5 rows");
  assert.equal(rendredTable.rows[4].isDetailRow, true, "The last row is a detail row");
  matrix.addRow();
  assert.equal(rendredTable.rows.length, 3 * 2 + 1, "There are 7 rows");
  assert.equal(rendredTable.rows[4].isDetailRow, true, "The 5th row is a detail row");
  assert.equal(rendredTable.rows[5].isErrorsRow, true, "The 6th row is an error row");
  assert.equal(rendredTable.rows[6].isDetailRow, false, "The 7th row is not a detail row");
  assert.equal(rendredTable.rows[6].cells[1].question.name, "col1", "The 7th row is a data row");
});
QUnit.test("Totals alingment", function (assert) {
  var json = {
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "matrixdynamic",
            name: "question1",
            title: "Select Your Coffee",
            columns: [
              {
                name: "coffee",
                title: "Coffee",
                cellType: "dropdown",
                isRequired: true,
                isUnique: true,
                choices: [
                  {
                    value: "espresso",
                    text: "Espresso",
                  },
                  {
                    value: "ristretto",
                    text: "Ristretto",
                  },
                  {
                    value: "macchiato",
                    text: "Macchiato",
                  },
                ],
                storeOthersAsComment: true,
              },
              {
                name: "price",
                title: "Price",
                cellType: "expression",
                expression:
                  "iif({row.coffee} = 'ristretto' or {row.coffee} = 'macchiato' or {row.coffee} = 'cappuchino', '2.5', iif({row.coffee} = 'flatWhite' or {row.coffee} = 'latte', 3, 2))\n",
              },
              {
                name: "amount",
                title: "Num of Items",
                cellType: "dropdown",
                totalType: "sum",
                choicesMin: 1,
                choicesMax: 10,
              },
              {
                name: "totalPerRow",
                title: "Total",
                cellType: "expression",
                totalType: "sum",
                totalDisplayStyle: "currency",
                totalAlignment: "center",
                expression: "{row.price} * {row.amount}",
              },
            ],
            rowCount: 1,
            maxRowCount: 6,
            defaultRowValue: {
              coffeeItem: "2",
              coffee: "espresso",
              price: 2,
              amount: 1,
              totalPerRow: 2,
            },
            addRowButtonLocation: "topBottom",
            addRowText: "Add Coffee",
          },
        ],
      },
    ],
  };

  var survey = new SurveyModel(json);
  var question = <QuestionMatrixDynamicModel>(
    survey.getQuestionByName("question1")
  );
  question.cssClassesValue.cellQuestionWrapper = "sd-table__question-wrapper";
  var renderedTable = question.renderedTable;
  assert.equal(
    renderedTable.footerRow.cells[1].cellQuestionWrapperClassName,
    "sd-table__question-wrapper sd-table__question-wrapper--auto"
  );
  assert.equal(
    renderedTable.footerRow.cells[2].cellQuestionWrapperClassName,
    "sd-table__question-wrapper sd-table__question-wrapper--expression sd-table__question-wrapper--left"
  );
  assert.equal(
    renderedTable.footerRow.cells[3].cellQuestionWrapperClassName,
    "sd-table__question-wrapper sd-table__question-wrapper--expression sd-table__question-wrapper--center"
  );
});
QUnit.test("lockedRowCount property", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        allowRowsDragAndDrop: true,
        rowCount: 4,
        columns: ["col1"]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  matrix.lockedRowCount = 2;
  const rows = matrix.visibleRows;
  assert.equal(matrix.canRemoveRow(rows[0]), false, "canRemoveRow, row#0");
  assert.equal(matrix.canRemoveRow(rows[1]), false, "canRemoveRow, row#1");
  assert.equal(matrix.canRemoveRow(rows[2]), true, "canRemoveRow, row#2");
  assert.equal(matrix.canRemoveRow(rows[3]), true, "canRemoveRow, row#3");

  const table = matrix.renderedTable;
  assert.equal(table.headerRow.cells.length, 3, "Drag handler cell + one column + actions cell");
  assert.equal(table.rows[1].cells[0].isDragHandlerCell, false, "isDragHandlerCell, row#1");
  assert.equal(table.rows[3].cells[0].isDragHandlerCell, false, "isDragHandlerCell, row#2");
  assert.equal(table.rows[5].cells[0].isDragHandlerCell, true, "isDragHandlerCell, row#3");
  assert.equal(table.rows[7].cells[0].isDragHandlerCell, true, "isDragHandlerCell, row#4");
  assert.equal(table.rows[1].cells[0].isEmpty, true, "isEmpty, row#1");
  assert.equal(table.rows[3].cells[0].isEmpty, true, "isEmpty, row#2");
  assert.equal(table.rows[5].cells[0].isEmpty, false, "isEmpty, row#3");
  assert.equal(table.rows[7].cells[0].isEmpty, false, "isEmpty, row#4");
});
QUnit.test("Do not re-create rows on changing allowRowsDragAndDrop property", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        defaultValue: [{ col1: 1 }, { col1: 2 }],
        columns: ["col1"]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const visibleRows = matrix.visibleRows;
  matrix.allowRowsDragAndDrop = true;
  assert.equal(visibleRows[0].id, matrix.visibleRows[0].id, "#1");
  matrix.allowRowsDragAndDrop = false;
  assert.equal(visibleRows[0].id, matrix.visibleRows[0].id, "#2");
});

QUnit.test("table: check renderedRows", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        columns: ["col1"]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const renderedTable = matrix.renderedTable;
  assert.equal(renderedTable.renderedRows.length, 4);
  assert.deepEqual(renderedTable.renderedRows, renderedTable.rows);
  matrix.addRow();
  assert.equal(renderedTable.rows.length, 6);
  assert.equal(renderedTable.renderedRows.length, 6);
  matrix.removeRow(2);
  assert.equal(renderedTable.rows.length, 4);
  assert.equal(renderedTable.renderedRows.length, 4);
});

QUnit.test("table: check animation options", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 2,
        columns: ["col1"]
      }
    ]
  });
  survey.css = {
    "matrixdynamic": {
      rowEnter: "enter",
      rowLeave: "leave",
    }
  };
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const renderedTable = matrix.renderedTable;
  assert.ok(renderedTable["renderedRowsAnimation"] instanceof AnimationGroup);
  const options = renderedTable["getRenderedRowsAnimationOptions"]();
  const tableHtmlElement = document.createElement("table");
  const rowHtmlElement = document.createElement("tr");
  const cellHtmlElement = document.createElement("td");
  const questionHtmlElement = document.createElement("div");
  cellHtmlElement.appendChild(questionHtmlElement);
  rowHtmlElement.appendChild(cellHtmlElement);
  tableHtmlElement.appendChild(rowHtmlElement);
  document.body.appendChild(tableHtmlElement);
  questionHtmlElement.style.height = "20px";

  assert.equal(renderedTable.rows[0].id, options.getKey(renderedTable.rows[0]));
  assert.equal(renderedTable.rows[1].id, options.getKey(renderedTable.rows[1]));
  assert.equal(renderedTable.rows[2].id, options.getKey(renderedTable.rows[2]));
  assert.equal(renderedTable.rows[3].id, options.getKey(renderedTable.rows[3]));

  const enterOptions = options.getEnterOptions(renderedTable.rows[1]);
  enterOptions.onBeforeRunAnimation && enterOptions.onBeforeRunAnimation(rowHtmlElement);
  assert.equal(enterOptions.cssClass, "enter");
  assert.equal(questionHtmlElement.style.getPropertyValue("--animation-height-to"), "20px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(rowHtmlElement);
  assert.notOk(questionHtmlElement.style.getPropertyValue("--animation-height-to"));

  questionHtmlElement.style.height = "40px";
  const leaveOptions = options.getLeaveOptions(renderedTable.rows[1]);
  leaveOptions.onBeforeRunAnimation && leaveOptions.onBeforeRunAnimation(rowHtmlElement);
  assert.equal(leaveOptions.cssClass, "leave");
  assert.equal(questionHtmlElement.style.getPropertyValue("--animation-height-to"), "40px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(rowHtmlElement);
  assert.notOk(questionHtmlElement.style.getPropertyValue("--animation-height-to"));
  tableHtmlElement.remove();
});
QUnit.test("set data from the survey", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [{ name: "col1" }]
      }
    ]
  });
  survey.data = { matrix: [{ col1: 1 }] };
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 1, "There one row");
});
QUnit.test("set data from the survey and default row count is 0", function (assert) {
  const prop = Serializer.findProperty("matrixdynamic", "rowCount");
  const prevValue = prop.defaultValue;
  assert.equal(prevValue, 2, "The default rowCount value is 2");
  prop.defaultValue = 0;
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        columns: [{ name: "col1" }]
      }
    ]
  });
  survey.data = { matrix: [{ col1: 1 }] };
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 1, "There one row");
  Serializer.findProperty("matrixdynamic", "rowCount").defaultValue = 2;
  prop.defaultValue = prevValue;
});
QUnit.test("set data from the defaultValue and ignore rowCount", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "matrix",
        rowCount: 3,
        defaultValue: [{ col1: 1 }],
        columns: [{ name: "col1" }]
      }
    ]
  });
  survey.data = { matrix: [{ col1: 1 }] };
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows.length, 1, "There one row");
});

QUnit.test("check cell.isVisible property", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "matrixdropdown",
        "name": "matrix",
        "columns": [
          {
            "name": "col1"
          },
          {
            "name": "col1",
            "visibleIf": "{row.col1} = 1"
          },
        ],
        "choices": [
          1,
        ],
        "rows": [
          "row1",
          "row2"
        ]
      }
    ]
  });
  survey.data = { matrix: { row1: { col1: 1 } } };
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  let renderedTable = matrix.renderedTable;
  assert.ok(renderedTable.rows[0].cells[0].isVisible);
  assert.ok(renderedTable.rows[0].cells[1].isVisible);
  assert.ok(renderedTable.rows[0].cells[2].isVisible);
  assert.ok(renderedTable.rows[1].cells[0].isVisible);
  assert.ok(renderedTable.rows[1].cells[1].isVisible);
  assert.ok(renderedTable.rows[1].cells[2].isVisible);
  assert.ok(renderedTable.rows[2].cells[0].isVisible);
  assert.ok(renderedTable.rows[2].cells[1].isVisible);
  assert.ok(renderedTable.rows[2].cells[2].isVisible);
  assert.ok(renderedTable.rows[3].cells[0].isVisible);
  assert.ok(renderedTable.rows[3].cells[1].isVisible);
  assert.ok(renderedTable.rows[3].cells[2].isVisible);
  matrix.isMobile = true;
  renderedTable = matrix.renderedTable;
  assert.ok(renderedTable.rows[0].cells[0].isVisible);
  assert.ok(renderedTable.rows[0].cells[1].isVisible);
  assert.ok(renderedTable.rows[0].cells[2].isVisible);
  assert.ok(renderedTable.rows[0].cells[3].isVisible);
  assert.ok(renderedTable.rows[0].cells[4].isVisible);
  assert.ok(renderedTable.rows[1].cells[0].isVisible);
  assert.ok(renderedTable.rows[1].cells[1].isVisible);
  assert.ok(renderedTable.rows[1].cells[2].isVisible);
  assert.notOk(renderedTable.rows[1].cells[3].isVisible);
  assert.notOk(renderedTable.rows[1].cells[4].isVisible);
  survey.data = { matrix: { row1: { col1: 1 }, row2: { col1: 1 } } };
  assert.ok(renderedTable.rows[0].cells[0].isVisible);
  assert.ok(renderedTable.rows[0].cells[1].isVisible);
  assert.ok(renderedTable.rows[0].cells[2].isVisible);
  assert.ok(renderedTable.rows[0].cells[3].isVisible);
  assert.ok(renderedTable.rows[0].cells[4].isVisible);
  assert.ok(renderedTable.rows[1].cells[0].isVisible);
  assert.ok(renderedTable.rows[1].cells[1].isVisible);
  assert.ok(renderedTable.rows[1].cells[2].isVisible);
  assert.ok(renderedTable.rows[1].cells[3].isVisible);
  assert.ok(renderedTable.rows[1].cells[4].isVisible);
});

QUnit.test("check displayMode property", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "matrixdropdown",
        "name": "matrix",
        "columns": [
          {
            "name": "col1"
          },
          {
            "name": "col1",
          },
        ],
        "choices": [
          1,
        ],
        "rows": [
          "row1",
          "row2"
        ]
      }
    ]
  });
  const question = <QuestionMatrixDropdownModel>survey.getAllQuestions()[0];
  survey.css = { question: { mobile: "test_mobile" } };
  question.isMobile = true;
  assert.equal(question.displayMode, "auto");
  assert.ok(question.isMobile);
  assert.ok(question.getRootCss().includes("test_mobile"));
  question.isMobile = false;
  assert.notOk(question.isMobile);
  assert.notOk(question.getRootCss().includes("test_mobile"));

  question.isMobile = true;
  question.displayMode = "table";
  assert.notOk(question.isMobile);
  assert.notOk(question.getRootCss().includes("test_mobile"));
  question.isMobile = false;
  assert.notOk(question.isMobile);
  assert.notOk(question.getRootCss().includes("test_mobile"));

  question.isMobile = true;
  question.displayMode = "list";
  assert.ok(question.isMobile);
  assert.ok(question.getRootCss().includes("test_mobile"));
  question.isMobile = false;
  assert.ok(question.isMobile);
  assert.ok(question.getRootCss().includes("test_mobile"));
});
QUnit.test("minRowCount vs rowCount, Bug#8899", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "matrixdynamic", name: "matrix", minRowCount: 1, columns: [{ name: "col1" }] },
      { type: "matrixdynamic", name: "matrix1", minRowCount: 1, rowCount: 1, columns: [{ name: "col1" }] },
      { type: "matrixdynamic", name: "matrix2", minRowCount: 1, rowCount: 2, columns: [{ name: "col1" }] },
      { type: "matrixdynamic", name: "matrix3", minRowCount: 1, rowCount: 3, columns: [{ name: "col1" }] },
      { type: "matrixdynamic", name: "matrix4", minRowCount: 1, rowCount: 4, defaultRowValue: { col1: 1 }, columns: [{ name: "col1", cellType: "text" }] },
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  const matrix1 = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix1");
  const matrix2 = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix2");
  const matrix3 = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix3");
  const matrix4 = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix4");
  assert.equal(matrix.visibleRows.length, 2, "matrix rowCount: 2");
  assert.equal(matrix1.visibleRows.length, 1, "matrix1 rowCount: 1");
  assert.equal(matrix2.visibleRows.length, 2, "matrix2 rowCount: 2");
  assert.equal(matrix3.visibleRows.length, 3, "matrix3 rowCount: 3");
  assert.equal(matrix4.visibleRows.length, 4, "matrix4 rowCount: 4");
  assert.deepEqual(matrix4.value, [{ col1: 1 }, { col1: 1 }, { col1: 1 }, { col1: 1 }], "matrix4 value");
});
QUnit.test("Validation doesn't work if a user doensn't visit the page, Bug#8937", function (assert) {
  const survey = new SurveyModel({
    logoPosition: "right",
    pages: [
      {
        elements: [{ type: "text", name: "question1" }]
      },
      {
        elements: [
          {
            type: "matrixdynamic",
            name: "matrix",
            columns: [{ cellType: "text", name: "col1", isRequired: true }],
            rowCount: 1
          }
        ]
      },
      {
        elements: [{ type: "text", name: "question3" }]
      }
    ],
    checkErrorsMode: "onComplete"
  });
  survey.currentPageNo = 2;
  survey.tryComplete();
  assert.equal(survey.state, "running", "Still running");
  assert.equal(survey.currentPageNo, 1, "move to page with panel");
  const matrix = <QuestionMatrixDynamicModel>survey.getQuestionByName("matrix");
  assert.equal(matrix.visibleRows[0].getQuestionByName("col1").errors.length, 1, "has an error");
});

QUnit.test("column width settings passed to all rows", function (assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 2,
        columns: [{ name: "1", width: "15%", minWidth: "10%" }, { name: "2" }],
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  var table = matrix.renderedTable;
  assert.equal(table.rows.length, 4);
  assert.equal(table.rows[1].cells[0].width, "15%", "The first row cell width 15%");
  assert.equal(table.rows[1].cells[0].minWidth, "10%", "The first row cell min width 10%");
  assert.equal(table.rows[3].cells[0].width, "15%", "The second row cell width 15%");
  assert.equal(table.rows[3].cells[0].minWidth, "10%", "The second row cell min width 10%");
});
QUnit.test("cell title renderedHtml is incorrect on adding/removing rows ", function (assert) {
  var survey = new SurveyModel({
    questions: [
      {
        type: "matrixdynamic",
        name: "q1",
        rowCount: 2,
        columns: [{ name: "col1" }],
      },
    ],
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  const rows = matrix.visibleRows;
  assert.equal(rows[0].cells[0].question.locTitle.renderedHtml, "row 1, column col1", "#1");
  assert.equal(rows[1].cells[0].question.locTitle.renderedHtml, "row 2, column col1", "#2");
  matrix.removeRow(0);
  matrix.addRow();
  assert.equal(rows[0].cells[0].question.locTitle.renderedHtml, "row 1, column col1", "#3");
  assert.equal(rows[1].cells[0].question.locTitle.renderedHtml, "row 2, column col1", "#4");
});
QUnit.test("Use matrix rows id & cells questions id in rendered table, Bug#9233", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "question1",
        rowCount: 1,
        columns: [
          {
            name: "col1",
            visibleIf: "{row.col2} notempty",
            cellType: "text"
          },
          {
            name: "col2",
            cellType: "text"
          },
          {
            name: "col3",
            visibleIf: "{row.col2} notempty",
            cellType: "text"
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  const rowId = matrix.visibleRows[0].id;
  const cellQuestion = matrix.visibleRows[0].cells[1].question;
  const colId = cellQuestion.id;
  let table = matrix.renderedTable;
  assert.equal(table.rows[0].isErrorsRow, true, "It is an error row, #1");
  assert.equal(table.rows[0].id.endsWith("-error"), true, "There is -error postfix, #1");
  assert.equal(table.rows[1].id, rowId, "Use row id, #1");
  assert.equal(table.rows[0].cells[0].id, colId + "-error", "There is -error postfix in error cell, #1");
  assert.equal(table.rows[1].cells[0].id, colId, "Use question id, #1.2");
  cellQuestion.value = "abc";
  table = matrix.renderedTable;
  assert.equal(table.rows[1].id, rowId, "Use row id, #2");
  assert.equal(table.rows[1].cells[1].id, colId, "Use question id, #2");
});
QUnit.test("Use matrix rows id & cells questions id in rendered table & showInMultipleColumns, Bug#9233", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "matrixdynamic",
        name: "question1",
        rowCount: 1,
        columns: [
          {
            name: "col1",
            cellType: "checkbox",
            choices: [1, 2],
            showInMultipleColumns: true
          }
        ]
      }
    ]
  });
  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  const col1Id = matrix.visibleRows[0].cells[0].question.id;
  let table = matrix.renderedTable;
  assert.equal(table.rows[0].cells[0].id, col1Id + "-error", "There is -error postfix in error cell, #1");
  assert.equal(table.rows[1].cells[0].id, col1Id + "-index0", "Use question id, #1");
  assert.equal(table.rows[1].cells[1].id, col1Id + "-index1", "Use question id, #2");
});