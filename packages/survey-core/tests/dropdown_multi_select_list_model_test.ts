import { DropdownMultiSelectListModel } from "../src/dropdownMultiSelectListModel";
import { MultiSelectListModel } from "../src/multiSelectListModel";
import { QuestionTagboxModel } from "../src/question_tagbox";
import { SurveyModel } from "../src/survey";

export default QUnit.module("DropdownMultiListModel");

const jsonTagbox = {
  questions: [{
    type: "tagbox",
    name: "question1",
    hasOther: "true",
    choices: [
      "item1",
      "item2",
      "item3",
      "item4",
      "item5",
      "item6",
      "item7",
      "item8",
      "item9",
      "item10",
      "item11",
      "item12",
      "item13",
      "item14",
      "item15",
      "item16",
      "item17",
      "item18",
      "item19",
      "item20",
      "item21",
      "item22",
      "item23",
      "item24",
      "item25",
      "item26",
      "item27"
    ]
  }]
};
function getVisibleActionByIndex(list: MultiSelectListModel, index: number) {
  const array = list.renderedActions.filter(item => list.isItemVisible(item));
  return array[index];
}

QUnit.test("DropdownListModel with MultiListModel", (assert) => {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.actions.length, 28);
  assert.deepEqual(question.value, []);

  list.onItemClick(list.actions[0]);
  assert.deepEqual(question.value, ["item1"]);

  list.onItemClick(list.actions[3]);
  assert.deepEqual(question.value, ["item1", "item4"]);

  list.onItemClick(list.actions[0]);
  assert.deepEqual(question.value, ["item4"]);

  dropdownListModel.onClear(new Event("click"));
  assert.equal(question.value.length, 0);
});

QUnit.test("DropdownListModel with MultiListModel & searchEnabled false", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      hasOther: "true",
      searchEnabled: "false",
      choices: [
        "item1",
        "item2",
        "item3",
        "item4",
        "item5",
        "item6",
        "item7",
        "item8",
        "item9",
        "item10",
        "item11",
        "item12",
        "item13",
        "item14",
        "item15",
        "item16",
        "item17",
        "item18",
        "item19",
        "item20",
        "item21",
        "item22",
        "item23",
        "item24",
        "item25",
        "item26",
        "item27"
      ]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.showFilter, false, "list.showFilter false");
  assert.equal(dropdownListModel.searchEnabled, false, "dropdownListModel.searchEnabled false");

  question.searchEnabled = true;
  assert.equal(list.showFilter, false, "list.showFilter false");
  assert.equal(dropdownListModel.searchEnabled, true, "dropdownListModel.searchEnabled true");
});

QUnit.test("DropdownListModel with MultiListModel state actions", (assert) => {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.actions.length, 28);

  list.onItemClick(list.actions[0]);
  assert.equal(list.isItemSelected(list.actions[0]), true);
  assert.equal(list.isItemSelected(list.actions[3]), false);

  list.onItemClick(list.actions[3]);
  assert.equal(list.isItemSelected(list.actions[0]), true);
  assert.equal(list.isItemSelected(list.actions[3]), true);

  list.onItemClick(list.actions[0]);
  assert.equal(list.isItemSelected(list.actions[0]), false);
  assert.equal(list.isItemSelected(list.actions[3]), true);

  dropdownListModel.onClear(new Event("click"));
  assert.equal(list.isItemSelected(list.actions[0]), false);
  assert.equal(list.isItemSelected(list.actions[3]), false);
});

QUnit.test("open/hide tagbox popup after start/end filtration", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  const popup = dropdownListModel.popupModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  assert.equal(popup.isVisible, false, "popup.isVisible 1");
  assert.equal(dropdownListModel.filterString, "", "filterString 1");

  dropdownListModel.filterString = "1";
  assert.equal(popup.isVisible, true, "popup.isVisible 2");

  list.onItemClick(getVisibleActionByIndex(list, 3));
  assert.equal(popup.isVisible, true, "popup.isVisible 3");
  assert.equal(dropdownListModel.filterString, "", "filterString 3");
  assert.deepEqual(question.value, ["item12"], "question.value before onClear");

  dropdownListModel.onClear(new Event("click"));
  assert.equal(dropdownListModel.filterString, "", "filterString after onClear");
  assert.deepEqual(question.value, [], "question.value after onClear");
});

QUnit.test("remove last selected item", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  assert.deepEqual(question.value, []);

  list.onItemClick(list.actions[3]);
  list.onItemClick(list.actions[0]);
  assert.deepEqual(question.value, ["item4", "item1"]);

  dropdownListModel.removeLastSelectedItem();
  assert.deepEqual(question.value, ["item4"]);

  dropdownListModel.removeLastSelectedItem();
  assert.equal(question.value.length, 0);

  dropdownListModel.removeLastSelectedItem();
  assert.equal(question.value.length, 0);
});

QUnit.test("filterStringPlaceholder", (assert) => {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  question.defaultValue = ["item1"];
  const dropdownListModel = question.dropdownListModel as DropdownMultiSelectListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(dropdownListModel.filterStringPlaceholder, "");

  dropdownListModel.onClear(new Event("click"));
  assert.equal(dropdownListModel.filterStringPlaceholder, "Select...");

  list.onItemClick(list.actions[3]);
  assert.equal(dropdownListModel.filterStringPlaceholder, "");

  question.clearValue();
  assert.equal(dropdownListModel.filterStringPlaceholder, "Select...");

  question.value = ["item2"];
  assert.equal(dropdownListModel.filterStringPlaceholder, "");
});

QUnit.test("hintString test", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  assert.equal(dropdownListModel.inputMode, "text");
  assert.notOk(dropdownListModel.showHintPrefix, "no filter, hint prefix hidden");
  assert.notOk(dropdownListModel.showHintString, "no filter, hint hidden");

  dropdownListModel.inputStringRendered = "It";
  assert.notOk(dropdownListModel.showHintPrefix, "filter from start, hint prefix hidden");
  assert.ok(dropdownListModel.showHintString, "filter from start, hint visible");
  assert.equal(dropdownListModel.hintString, "item1", "filter from start, hint string correct");
  assert.equal(dropdownListModel.hintStringSuffix, "em1", "filter from start, hint suffix correct");

  dropdownListModel.inputStringRendered = "te";
  assert.ok(dropdownListModel.showHintPrefix, "filter from middle, hint prefix visible");
  assert.ok(dropdownListModel.showHintString, "filter from middle, hint visible");
  assert.equal(dropdownListModel.hintStringPrefix, "i", "filter from middle, hint prefix correct");
  assert.equal(dropdownListModel.hintStringSuffix, "m1", "filter from middle, hint suffix correct");

  dropdownListModel.inputStringRendered = "zzz";
  assert.notOk(dropdownListModel.showHintPrefix, "wrong filter, hint prefix hidden");
  assert.ok(dropdownListModel.showHintString, "wrong filter, hint visible");

  list.onItemClick(list.actions[2]);
  assert.notOk(dropdownListModel.showHintPrefix, "filter from start with value, hint prefix hidden");
  assert.notOk(dropdownListModel.showHintString, "filter from start with value, hint not visible");
  assert.notOk(dropdownListModel.inputStringRendered, "inputStringRendered is empty");

  dropdownListModel.inputStringRendered = "it";
  assert.notOk(dropdownListModel.showHintPrefix, "filter from start with value, hint prefix hidden");
  assert.ok(dropdownListModel.showHintString, "filter from start with value, hint visible");
  assert.equal(dropdownListModel.hintStringSuffix, "em1", "filter from start with value, hint suffix correct");
});

QUnit.test("tagbox keyboard tests", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  question.value = ["item2"];
  assert.equal(dropdownListModel.inputString, "", "inputString default is empty");
  assert.equal(dropdownListModel.hintString, "", "hintString default is empty");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.notOk(dropdownListModel.showHintPrefix, "item2 showHintPrefix");
  assert.notOk(dropdownListModel.showHintString, "item2 showHintString");
  assert.equal(dropdownListModel.inputString, "", "item2 inputString");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.notOk(dropdownListModel.showHintPrefix, "item3 showHintPrefix");
  assert.ok(dropdownListModel.showHintString, "item3 showHintString");
  assert.equal(dropdownListModel.inputString, "", "item3 inputString");
  assert.equal(dropdownListModel.hintString, "item3", "item3 hintString");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.notOk(dropdownListModel.showHintPrefix, "showHintPrefix");
  assert.notOk(dropdownListModel.showHintString, "showHintString");
  assert.equal(dropdownListModel.inputString, "", "inputString");
});

QUnit.test("reset placeholder on in-list focus change", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);

  assert.equal(dropdownListModel.filterStringPlaceholder, "Select...");

  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(dropdownListModel.filterStringPlaceholder, "");
});

QUnit.test("tagbox using space", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  assert.equal(dropdownListModel.inputString, "", "inputString default is empty");
  assert.equal(dropdownListModel.hintString, "", "hintString default is empty");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);

  event.keyCode = 32;
  dropdownListModel.keyHandler(event);
  assert.deepEqual(question.value, ["item1"]);

  event.keyCode = 32;
  dropdownListModel.keyHandler(event);
  assert.deepEqual(question.value, []);

  dropdownListModel.inputStringRendered = "item";
  event.keyCode = 32;
  dropdownListModel.keyHandler(event);
  assert.deepEqual(question.value, []);
});

QUnit.test("tagbox hint after deselect", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  assert.equal(dropdownListModel.inputString, "", "inputString default is empty");
  assert.equal(dropdownListModel.hintString, "", "hintString default is empty");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.hintString, "item1", "item3 hintString");

  event.keyCode = 32;
  dropdownListModel.keyHandler(event);
  assert.deepEqual(question.value, ["item1"]);

  event.keyCode = 32;
  dropdownListModel.keyHandler(event);
  assert.deepEqual(question.value, []);
  assert.equal(dropdownListModel.hintString, "item1", "item3 hintString again");
});

QUnit.test("tagbox placeholder not updated", function (assert) {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.equal(dropdownListModel.filterStringPlaceholder, "Select...");

  question.placeholder = "Choose...";
  assert.equal(dropdownListModel.filterStringPlaceholder, "Choose...");
});

QUnit.test("Hide popup if hideSelectedItems and click 'Select All'", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      showSelectAllItem: true,
      hideSelectedItems: true,
      choices: ["item1", "item2", "item3", "item4", "item5", "item6", "item7", "item8", "item9", "item10"]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = new DropdownMultiSelectListModel(question);
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.actions.length, 11);
  assert.deepEqual(question.value, []);

  dropdownListModel.popupModel.show();
  assert.equal(dropdownListModel.popupModel.isVisible, true);
  assert.equal(list.actions[0].title, "Select All");

  list.onItemClick(list.actions[0]);
  assert.deepEqual(question.value.length, 10);
  assert.equal(dropdownListModel.popupModel.isVisible, false);
  assert.equal(list.actions[0].title, "Deselect all");
});