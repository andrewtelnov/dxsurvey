import { DropdownListModel } from "../src/dropdownListModel";
import { ListModel } from "../src/list";
import { PopupModel } from "../src/popup";
import { QuestionDropdownModel } from "../src/question_dropdown";
import { QuestionPanelDynamicModel } from "../src/question_paneldynamic";
import { SurveyModel } from "../src/survey";
import { _setIsTouch } from "../src/utils/devices";
import { PopupDropdownViewModel } from "../src/popup-dropdown-view-model";

export default QUnit.module("DropdownListModel");

const jsonDropdown = {
  questions: [{
    type: "dropdown",
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
function getVisibleActionByIndex(list: ListModel, index: number) {
  const array = list.renderedActions.filter(item => list.isItemVisible(item));
  return array[index];
}

QUnit.test("DropdownListModel with ListModel", (assert) => {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof ListModel);

  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  assert.equal(list.actions.length, 28);

  list.onItemClick(list.actions[0]);
  assert.equal(question.value, "item1");
  assert.ok(list.isItemSelected(list.actions[0]));

  list.onItemClick(list.actions[3]);
  assert.equal(question.value, "item4");
  assert.ok(list.isItemSelected(list.actions[3]));
  assert.equal(list.isItemSelected(list.actions[0]), false);

  dropdownListModel.onClear(new Event("click"));
  assert.equal(question.value, undefined);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 0);
});

QUnit.test("DropdownListModel focusFirstInputSelector", (assert) => {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popupModel = dropdownListModel.popupModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  list.showFilter = true;

  popupModel.isVisible = true;
  assert.equal(list.actions.length, 28);
  assert.equal(question.value, undefined, "question.value");
  assert.equal(list.showFilter, true, "list.showFilter");
  assert.equal(popupModel.isVisible, true, "popupModel.isVisible");
  assert.equal(popupModel.focusFirstInputSelector, "", "showFilter=true && value = undefined");

  list.onItemClick(list.actions[0]);
  popupModel.isVisible = true;
  assert.equal(question.value, "item1", "question.value");
  assert.equal(list.showFilter, true, "list.showFilter");
  assert.equal(popupModel.isVisible, true, "popupModel.isVisible");
  assert.equal(popupModel.focusFirstInputSelector, "", "showFilter=true && value = 'item1'");

  popupModel.isVisible = false;
  dropdownListModel.onClear(new Event("click"));
  popupModel.isVisible = true;
  assert.equal(list.actions.length, 28);
  assert.equal(question.value, undefined, "question.value");
  assert.equal(list.showFilter, true, "list.showFilter");
  assert.equal(popupModel.isVisible, true, "popupModel.isVisible");
  assert.equal(popupModel.focusFirstInputSelector, "", "showFilter=true && value = undefined");

  popupModel.isVisible = false;
  list.setItems(list.actions.slice(0, 9));
  list.showFilter = false;
  popupModel.isVisible = true;
  assert.equal(list.actions.length, 9);
  assert.equal(question.value, undefined, "question.value");
  assert.equal(list.showFilter, false, "list.showFilter");
  assert.equal(popupModel.isVisible, true, "popupModel.isVisible");
  assert.equal(popupModel.focusFirstInputSelector, "", "showFilter=false && value = undefined");

  list.onItemClick(list.actions[0]);
  popupModel.isVisible = true;
  assert.equal(question.value, "item1", "question.value");
  assert.equal(list.showFilter, false, "list.showFilter");
  assert.equal(popupModel.isVisible, true, "popupModel.isVisible");
  assert.equal(popupModel.focusFirstInputSelector, ".sv-list__item--selected", "showFilter=false && value = 'item1'");
});
QUnit.test("DropdownListModel focusFirstInputSelector mobile", (assert) => {
  _setIsTouch(true);
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popupModel = dropdownListModel.popupModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  popupModel.isVisible = true;
  assert.equal(popupModel.focusFirstInputSelector, ".sv-list__item", "value = undefined && isTouch = true");

  list.onItemClick(list.actions[0]);
  popupModel.isVisible = false;

  popupModel.isVisible = true;
  assert.equal(popupModel.focusFirstInputSelector, ".sv-list__item--selected", "isTouch=true && value = 'item1'");
  _setIsTouch(false);
});
QUnit.test("DropdownListModel with ListModel & searchEnabled false", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "dropdown",
      name: "question1",
      searchEnabled: "false",
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
  });
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof ListModel);

  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  assert.equal(list.actions.length, 28);
  assert.equal(list.showFilter, false, "list.showFilter false");
  assert.equal(dropdownListModel.searchEnabled, false, "dropdownListModel.searchEnabled false");

  question.searchEnabled = true;
  assert.equal(list.showFilter, false, "list.showFilter false");
  assert.equal(dropdownListModel.searchEnabled, true, "dropdownListModel.searchEnabled true");
});

QUnit.test("filterString test", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  assert.equal(dropdownListModel.inputMode, "text");
  assert.equal(list.renderedActions.length, 28);
  assert.equal(list.renderedActions.filter(item => list.isItemVisible(item)).length, 28);

  dropdownListModel.filterString = "1";
  assert.equal(list.renderedActions.length, 28);
  assert.equal(list.renderedActions.filter(item => list.isItemVisible(item)).length, 12);

  dropdownListModel.filterString = "11";
  assert.equal(list.renderedActions.length, 28);
  assert.equal(list.renderedActions.filter(item => list.isItemVisible(item)).length, 1);

  dropdownListModel.filterString = "110";
  assert.equal(list.renderedActions.length, 28);
  assert.equal(list.renderedActions.filter(item => list.isItemVisible(item)).length, 0);
});

QUnit.test("open/hide dropdown popup after start/end filtration", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popup = dropdownListModel.popupModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  assert.equal(popup.isVisible, false, "popup.isVisible 1");
  assert.equal(dropdownListModel.filterString, "", "filterString 1");

  dropdownListModel.filterString = "1";
  assert.equal(popup.isVisible, true, "popup.isVisible 2");

  list.onItemClick(getVisibleActionByIndex(list, 3));
  assert.equal(popup.isVisible, false, "popup.isVisible 3");
  assert.equal(dropdownListModel.filterString, "", "filterString 2");
  assert.equal(question.value, "item12", "question.value");

  dropdownListModel.onClear(new Event("click"));
  assert.equal(dropdownListModel.filterString, "", "filterString after onClear");
  assert.equal(question.value, undefined, "question.value after onClear");
});

QUnit.test("hide dropdown on clear", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popup = dropdownListModel.popupModel;

  popup.isVisible = true;
  dropdownListModel.onClear(new Event("click"));
  assert.notOk(popup.isVisible, "hide popup after onClear");
});

QUnit.test("hide component on input entering symbols", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  question.inputFieldComponent = "component-name";
  question.value = "Ford";
  assert.ok(question.showInputFieldComponent);
  dropdownListModel.inputStringRendered = "abc";
  assert.notOk(question.showInputFieldComponent);
});

QUnit.test("Check list classes with onUpdateQuestionCssClasses", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  survey.css = {
    list: {
      itemSelected: "original-class-selected"
    },
    dropdown: {
      list: {
        item: "original-class"
      }
    }
  };
  survey.onUpdateQuestionCssClasses.add(function (survey, options) {
    var classes = options.cssClasses;
    classes.list = {
      item: classes.list.item += " custom-class",
      itemSelected: classes.list.itemSelected += " custom-class-selected"
    };
  });
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  question.dropdownListModel = dropdownListModel;
  assert.ok(question.cssClassesValue);
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  assert.equal(list.cssClasses.item, "original-class custom-class");
  assert.equal(list.cssClasses.itemSelected, "original-class-selected custom-class-selected");
});

QUnit.test("Check overlay popup when IsTouch is true", function (assert) {
  _setIsTouch(true);
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popup: PopupModel = dropdownListModel.popupModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  assert.equal(dropdownListModel.inputMode, "none");
  assert.equal(list.searchEnabled, true);
  assert.equal(list.showSearchClearButton, true);
  assert.equal(popup.displayMode, "overlay");
  assert.ok(popup.isFocusedContent);
  assert.notOk(popup.setWidthByTarget);
  popup.isVisible = true;
  assert.ok(popup.isVisible);
  dropdownListModel.onBlur(null);
  assert.ok(popup.isVisible);
  _setIsTouch(false);
});
QUnit.test("Check dropdown list model is updated from value", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  question.value = "item1";
  assert.ok(list.isItemSelected(list.actions.filter(item => item.id === "item1")[0]));
  question.value = "item2";
  assert.ok(list.isItemSelected(list.actions.filter(item => item.id === "item2")[0]));
});

QUnit.test("filterString and focusedItem", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  assert.equal(dropdownListModel.inputMode, "text");
  assert.equal(list.renderedActions.length, 28);
  assert.equal(list.renderedActions.filter(item => list.isItemVisible(item)).length, 28);

  dropdownListModel.filterString = "1";
  assert.equal(list.focusedItem.id, "item1");

  dropdownListModel.filterString = "";
  question.value = "item11";
  dropdownListModel.filterString = "1";
  assert.equal(list.focusedItem.id, "item11");
});

QUnit.test("hintString test", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

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
  assert.ok(dropdownListModel.showHintString, "wrong filter, shown hidden");

  question.value = "item3";
  dropdownListModel.inputStringRendered = "it";
  assert.notOk(dropdownListModel.showHintPrefix, "filter from start with value, hint prefix hidden");
  assert.ok(dropdownListModel.showHintString, "filter from start with value, hint visible");
  assert.equal(dropdownListModel.hintStringSuffix, "em3", "filter from start with value, hint suffix correct");
});

QUnit.test("showHintString for zero values", function (assert) {
  const survey = new SurveyModel({
    questions: [{
      type: "dropdown",
      name: "question1",
      hasOther: "true",
      searchEnabled: false,
      choices: [
        0,
        "1"]
    }
    ]
  });
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  dropdownListModel.inputStringRendered = "1";
  question.value = 0;
  assert.notOk(dropdownListModel.showHintString, "no hint");
});

QUnit.test("hintString test - no search", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  question.searchEnabled = false;

  assert.equal(dropdownListModel.inputMode, "text");
  assert.notOk(dropdownListModel.showHintString, "no search, hint hidden");
});

QUnit.test("hintString test - clear, see nothing", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  question.value = "item12";
  dropdownListModel.onFocus(null);
  dropdownListModel.inputStringRendered = "";
  assert.notOk(dropdownListModel.showHintString);
  assert.notOk(question.showSelectedItemLocText);
  dropdownListModel.onBlur({ stopPropagation: () => { } });
  assert.ok(question.showSelectedItemLocText);
});

QUnit.test("dropdown keyboard tests", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popupViewModel = new PopupDropdownViewModel(dropdownListModel.popupModel); // need for popupModel.onHide
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  assert.equal(dropdownListModel.inputString, "", "inputString default is empty");
  assert.equal(dropdownListModel.hintString, "", "hintString default is empty");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible by default");

  // TODO: change this behaviour (show popup on UP key)
  event.keyCode = 38;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on first UP");
  assert.equal(dropdownListModel.hintString, "", "hintString still empty on first UP");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is still hidden on first UP");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on first DOWN");
  assert.equal(dropdownListModel.hintString, "item1", "hintString changed on first DOWN");
  assert.ok(dropdownListModel.showHintString, "hintString already shown on first DOWN");
  assert.ok(dropdownListModel.popupModel.isVisible, "popup is visible on first DOWN");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on second DOWN");
  assert.equal(dropdownListModel.hintString, "item2", "hintString changed on second DOWN");
  assert.equal(question.value, undefined, "value not changed on second DOWN");

  event.keyCode = 38;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on UP");
  assert.equal(dropdownListModel.hintString, "item1", "hintString changed on UP");
  assert.equal(question.value, undefined, "value not changed on UP");

  event.keyCode = 27;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString cleared on Escape");
  assert.equal(dropdownListModel.hintString, "", "hintString cleared on Escape");
  assert.equal(question.value, undefined, "value not changed on Escape");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible on Escape");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on keydown");
  assert.equal(dropdownListModel.hintString, "item1", "hintString changed on keydown");
  assert.equal(question.value, undefined, "value not changed on keydown");
  assert.ok(dropdownListModel.popupModel.isVisible, "popup shown on keydown");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item1", "inputString changed on Enter");
  assert.ok(!dropdownListModel.hintString || dropdownListModel.hintString == dropdownListModel.inputString, "hintString empty or equal to inputString on Enter");
  assert.equal(question.value, "item1", "value  changed on Enter");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible on Enter");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item1", "inputString is set on DOWN again");
  assert.equal(dropdownListModel.hintString, "item1", "hintString is set on DOWN again");
  assert.ok(dropdownListModel.popupModel.isVisible, "popup is visible on DOWN again");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item2", "inputString is changed on DOWN one more time");
  assert.equal(dropdownListModel.hintString, "item2", "hintString is changed too on DOWN one more time");
  assert.ok(!dropdownListModel.hintString || dropdownListModel.hintString == dropdownListModel.inputString, "hintString empty or equal to inputString on DOWN one more time");

  event.keyCode = 27;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item1", "inputString rolled back on Esc");
  assert.equal(dropdownListModel.hintString, "item1", "hintString equal to inputString when rolled back on Esc");
  assert.equal(question.value, "item1", "value rolled back on Esc");
});

QUnit.test("dropdown incorrect popup open test", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  question.defaultValue = "item22";
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  dropdownListModel.onFocus(null);

  assert.equal(dropdownListModel.inputString, "item22", "inputString is item22");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible by default");

  dropdownListModel.inputStringRendered = "item2";
  assert.equal(dropdownListModel.inputString, "item2", "inputString is item2");
  assert.equal(dropdownListModel.hintString, "item22", "hintString is item22");
  assert.ok(dropdownListModel.popupModel.isVisible, "popup is visible");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item22", "inputString is item22 on Enter");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is hidden");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item22", "inputString is item22 on Enter again");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible 2");
});

QUnit.test("dropdown incorrect popup open test: lazy load", function (assert) {
  const survey = new SurveyModel({
    elements: [{
      type: "dropdown",
      name: "question1",
      defaultValue: "item12",
      choicesLazyLoadEnabled: true
    }
    ]
  });
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  survey.onChoicesLazyLoad.add((sender, options) => {
    var result: any = [];
    for (let index = 3; index < 23; index++) {
      result.push({ value: "item" + index, text: "item" + index });
    }
    result = result.filter(i => i.text.indexOf(options.filter) != -1);
    options.setItems(result, result.length);
  });
  survey.onGetChoiceDisplayValue.add((_, options) => {
    options.setItems(options.values);
  });

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  question.showSelectedItemLocText;
  assert.equal(question.showSelectedItemLocText, true, "check showSelectedItemLocText to raise onGetChoiceDisplayValue event");
  dropdownListModel.onFocus(null);

  assert.equal(dropdownListModel.inputString, "item12", "inputString is item12");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible by default");

  dropdownListModel.inputStringRendered = "item2";
  assert.equal(dropdownListModel.inputString, "item2", "inputString is item1");
  assert.equal(dropdownListModel.hintString, "item20", "hintString is item20");
  assert.ok(dropdownListModel.popupModel.isVisible, "popup is visible");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item20", "inputString is item22 on Enter");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item20", "inputString is item22 on Enter again");
});

QUnit.test("dropdown incorrect popup open test: lazy load, many items", function (assert) {
  const survey = new SurveyModel({
    elements: [{
      type: "dropdown",
      name: "question1",
      defaultValue: "item500",
      choicesLazyLoadEnabled: true
    }
    ]
  });
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  survey.onChoicesLazyLoad.add((sender, options) => {
    var result: any = [];
    for (let index = 3; index < 1000; index++) {
      result.push({ value: "item" + index, text: "item" + index });
    }
    result = result.filter(i => i.text.indexOf(options.filter) != -1);
    var res1 = result.slice(options.skip, options.take + options.skip);
    options.setItems(res1, result.length);
  });
  survey.onGetChoiceDisplayValue.add((_, options) => {
    options.setItems(options.values);
  });

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  question.showSelectedItemLocText;
  assert.equal(question.showSelectedItemLocText, true, "check showSelectedItemLocText to raise onGetChoiceDisplayValue event");
  dropdownListModel.onFocus(null);

  assert.equal(dropdownListModel.inputString, "item500", "inputString is item500");

  dropdownListModel.inputStringRendered = "item900";
  assert.equal(dropdownListModel.inputString, "item900", "inputString is item900");
  assert.equal(dropdownListModel.hintString, "item900", "hintString is item900");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item900", "inputString is item900 on Enter");

  event.keyCode = 13;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "item900", "inputString is item900 on Enter again");
});

QUnit.test("dropdown keyboard tests - empty question, search disabled", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };

  question.searchEnabled = false;
  assert.equal(dropdownListModel.inputString, "", "inputString default is empty");
  assert.equal(dropdownListModel.hintString, "", "hintString default is empty");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible by default");

  // TODO: change this behaviour (show popup on UP key)
  event.keyCode = 38;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on first UP");
  assert.equal(dropdownListModel.hintString, "", "hintString still empty on first UP");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is still hidden on first UP");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on first DOWN");
  assert.equal(dropdownListModel.hintString, "item1", "hintString changed on first DOWN");
  assert.ok(dropdownListModel.showHintString, "hintString already shown on first DOWN");
  assert.ok(dropdownListModel.popupModel.isVisible, "popup is visible on first DOWN");

  event.keyCode = 40;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on second DOWN");
  assert.equal(dropdownListModel.hintString, "item2", "hintString changed on second DOWN");
  assert.equal(question.value, undefined, "value not changed on second DOWN");

  event.keyCode = 38;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString still empty on UP");
  assert.equal(dropdownListModel.hintString, "item1", "hintString changed on UP");
  assert.equal(question.value, undefined, "value not changed on UP");

  event.keyCode = 27;
  dropdownListModel.keyHandler(event);
  assert.equal(dropdownListModel.inputString, "", "inputString cleared on Escape");
  assert.equal(dropdownListModel.hintString, "", "hintString cleared on Escape");
  assert.equal(question.value, undefined, "value not changed on Escape");
  assert.notOk(dropdownListModel.popupModel.isVisible, "popup is not visible on Escape");
});

QUnit.test("always show invisible hint part", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  question.value = "item1";
  dropdownListModel.onFocus(null);
  assert.notOk(dropdownListModel.showHintPrefix, "input equal to value, hint prefix hidden");
  assert.ok(dropdownListModel.showHintString, "input equal to value, hint visible");
  assert.equal(dropdownListModel.hintString, "item1", "input equal to value, hint string should be set on focus");
  assert.equal(dropdownListModel.hintStringSuffix, "", "input equal to value, hint suffix empty");

  dropdownListModel["listModel"].onItemClick(dropdownListModel["listModel"].actions[4]);
  assert.notOk(dropdownListModel.showHintPrefix, "list click, hint prefix hidden");
  assert.ok(dropdownListModel.showHintString, "list click, hint visible");
  assert.equal(dropdownListModel.hintString, "item5", "list click, hint string should be set on click");
  assert.equal(dropdownListModel.hintStringSuffix, "", "list click, hint suffix empty");
});

QUnit.test("change selection on keyboard", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popupViewModel = new PopupDropdownViewModel(dropdownListModel.popupModel); // need for popupModel.onHide
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  dropdownListModel.onClick(null);
  assert.equal(list.actions.filter(a => (a as any).selected).length, 0, "no selected items when no value");
  assert.notOk(question.selectedItemLocText, "no selected text when no value");

  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(list.actions.filter(a => (a as any).selected).length, 0, "still no selected items when no value");
  assert.notOk(question.selectedItemLocText, "still no selected text when no value");
  dropdownListModel.onClick(null);

  question.value = "item1";
  dropdownListModel.onClick(null);
  assert.equal(question.value, "item1");
  assert.equal((list.actions.filter(a => (a as any).selected)[0] as any).value, "item1");
  assert.equal(question.selectedItemLocText.calculatedText, "item1");

  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(question.value, "item1");
  assert.equal((list.actions.filter(a => (a as any).selected)[0] as any).value, "item2");
  assert.equal(question.selectedItemLocText.calculatedText, "item2", "selected item is changed too on DOWN one more time");

  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(question.value, "item1");
  assert.equal((list.actions.filter(a => (a as any).selected)[0] as any).value, "item3");
  assert.equal(question.selectedItemLocText.calculatedText, "item3", "selected item is changed too on DOWN one more time");

  (dropdownListModel as any).onHidePopup();
  assert.equal(question.selectedItemLocText.calculatedText, "item1");
});

QUnit.test("filtering on question with value", function (assert) {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  question.value = "item1";

  dropdownListModel.onClick(null);
  assert.equal((list.actions.filter(a => (a as any).selected)[0] as any).value, "item1");
  assert.equal(dropdownListModel.inputStringRendered, "item1", "input string is set to value");
  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal((list.actions.filter(a => (a as any).selected)[0] as any).value, "item2", "selected item changed");
  assert.equal(dropdownListModel.inputStringRendered, "item2", "input string rendered changed");

  dropdownListModel.inputStringRendered = "i";
  assert.equal(list.actions.filter(a => (a as any).selected).length, 0, "no selected items when filtering");

  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(list.actions.filter(a => (a as any).selected).length, 0, "no selected items when filtering and move key");

});

QUnit.test("hintString letter case", function (assert) {
  const survey = new SurveyModel({
    questions: [{
      type: "dropdown",
      name: "question1",
      hasOther: "true",
      choices: [
        "AbcAbc",
        "cAbcAb",
        "caBcaB",
      ]
    }]
  });
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;

  dropdownListModel.inputStringRendered = "Ab";
  assert.equal(dropdownListModel.hintString, "AbcAbc");
  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(dropdownListModel.hintString, "cAbcAb");
  assert.equal(dropdownListModel.inputStringRendered, "Ab");
  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(dropdownListModel.hintString, "caBcaB");
  assert.equal(dropdownListModel.inputStringRendered, "aB");
});

QUnit.test("Survey Markdown - dropdown and other option", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("Page 1");
  var q1 = new QuestionDropdownModel("q1");
  page.addQuestion(q1);
  q1.choices = [
    { value: 1, text: "text1markdown" },
    { value: 2, text: "text2markdown" },
  ];
  q1.hasOther = true;
  survey.onTextMarkdown.add(function (survey, options) {
    options.html = options.text;
  });

  q1.value = 2;
  const dropdownListModel = q1.dropdownListModel;

  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(dropdownListModel.hintString, "", "no hint on start");
  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(dropdownListModel.hintString, "Other (describe)");
  dropdownListModel.changeSelectionWithKeyboard(true);
  assert.equal(dropdownListModel.hintString, "", "no hint again");
});

QUnit.test("Survey Markdown - dropdown and input string", function (assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("Page 1");
  var q1 = new QuestionDropdownModel("q1");
  page.addQuestion(q1);
  q1.choices = [
    { value: 1, text: "#text1markdown" },
    { value: 2, text: "#text2markdown" },
  ];
  survey.onTextMarkdown.add(function (survey, options) {
    options.html = options.text.replace(/#/g, "*<hr>");
  });

  q1.value = 2;
  const dropdownListModel = q1.dropdownListModel;

  dropdownListModel.changeSelectionWithKeyboard(false);
  assert.equal(dropdownListModel.inputString, "*text2markdown");
  dropdownListModel.changeSelectionWithKeyboard(true);
  assert.equal(dropdownListModel.inputString, "*text1markdown");
});

QUnit.test("lazy loading clear value", function (assert) {
  const survey = new SurveyModel({
    questions: [{
      "type": "dropdown",
      "name": "country",
      "title": "Select a country",
      "isRequired": true,
      "defaultValue": "FRA",
      "choicesLazyLoadEnabled": true,
      "choicesLazyLoadPageSize": 40
    }]
  });

  survey.onGetChoiceDisplayValue.add((_, options) => {
    options.setItems(["France"]);
  });
  const event = {
    keyCode: 0,
    preventDefault: () => { },
    stopPropagation: () => { }
  };
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.equal(question.showSelectedItemLocText, true, "showSelectedItemLocText");
  event.keyCode = 40;
  dropdownListModel.keyHandler(event);

  assert.equal(dropdownListModel.inputStringRendered, "France", "inputString");

  dropdownListModel.inputStringRendered = "";

  assert.equal(dropdownListModel.hintString, "", "hintString");
  assert.equal(dropdownListModel.inputStringRendered, "");
});

QUnit.test("Dropdown should not be open on click in design mode", (assert) => {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel);

  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;
  assert.equal(list.actions.length, 28);
  assert.notOk(dropdownListModel.popupModel.isVisible);
  dropdownListModel.onClick(new Event("click"));
  assert.ok(dropdownListModel.popupModel.isVisible);
  dropdownListModel.onClick(new Event("click"));
  assert.notOk(dropdownListModel.popupModel.isVisible);
  survey.setDesignMode(true);

  dropdownListModel.onClick(new Event("click"));
  assert.notOk(dropdownListModel.popupModel.isVisible);
});

QUnit.test("Dropdown should not be open on click in preview mode", (assert) => {
  const survey = new SurveyModel(jsonDropdown);
  survey.showPreview();

  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];

  const dropdownListModel = question.dropdownListModel;
  const popupModel = dropdownListModel.popupModel;
  assert.notOk(popupModel.isVisible);
  dropdownListModel.onClick(new Event("click"));
  assert.notOk(popupModel.isVisible);
});

QUnit.test("Dropdown should not be open on click in display mode", (assert) => {
  const survey = new SurveyModel(jsonDropdown);
  survey.mode = "display";

  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];

  const dropdownListModel = question.dropdownListModel;
  const popupModel = dropdownListModel.popupModel;
  assert.notOk(popupModel.isVisible);
  dropdownListModel.onClick(new Event("click"));
  assert.notOk(popupModel.isVisible);
});

QUnit.test("order & locale change", function (assert) {
  const survey = new SurveyModel({ elements: [
    { type: "dropdown", name: "q1", choicesOrder: "asc",
      choices: [{ value: "A", text: { default: "AA", de: "BAA" } },
        { value: "B", text: { default: "BB", de: "ABB" } }] }
  ] });
  const question = <QuestionDropdownModel>survey.getQuestionByName("q1");
  let list: ListModel = question.popupModel.contentComponentData.model as ListModel;
  assert.equal(list.actions.length, 2, "Two items");
  assert.equal(list.actions[0].id, "A", "action[0].id");
  assert.equal(list.actions[1].id, "B", "action[1].id");
  survey.locale = "de";
  list = question.popupModel.contentComponentData.model as ListModel;
  assert.equal(list.actions.length, 2, "Two items");
  assert.equal(list.actions[0].id, "B", "action[0].id, de");
  assert.equal(list.actions[1].id, "A", "action[1].id, de");
});
QUnit.test("DropdownListModel filterReadOnly", (assert) => {
  const survey = new SurveyModel(jsonDropdown);
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.filterReadOnly);
  dropdownListModel.onFocus(null);
  assert.notOk(dropdownListModel.filterReadOnly);
  dropdownListModel.onBlur({ stopPropagation: () => { } });
  assert.ok(dropdownListModel.filterReadOnly);
});
QUnit.test("DropdownListModel in panel filterString change callback", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "p",
        templateElements: [
          {
            type: "dropdown",
            name: "country",
            choicesLazyLoadEnabled: true,
            showOtherItem: true,
          },
        ],
      },
    ],
    showQuestionNumbers: false,
  });
  const question = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  question.addPanel();

  const dropdownListModel = (question.panels[0].elements[0] as QuestionDropdownModel).dropdownListModel;
  dropdownListModel["listModel"].filterString = "abc";
  assert.equal(dropdownListModel.filterString, "abc");
});
QUnit.test("DropdownListModel filter options", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "dropdown",
      name: "question1",
      searchEnabled: true,
      choices: [
        "abc",
        "abd",
        "cab",
        "efg"
      ]
    }]
  });
  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  dropdownListModel.filterString = "ab";
  const getfilteredItems = () => list.renderedActions.filter(item => list.isItemVisible(item));

  assert.equal(list.renderedActions.length, 4);
  assert.equal(getfilteredItems().length, 3);

  question.searchMode = "startsWith";
  assert.equal(list.renderedActions.length, 4);
  assert.equal(getfilteredItems().length, 2);
});

QUnit.test("DropdownListModel filter event", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "dropdown",
      name: "question1",
      searchEnabled: true,
      choices: [
        "abcd",
        "abdd",
        "cabd",
        "efab"
      ]
    }]
  });

  survey.onChoicesSearch.add((sender, options) => {
    options.filteredChoices = options.choices.filter(item => item.text.indexOf(options.filter) + options.filter.length == item.text.length);
  });

  const question = <QuestionDropdownModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  dropdownListModel.filterString = "ab";
  const getfilteredItems = () => list.renderedActions.filter(item => list.isItemVisible(item));

  assert.equal(list.renderedActions.length, 4);
  assert.equal(getfilteredItems().length, 1);

  question.searchMode = "startsWith";
  assert.equal(list.renderedActions.length, 4);
  assert.equal(getfilteredItems().length, 1);
});
