import { SurveyModel } from "../src/survey";
import { QuestionTagboxModel } from "../src/question_tagbox";
import { MultiSelectListModel } from "../src/multiSelectListModel";
import { PopupDropdownViewModel } from "../src/popup-dropdown-view-model";
import { _setIsTouch } from "../src/utils/devices";
import { settings } from "../src/settings";
import { QuestionMatrixDynamicModel } from "../src/question_matrixdynamic";
import { ListModel } from "../src/list";
import { PageModel } from "../src/page";
import { IAction } from "../src/actions/action";

export default QUnit.module("Tagbox question");

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

QUnit.test("clearValue", assert => {
  const json = {
    questions: [
      {
        "type": "tagbox",
        "name": "q1",
        "hasOther": true,
        "choices": [{ value: 1, text: "item 1" }, { value: 2, text: "item 2" }, { value: 3, text: "item 3" }]
      }]
  };
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON(json);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;

  assert.equal(question.value.length, 0, "init");
  assert.equal(dropdownListModel.filterString, "", "init");
  assert.equal(dropdownListModel.inputStringRendered, "", "init");
  assert.equal(dropdownListModel.hintString, "", "init");

  question.value = [2];
  dropdownListModel.inputStringRendered = "i";
  assert.equal(question.value.length, 1);
  assert.equal(question.selectedChoices.length, 1);
  assert.equal(dropdownListModel.filterString, "i");
  assert.equal(dropdownListModel.inputStringRendered, "i");
  assert.equal(dropdownListModel.hintString, "item 1");

  question.clearValue();

  assert.equal(question.value.length, 0, "after clear");
  assert.equal(dropdownListModel.filterString, "", "after clear");
  assert.equal(dropdownListModel.inputStringRendered, "", "after clear");
  assert.equal(dropdownListModel.hintString, "", "after clear");
});

QUnit.test("Tagbox DropdownListModel with MultiListModel", (assert) => {
  const survey = new SurveyModel(jsonTagbox);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.ok(question.popupModel.contentComponentData.model instanceof MultiSelectListModel);
});

QUnit.test("DropdownListModel with MultiListModel and defaultValue", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      defaultValue: ["item1"],
      choices: [
        "item1",
        "item2",
        "item3",
        "item4"
      ]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.actions.length, 4);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.isItemSelected(list.actions[0]), true);
  assert.equal(list.isItemSelected(list.actions[3]), false);
  assert.deepEqual(question.value, ["item1"]);

  list.onItemClick(list.actions[0]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 0);
  assert.equal(list.isItemSelected(list.actions[0]), false);
  assert.equal(list.isItemSelected(list.actions[3]), false);
  assert.deepEqual(question.value, []);

  list.onItemClick(list.actions[3]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.isItemSelected(list.actions[0]), false);
  assert.equal(list.isItemSelected(list.actions[3]), true);
  assert.deepEqual(question.value, ["item4"]);

  list.onItemClick(list.actions[0]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 2);
  assert.equal(list.isItemSelected(list.actions[0]), true);
  assert.equal(list.isItemSelected(list.actions[3]), true);
  assert.deepEqual(question.value, ["item4", "item1"]);
});

const jsonTagboxWithSelectAll = {
  questions: [{
    type: "tagbox",
    name: "question1",
    hasOther: "true",
    showNoneItem: "true",
    hasSelectAll: "true",
    choices: [
      "item1",
      "item2",
      "item3",
      "item4",
      "item5"
    ]
  }]
};

QUnit.test("Select SelectAll", (assert) => {
  const survey = new SurveyModel(jsonTagboxWithSelectAll);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.actions.length, 8);
  assert.equal(list.selectedItems.length, 0);

  const selectAllItem = list.actions[0];
  const item1 = list.actions[1];
  assert.equal(selectAllItem.id, "selectall");
  assert.equal(item1.id, "item1");

  list.onItemClick(selectAllItem); // select all items
  assert.equal(question.selectedItems.length, 5, "question.selectedItems.length");
  assert.deepEqual(question.value, ["item1", "item2", "item3", "item4", "item5"], "question.value isSelectAll");
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 6, "list.selectedItems.length");

  list.onItemClick(item1); // 4 elements out of 5 are selected
  assert.equal(question.selectedItems.length, 4, "question.selectedItems.length");
  assert.deepEqual(question.value, ["item2", "item3", "item4", "item5"], "question.value");
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 4, "list.selectedItems.length");

  list.onItemClick(selectAllItem); // select all items
  assert.equal(question.selectedItems.length, 5, "question.selectedItems.length");
  assert.deepEqual(question.value, ["item1", "item2", "item3", "item4", "item5"], "question.value  isSelectAll");
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 6, "list.selectedItems.length");

  list.onItemClick(selectAllItem); // reset all items
  assert.equal(question.selectedItems.length, 0, "question.selectedItems.length");
  assert.deepEqual(question.value, [], "question.value");
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 0, "list.selectedItems.length");
});

QUnit.test("Select None item", (assert) => {
  const survey = new SurveyModel(jsonTagboxWithSelectAll);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.actions.length, 8);
  assert.equal(list.selectedItems.length, 0);

  const item1 = list.actions[1];
  const noneItem = list.actions[6];
  assert.equal(item1.id, "item1");
  assert.equal(noneItem.id, "none");

  list.onItemClick(item1); // 1 element out of 5 is selected
  assert.equal(question.selectedItems.length, 1, "item1 selected");
  assert.deepEqual(question.value, ["item1"], "item1 selected");
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1, "item1 selected");

  list.onItemClick(noneItem); // reset all items
  assert.equal(question.selectedItems.length, 1, "none selected");
  assert.deepEqual(question.value, ["none"], "none selected");
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1, "none selected");

  list.onItemClick(item1); // 1 element out of 5 is selected
  assert.equal(question.selectedItems.length, 1, "item1 selected");
  assert.deepEqual(question.value, ["item1"], "item1 selected");
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1, "item1 selected");
});

QUnit.test("Tagbox hideSelectedItems property default false", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      defaultValue: ["item1"],
      choices: [
        "item1",
        "item2",
        "item3",
        "item4"
      ]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  assert.equal(list.actions.length, 4);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.actions[0].visible, true);
  assert.equal(list.actions[3].visible, true);
  assert.deepEqual(question.value, ["item1"]);

  list.onItemClick(list.actions[0]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 0);
  assert.equal(list.actions[0].visible, true);
  assert.equal(list.actions[3].visible, true);
  assert.deepEqual(question.value, []);

  list.onItemClick(list.actions[3]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.actions[0].visible, true);
  assert.equal(list.actions[3].visible, true);
  assert.deepEqual(question.value, ["item4"]);

  list.onItemClick(list.actions[0]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 2);
  assert.equal(list.actions[0].visible, true);
  assert.equal(list.actions[3].visible, true);
  assert.deepEqual(question.value, ["item4", "item1"]);
});

QUnit.test("Tagbox hideSelectedItems property set is true", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      defaultValue: ["item1"],
      choices: [
        "item1",
        "item2",
        "item3",
        "item4"
      ]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  question.hideSelectedItems = true;

  assert.equal(list.actions.length, 4);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.actions[0].visible, false);
  assert.equal(list.actions[3].visible, true);
  assert.deepEqual(question.value, ["item1"]);

  list.onItemClick(list.actions[0]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 0);
  assert.equal(list.actions[0].visible, true);
  assert.equal(list.actions[3].visible, true);
  assert.deepEqual(question.value, []);

  list.onItemClick(list.actions[3]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.actions[0].visible, true);
  assert.equal(list.actions[3].visible, false);
  assert.deepEqual(question.value, ["item4"]);

  list.onItemClick(list.actions[0]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 2);
  assert.equal(list.actions[0].visible, false);
  assert.equal(list.actions[3].visible, false);
  assert.deepEqual(question.value, ["item4", "item1"]);
});

function getNumberArray(skip = 1, count = 25, filter = ""): Array<any> {
  const result: Array<any> = [];
  let index = skip;
  while ((skip + result.length) < (skip + count)) {
    if (!!filter) {
      if (index.toString().toLowerCase().indexOf(filter.toLocaleLowerCase()) !== -1) {
        result.push({ value: index, text: "DisplayText_" + index });
      }
    }
    else {
      result.push({ value: index, text: "DisplayText_" + index });
    }
    index++;
  }
  return result;
}

const onChoicesLazyLoadCallbackTimeOut = 5;
const callbackTimeOutDelta = 1;

const callback = (_, opt) => {
  const total = opt.filter == "888" ? 17 : 70;
  setTimeout(() => {
    if (opt.skip + opt.take < total) {
      opt.setItems(getNumberArray(opt.skip + 1, opt.take, opt.filter), total);
    } else {
      opt.setItems(getNumberArray(opt.skip + 1, total - opt.skip, opt.filter), total);
    }
  }, onChoicesLazyLoadCallbackTimeOut);
};

QUnit.test("lazy loading: several loading", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "choicesLazyLoadEnabled": true,
      "choicesLazyLoadPageSize": 30
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 30);
    assert.equal(question.choices[0].value, 1);
    assert.equal(question.choices[29].value, 30);

    question.dropdownListModel["updateQuestionChoices"]();
    setTimeout(() => {
      assert.equal(question.choices.length, 60);
      assert.equal(question.choices[0].value, 1);
      assert.equal(question.choices[59].value, 60);

      question.dropdownListModel["updateQuestionChoices"]();
      setTimeout(() => {
        assert.equal(question.choices.length, 70);
        assert.equal(question.choices[0].value, 1);
        assert.equal(question.choices[69].value, 70);

        done3();
      }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});

QUnit.test("lazy loading + change filter string + dropdownSearchDelay ", assert => {
  const newValueDebouncedInputValue = 2 * onChoicesLazyLoadCallbackTimeOut;
  const oldValueDebouncedInputValue = settings.dropdownSearchDelay;
  settings.dropdownSearchDelay = newValueDebouncedInputValue;
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const done4 = assert.async();

  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "choicesLazyLoadEnabled": true
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);

  question.dropdownListModel.popupModel.show();
  assert.equal(question.choices.length, 0, "show popup before request");

  setTimeout(() => {
    assert.equal(question.choices.length, 25, "show popup after request");
    assert.equal(question.choices[0].value, 1, "show popup after request");

    question.dropdownListModel.filterString = "2";
    setTimeout(() => {
      assert.equal(question.choices.length, 25, "filter is 2");
      assert.equal(question.choices[0].value, 1, "filter is 2");

      question.dropdownListModel.filterString = "22";
      setTimeout(() => {
        assert.equal(question.choices.length, 25, "filter is 22 before request");
        assert.equal(question.choices[0].value, 1, "filter is 22 before request");

        setTimeout(() => {
          assert.equal(question.choices.length, 25, "filter is 22 after request");
          assert.equal(question.choices[0].value, 22, "filter is 22 after request");

          settings.dropdownSearchDelay = oldValueDebouncedInputValue;
          done4();
        }, onChoicesLazyLoadCallbackTimeOut + newValueDebouncedInputValue);
        done3();
      }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});

QUnit.test("storeOthersAsComment is false", assert => {
  const json = {
    "storeOthersAsComment": false,
    "elements": [
      {
        "type": "tagbox",
        "name": "q1",
        "showOtherItem": true
      }
    ],
    "showQuestionNumbers": false
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.visibleChoices.length, 1);
  assert.equal(question.visibleChoices[0].id, "other");
  assert.equal(question.visibleChoices[0].value, "other");

  question.renderedValue = ["other"];
  assert.deepEqual(question.value, ["other"], "#1");
  question.comment = "text1";
  assert.deepEqual(question.value, ["text1"], "#2");
  assert.deepEqual(survey.data, { q1: ["text1"] }, "#3");
});

QUnit.test("lazy loading: storeOthersAsComment is false", assert => {
  const done = assert.async();
  const json = {
    "storeOthersAsComment": false,
    "elements": [
      {
        "type": "tagbox",
        "name": "q1",
        "choicesLazyLoadEnabled": true,
        "choicesLazyLoadPageSize": 75,
        "showOtherItem": true
      }
    ],
    "showQuestionNumbers": false
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.visibleChoices.length, 1);
  assert.equal(question.visibleChoices[0].id, "other");
  assert.equal(question.visibleChoices[0].value, "other");

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.visibleChoices.length, 71);
    assert.equal(question.visibleChoices[0].value, 1);
    assert.equal(question.visibleChoices[69].value, 70);
    assert.equal(question.visibleChoices[70].id, "other");
    assert.equal(question.visibleChoices[70].value, "other");

    question.renderedValue = ["other"];
    assert.deepEqual(question.value, ["other"], "#1");
    question.comment = "text1";
    assert.deepEqual(question.value, ["text1"], "#2");
    assert.deepEqual(survey.data, { q1: ["text1"] }, "#3");
    done();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});

QUnit.test("lazy loading: A value disappears when open tagbox popup again", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "choicesLazyLoadEnabled": true,
      "choicesLazyLoadPageSize": 30
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const list: MultiSelectListModel = question.dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 30);
    assert.equal(question.choices[0].value, 1);
    assert.equal(question.choices[29].value, 30);

    list.onItemClick(list.renderedActions[28]);
    assert.deepEqual(question.value, [29]);
    assert.equal(question.selectedItems.length, 1);
    assert.equal(question.selectedItems[0].value, 29);

    question.dropdownListModel["updateQuestionChoices"]();
    setTimeout(() => {
      assert.equal(question.choices.length, 60);
      assert.equal(question.choices[0].value, 1);
      assert.equal(question.choices[59].value, 60);

      list.onItemClick(list.renderedActions[55]);
      assert.deepEqual(question.value, [29, 56]);
      assert.equal(question.selectedItems.length, 2, "selected items length 1");
      assert.equal(question.selectedItems[0].value, 29, "selected items[0] value 29 1");
      assert.equal(question.selectedItems[0].text, "DisplayText_29", "selected items[0] text 29 1");
      assert.equal(question.selectedItems[1].value, 56, "selected items[1] value 56 1");
      assert.equal(question.selectedItems[1].text, "DisplayText_56", "selected items[1] value 56 1");

      question.dropdownListModel.popupModel.hide();
      assert.deepEqual(question.value, [29, 56]);
      assert.equal(question.selectedItems.length, 2, "selected items length 2");
      assert.equal(question.selectedItems[0].value, 29, "selected items[0] value 29 2");
      assert.equal(question.selectedItems[0].text, "DisplayText_29", "selected items[0] text 29 2");
      assert.equal(question.selectedItems[1].value, 56, "selected items[1] value 56 2");
      assert.equal(question.selectedItems[1].text, "DisplayText_56", "selected items[1] value 56 2");

      question.dropdownListModel.popupModel.show();
      assert.deepEqual(question.value, [29, 56]);
      assert.equal(question.selectedItems.length, 2, "selected items length 3");
      assert.equal(question.selectedItems[0].value, 29, "selected items[0] value 29 3");
      assert.equal(question.selectedItems[0].text, "DisplayText_29", "selected items[0] text 29 3");
      assert.equal(question.selectedItems[1].value, 56, "selected items[1] value 56 3");
      assert.equal(question.selectedItems[1].text, "DisplayText_56", "selected items[1] value 56 3");

      setTimeout(() => {
        assert.deepEqual(question.value, [29, 56]);
        assert.equal(question.selectedItems.length, 2, "selected items length 4");
        assert.equal(question.selectedItems[0].value, 29, "selected items[0] value 29 4");
        assert.equal(question.selectedItems[0].text, "DisplayText_29", "selected items[0] text 29 4");
        assert.equal(question.selectedItems[1].value, 56, "selected items[1] value 56 4");
        assert.equal(question.selectedItems[1].text, "DisplayText_56", "selected items[1] value 56 4");
        assert.equal(question.choices.length, 30);
        assert.equal(question.choices[0].value, 1);
        assert.equal(question.choices[29].value, 30);

        done3();
      }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});

function getObjectArray(skip = 1, count = 25): Array<{ value: any, text: string }> {
  const result: Array<{ value: any, text: string }> = [];
  for (let index = skip; index < (skip + count); index++) {
    result.push({ value: index, text: "DisplayText_" + index });
  }
  return result;
}

QUnit.test("lazy loading + onGetChoiceDisplayValue: defaultValue", assert => {
  const done = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "defaultValue": [52, 55],
      "choicesLazyLoadEnabled": true
    },
    {
      "type": "text",
      "name": "q2",
      "title": "{q1}"
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add((sender, options) => {
    const total = 55;
    setTimeout(() => {
      if (options.skip + options.take < total) {
        options.setItems(getObjectArray(options.skip + 1, options.take), total);
      } else {
        options.setItems(getObjectArray(options.skip + 1, total - options.skip), total);
      }
    }, onChoicesLazyLoadCallbackTimeOut);
  });
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item)));
    }
  });

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const questionTitle = <QuestionTagboxModel>survey.getAllQuestions()[1];
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);
  assert.deepEqual(question.value, [52, 55]);
  assert.equal(question.selectedItems.length, 2, "question.selectedItems.length");
  assert.equal(question.selectedItems[0].value, 52, "question.selectedItems[0] value");
  assert.equal(question.selectedItems[0].text, "DisplayText_52", "question.selectedItems[0] text");
  assert.equal(question.selectedItems[1].value, 55, "question.selectedItems[1] value");
  assert.equal(question.selectedItems[1].text, "DisplayText_55", "question.selectedItems[1] text");
  assert.equal(questionTitle.locTitle.textOrHtml, "DisplayText_52, DisplayText_55", "display text is correct");

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 25);
    assert.equal(question.choices[0].value, 1);
    assert.equal(question.choices[24].value, 25);
    assert.deepEqual(question.value, [52, 55]);
    assert.equal(question.selectedItems.length, 2, "question.selectedItems.length");
    assert.equal(question.selectedItems[0].value, 52, "question.selectedItems[0] value");
    assert.equal(question.selectedItems[0].text, "DisplayText_52", "question.selectedItems[0] text");
    assert.equal(question.selectedItems[1].value, 55, "question.selectedItems[1] value");
    assert.equal(question.selectedItems[1].text, "DisplayText_55", "question.selectedItems[1] text");
    done();
  }, onChoicesLazyLoadCallbackTimeOut);
});

QUnit.test("lazy loading + onGetChoiceDisplayValue: defaultValue is object", assert => {
  const done = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "defaultValue": [{ id: 52 }, { id: 55 }],
      "choicesLazyLoadEnabled": true
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add((sender, options) => {
    const total = 55;
    setTimeout(() => {
      if (options.skip + options.take < total) {
        options.setItems(getObjectArray(options.skip + 1, options.take), total);
      } else {
        options.setItems(getObjectArray(options.skip + 1, total - options.skip), total);
      }
    }, onChoicesLazyLoadCallbackTimeOut);
  });
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item.id)));
    }
  });

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);
  assert.deepEqual(question.value, [{ id: 52 }, { id: 55 }]);
  assert.equal(question.selectedItems.length, 2, "question.selectedItems.length");
  assert.equal(question.selectedItems[0].value.id, 52, "question.selectedItems[0] value");
  assert.equal(question.selectedItems[0].text, "DisplayText_52", "question.selectedItems[0] text");
  assert.equal(question.selectedItems[1].value.id, 55, "question.selectedItems[1] value");
  assert.equal(question.selectedItems[1].text, "DisplayText_55", "question.selectedItems[1] text");

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 25);
    assert.equal(question.choices[0].value, 1);
    assert.equal(question.choices[24].value, 25);
    assert.deepEqual(question.value, [{ id: 52 }, { id: 55 }]);
    assert.equal(question.selectedItems.length, 2, "question.selectedItems.length");
    assert.equal(question.selectedItems[0].value.id, 52, "question.selectedItems[0] value");
    assert.equal(question.selectedItems[0].text, "DisplayText_52", "question.selectedItems[0] text");
    assert.equal(question.selectedItems[1].value.id, 55, "question.selectedItems[1] value");
    assert.equal(question.selectedItems[1].text, "DisplayText_55", "question.selectedItems[1] text");
    done();
  }, onChoicesLazyLoadCallbackTimeOut);
});

QUnit.test("lazy loading + onGetChoiceDisplayValue: set survey data", assert => {
  const done = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "choicesLazyLoadEnabled": true
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add((sender, options) => {
    const total = 55;
    setTimeout(() => {
      if (options.skip + options.take < total) {
        options.setItems(getObjectArray(options.skip + 1, options.take), total);
      } else {
        options.setItems(getObjectArray(options.skip + 1, total - options.skip), total);
      }
    }, onChoicesLazyLoadCallbackTimeOut);
  });
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item)));
    }
  });
  survey.data = { "q1": [52, 55] };

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);
  assert.deepEqual(question.value, [52, 55]);
  assert.equal(question.selectedItems.length, 2, "question.selectedItems.length");
  assert.equal(question.selectedItems[0].value, 52, "question.selectedItems[0] value");
  assert.equal(question.selectedItems[0].text, "DisplayText_52", "question.selectedItems[0] text");
  assert.equal(question.selectedItems[1].value, 55, "question.selectedItems[1] value");
  assert.equal(question.selectedItems[1].text, "DisplayText_55", "question.selectedItems[1] text");

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 25);
    assert.equal(question.choices[0].value, 1);
    assert.equal(question.choices[24].value, 25);
    assert.deepEqual(question.value, [52, 55]);
    assert.equal(question.selectedItems.length, 2, "question.selectedItems.length");
    assert.equal(question.selectedItems[0].value, 52, "question.selectedItems[0] value");
    assert.equal(question.selectedItems[0].text, "DisplayText_52", "question.selectedItems[0] text");
    assert.equal(question.selectedItems[1].value, 55, "question.selectedItems[1] value");
    assert.equal(question.selectedItems[1].text, "DisplayText_55", "question.selectedItems[1] text");

    question.renderedValue = [52, 55, 10];
    assert.deepEqual(question.value, [52, 55, 10]);
    assert.equal(question.selectedItems.length, 3, "question.selectedItems.length");
    assert.equal(question.selectedItems[0].value, 52, "question.selectedItems[0] value");
    assert.equal(question.selectedItems[0].text, "DisplayText_52", "question.selectedItems[0] text");
    assert.equal(question.selectedItems[1].value, 55, "question.selectedItems[1] value");
    assert.equal(question.selectedItems[1].text, "DisplayText_55", "question.selectedItems[1] text");
    assert.equal(question.selectedItems[2].value, 10, "question.selectedItems[2] value");
    assert.equal(question.selectedItems[2].text, "DisplayText_10", "question.selectedItems[2] text");
    done();
  }, onChoicesLazyLoadCallbackTimeOut);
});

QUnit.test("lazy loading data is lost: defaultValue", assert => {
  const done = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "defaultValue": [52, 55],
      "choicesLazyLoadEnabled": true
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add((sender, options) => {
    const total = 55;
    setTimeout(() => {
      if (options.skip + options.take < total) {
        options.setItems(getObjectArray(options.skip + 1, options.take), total);
      } else {
        options.setItems(getObjectArray(options.skip + 1, total - options.skip), total);
      }
    }, onChoicesLazyLoadCallbackTimeOut);
  });
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item)));
    }
  });

  assert.deepEqual(survey.data, { "q1": [52, 55] }, "before doComplete before item load");
  survey.doComplete();
  assert.deepEqual(survey.data, { "q1": [52, 55] }, "after doComplete before item load");

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);
  assert.deepEqual(question.value, [52, 55]);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 25);
    assert.deepEqual(question.value, [52, 55]);

    assert.deepEqual(survey.data, { "q1": [52, 55] }, "before doComplete after item load");
    survey.doComplete();
    assert.deepEqual(survey.data, { "q1": [52, 55] }, "after doComplete after item load");

    done();
  }, onChoicesLazyLoadCallbackTimeOut);
});

QUnit.test("lazy loading data is lost: set survey data", assert => {
  const done = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "choicesLazyLoadEnabled": true
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add((sender, options) => {
    const total = 55;
    setTimeout(() => {
      if (options.skip + options.take < total) {
        options.setItems(getObjectArray(options.skip + 1, options.take), total);
      } else {
        options.setItems(getObjectArray(options.skip + 1, total - options.skip), total);
      }
    }, onChoicesLazyLoadCallbackTimeOut);
  });
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item)));
    }
  });
  survey.data = { "q1": [52, 55] };
  assert.deepEqual(survey.data, { "q1": [52, 55] }, "before doComplete before item load");
  survey.doComplete();
  assert.deepEqual(survey.data, { "q1": [52, 55] }, "after doComplete before item load");

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.choices.length, 0);
  assert.deepEqual(question.value, [52, 55]);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 25);
    assert.deepEqual(question.value, [52, 55]);

    question.renderedValue = [52, 55, 10];
    assert.deepEqual(question.value, [52, 55, 10]);
    assert.deepEqual(survey.data, { "q1": [52, 55, 10] }, "before doComplete after item load");
    survey.doComplete();
    assert.deepEqual(survey.data, { "q1": [52, 55, 10] }, "after doComplete after item load");

    done();
  }, onChoicesLazyLoadCallbackTimeOut);
});

QUnit.test("lazy loading + change filter string", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "choicesLazyLoadEnabled": true
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const itemsSettings = question.dropdownListModel["itemsSettings"];

  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);
  assert.equal(itemsSettings.skip, 0);
  assert.equal(itemsSettings.take, 25);
  assert.equal(itemsSettings.totalCount, 0);
  assert.equal(itemsSettings.items.length, 0);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 25);
    assert.equal(question.choices[0].value, 1);
    assert.equal(question.choices[24].value, 25);
    assert.equal(itemsSettings.skip, 25);
    assert.equal(itemsSettings.take, 25);
    assert.equal(itemsSettings.totalCount, 70);
    assert.equal(itemsSettings.items.length, 25);

    question.dropdownListModel.filterString = "2";
    setTimeout(() => {
      assert.equal(question.choices.length, 25);
      assert.equal(question.choices[0].value, 2);
      assert.equal(question.choices[24].value, 123);
      assert.equal(itemsSettings.skip, 25);
      assert.equal(itemsSettings.take, 25);
      assert.equal(itemsSettings.totalCount, 70);
      assert.equal(itemsSettings.items.length, 25);

      question.dropdownListModel.filterString = "22";
      setTimeout(() => {
        assert.equal(question.choices.length, 25);
        assert.equal(question.choices[0].value, 22);
        assert.equal(question.choices[24].value, 1223);
        assert.equal(itemsSettings.skip, 25);
        assert.equal(itemsSettings.take, 25);
        assert.equal(itemsSettings.totalCount, 70);
        assert.equal(itemsSettings.items.length, 25);

        done3();
      }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});

QUnit.test("lazy loading + change listModel filter string", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "choicesLazyLoadEnabled": true
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const itemsSettings = question.dropdownListModel["itemsSettings"];
  const listModel: MultiSelectListModel = question.dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);
  assert.equal(itemsSettings.skip, 0);
  assert.equal(itemsSettings.take, 25);
  assert.equal(itemsSettings.totalCount, 0);
  assert.equal(itemsSettings.items.length, 0);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.equal(question.choices.length, 25);
    assert.equal(question.choices[0].value, 1);
    assert.equal(question.choices[24].value, 25);
    assert.equal(itemsSettings.skip, 25);
    assert.equal(itemsSettings.take, 25);
    assert.equal(itemsSettings.totalCount, 70);
    assert.equal(itemsSettings.items.length, 25);

    listModel.filterString = "2";
    setTimeout(() => {
      assert.equal(question.choices.length, 25);
      assert.equal(question.choices[0].value, 2);
      assert.equal(question.choices[24].value, 123);
      assert.equal(itemsSettings.skip, 25);
      assert.equal(itemsSettings.take, 25);
      assert.equal(itemsSettings.totalCount, 70);
      assert.equal(itemsSettings.items.length, 25);

      listModel.filterString = "22";
      setTimeout(() => {
        assert.equal(question.choices.length, 25);
        assert.equal(question.choices[0].value, 22);
        assert.equal(question.choices[24].value, 1223);
        assert.equal(itemsSettings.skip, 25);
        assert.equal(itemsSettings.take, 25);
        assert.equal(itemsSettings.totalCount, 70);
        assert.equal(itemsSettings.items.length, 25);

        done3();
      }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});

QUnit.test("Check tagbox in mobile mode with closeOnSelect true", assert => {
  _setIsTouch(true);
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "closeOnSelect": false,
      "choices": ["Item 1", "Item 2", "Item 3"]
    }]
  };
  const survey = new SurveyModel(json);
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popupModel = dropdownListModel.popupModel;
  const popupViewModel = new PopupDropdownViewModel(popupModel);
  const doneAction = popupViewModel.footerToolbar.actions[1];
  const cancelAction = popupViewModel.footerToolbar.actions[0];
  const listModel = dropdownListModel["listModel"];
  const actions = listModel.actions;

  popupModel.show();
  assert.notOk(doneAction.enabled);
  listModel.onItemClick(actions[0]);
  assert.ok(doneAction.enabled);
  doneAction.action();
  assert.deepEqual(question.value, ["Item 1"]);

  popupModel.show();
  assert.notOk(doneAction.enabled);
  listModel.onItemClick(actions[1]);
  assert.ok(doneAction.enabled);
  assert.deepEqual(question.value, ["Item 1", "Item 2"]);
  cancelAction.action();
  assert.deepEqual(question.value, ["Item 1"]);

  popupModel.show();
  assert.notOk(doneAction.enabled);
  listModel.onItemClick(actions[0]);
  assert.ok(doneAction.enabled);
  doneAction.action();
  assert.deepEqual(question.value, []);
  _setIsTouch(false);
});
QUnit.test("Tagbox focusFirstInputSelector mobile && hideSelectedItems", (assert) => {
  _setIsTouch(true);
  const survey = new SurveyModel({
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "hideSelectedItems": false,
      "choices": ["Item 1", "Item 2", "Item 3"]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const popupModel = dropdownListModel.popupModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  popupModel.isVisible = true;
  assert.equal(popupModel.focusFirstInputSelector, ".sv-list__item", "value = undefined && isTouch = true && hideSelectedItems = false");

  list.onItemClick(list.actions[0]);
  popupModel.isVisible = false;

  popupModel.isVisible = true;
  assert.equal(popupModel.focusFirstInputSelector, ".sv-list__item--selected", "isTouch=true && value = 'item1' && hideSelectedItems = false");

  list.onItemClick(list.actions[0]);
  question.hideSelectedItems = true;

  popupModel.isVisible = false;

  popupModel.isVisible = true;
  assert.equal(popupModel.focusFirstInputSelector, ".sv-list__item", "value = undefined && isTouch = true && hideSelectedItems = true");

  list.onItemClick(list.actions[0]);
  popupModel.isVisible = false;

  popupModel.isVisible = true;
  assert.equal(popupModel.focusFirstInputSelector, ".sv-list__item", "isTouch=true && value = 'item1' && hideSelectedItems = true");
  _setIsTouch(false);
});

QUnit.test("Tagbox closeOnSelect", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      hasOther: "true",
      choices: [
        "item1",
        "item2",
        "item3",
        "item4",
        "item5"
      ]
    },
    {
      type: "tagbox",
      name: "question2",
      hasOther: "true",
      closeOnSelect: true,
      choices: [
        "item1",
        "item2",
        "item3",
        "item4",
        "item5"
      ]
    },
    {
      type: "tagbox",
      name: "question3",
      hasOther: "true",
      closeOnSelect: "false",
      choices: [
        "item1",
        "item2",
        "item3",
        "item4",
        "item5"
      ]
    },
    {
      type: "tagbox",
      name: "question4",
      hasOther: "true",
      closeOnSelect: "true",
      choices: [
        "item1",
        "item2",
        "item3",
        "item4",
        "item5"
      ]
    }]
  });
  const question1 = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const question2 = <QuestionTagboxModel>survey.getAllQuestions()[1];
  const question3 = <QuestionTagboxModel>survey.getAllQuestions()[2];
  const question4 = <QuestionTagboxModel>survey.getAllQuestions()[3];
  assert.equal(question1.closeOnSelect, false);
  assert.equal(question2.closeOnSelect, true);
  assert.equal(question3.closeOnSelect, false);
  assert.equal(question4.closeOnSelect, true);
});

QUnit.test("Tagbox settings.tagboxCloseOnSelect", (assert) => {
  settings.tagboxCloseOnSelect = true;
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      choices: [
        "item1",
        "item2",
        "item3",
        "item4",
        "item5"
      ]
    },
    {
      type: "tagbox",
      name: "question2",
      choices: [
        "item1",
        "item2",
        "item3",
        "item4",
        "item5"
      ]
    }]
  });
  const question1 = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const question2 = <QuestionTagboxModel>survey.getAllQuestions()[1];
  assert.equal(question1.closeOnSelect, true);
  assert.equal(question2.closeOnSelect, true);
  settings.tagboxCloseOnSelect = false;
});

QUnit.test("maxSelectedChoices in tagbox", function (assert) {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      maxSelectedChoices: 2,
      defaultValue: ["item1"],
      choices: [
        "item1",
        "item2",
        "item3",
        "item4"
      ]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;

  assert.equal(list.actions.length, 4);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.actions[0].enabled, true);
  assert.equal(list.actions[1].enabled, true);
  assert.equal(list.actions[2].enabled, true);
  assert.equal(list.actions[3].enabled, true);
  assert.deepEqual(question.value, ["item1"]);

  list.onItemClick(list.actions[1]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 2);
  assert.equal(list.actions[0].enabled, true);
  assert.equal(list.actions[1].enabled, true);
  assert.equal(list.actions[2].enabled, false);
  assert.equal(list.actions[3].enabled, false);
  assert.deepEqual(question.value, ["item1", "item2"]);

  list.onItemClick(list.actions[3]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 2);
  assert.equal(list.actions[0].enabled, true);
  assert.equal(list.actions[1].enabled, true);
  assert.equal(list.actions[2].enabled, false);
  assert.equal(list.actions[3].enabled, false);
  assert.deepEqual(question.value, ["item1", "item2"]);

  list.onItemClick(list.actions[1]);
  assert.equal(list.actions.filter(item => list.isItemSelected(item)).length, 1);
  assert.equal(list.actions[0].enabled, true);
  assert.equal(list.actions[1].enabled, true);
  assert.equal(list.actions[2].enabled, true);
  assert.equal(list.actions[3].enabled, true);
  assert.deepEqual(question.value, ["item1"]);
});

QUnit.test("reset filterstring after select item", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      defaultValue: ["item1"],
      choices: [
        "item1",
        "item2",
        "item3",
        "item4"
      ]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  assert.ok(dropdownListModel.popupModel.contentComponentData.model instanceof MultiSelectListModel);

  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(list.actions.length, 4);
  assert.equal(list.renderedActions.filter(item => list.isItemVisible(item)).length, 4);
  assert.equal(dropdownListModel.inputStringRendered, "");
  assert.equal(dropdownListModel.filterString, "");

  dropdownListModel.inputStringRendered = "1";
  assert.equal(list.renderedActions.filter(item => list.isItemVisible(item)).length, 1);
  assert.equal(dropdownListModel.inputStringRendered, "1");
  assert.equal(dropdownListModel.filterString, "1");

  list.onItemClick(list.renderedActions.filter(item => list.isItemVisible(item))[0]);
  assert.equal(dropdownListModel.inputStringRendered, "");
  assert.equal(dropdownListModel.filterString, "");
});

QUnit.test("TagBox displays a value which doesn't exist in a list of choices #6293", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      choices: ["Item 1", "Item 2", "Item 3"]
    }]
  });
  survey.data = {
    question1: ["value1"]
  };
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.value.length, 1);
  assert.equal(question.selectedChoices.length, 0);
  assert.deepEqual(survey.data, {
    "question1": ["value1"],
  });
});

QUnit.test("TagBox displays a value as Other if it doesn't exist in a list of choices", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      showOtherItem: true,
      choices: ["Item 1", "Item 2", "Item 3"]
    }]
  });
  survey.data = {
    question1: ["value1"]
  };
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.value.length, 1);
  assert.equal(question.selectedChoices.length, 1);
  assert.equal(question.selectedChoices[0].id, "other");
  assert.deepEqual(survey.data, {
    question1: ["value1"],
    "question1-Comment": "value1"
  });
});
QUnit.test("TagBox displays a value if list of choices is empty", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      choices: ["Item 1", "Item 2", "Item 3"]
    }]
  });
  survey.data = {
    question1: ["Item 1"]
  };
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.value.length, 1);
  assert.equal(question.value[0], "Item 1");
  assert.equal(question.selectedItems.length, 1);
  assert.equal(question.selectedItems[0].id, "Item 1");

  question.setPropertyValue("visibleChoices", []);
  assert.equal(question.value.length, 1);
  assert.equal(question.value[0], "Item 1");
  assert.equal(question.selectedItems.length, 0);
});
QUnit.test("TagBox readOnlyText property should be reactive, Bug#6830", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "q1",
      placeholder: {
        default: "en-sel",
        de: "de-sel"
      },
      choices: ["Item 1", "Item 2", "Item 3"]
    }]
  });
  const q = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(q.readOnlyText, "en-sel", "Empty en");
  assert.equal(q.dropdownListModel.filterStringPlaceholder, "en-sel", "dropdownlist en");
  q.value = ["Item 1"];
  assert.equal(q.readOnlyText, "Item 1", "has value");
  q.clearValue();
  assert.equal(q.readOnlyText, "en-sel", "Empty en, #2");
  survey.locale = "de";
  assert.equal(q.readOnlyText, "de-sel", "Empty de");
  assert.equal(q.dropdownListModel.filterStringPlaceholder, "de-sel", "dropdownlist de");
  survey.locale = "";
  assert.equal(q.readOnlyText, "en-sel", "Empty en, #3");
  assert.equal(q.dropdownListModel.filterStringPlaceholder, "en-sel", "dropdownlist en, #3");
});
QUnit.test("question.showClearButton", assert => {
  const json = {
    questions: [
      {
        "type": "tagbox",
        "name": "q1",
        "optionsCaption": "New optionsCaption",
        "choices": [
          "Ford",
          "Vauxhall",
          "Volkswagen"
        ]
      }]
  };
  const survey = new SurveyModel(json);
  const q = <QuestionTagboxModel>survey.getQuestionByName("q1");
  assert.equal(q.showClearButton, false, "question is empty");
  q.value = "Ford";
  assert.equal(q.showClearButton, true, "question is not empty");
  q.allowClear = false;
  assert.equal(q.showClearButton, false, "allowClear is false");
  q.allowClear = true;
  survey.setDesignMode(true);
  assert.equal(q.showClearButton, true, "Creator V2");
});
QUnit.test("lazy loading: maxSelectedChoices limit stops working if you clear the value", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "defaultValue": [1],
      "choicesLazyLoadEnabled": true,
      "choicesLazyLoadPageSize": 30,
      "maxSelectedChoices": 2
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.deepEqual(question.value, [1]);
    assert.equal(question.choices.length, 30);
    for (let index = 0; index < list.actions.length - 1; index++) {
      assert.ok(list.actions[index].enabled, list.actions[index].id + " is enabled before clear");
    }

    list.onItemClick(list.actions[1]);
    assert.deepEqual(question.value, [1, 2]);
    assert.ok(list.actions[0].enabled, "action 1 is enabled before clear");
    assert.ok(list.actions[1].enabled, "action 2 is enabled before clear");
    for (let index = 2; index < list.actions.length - 1; index++) {
      assert.notOk(list.actions[index].enabled, list.actions[index].id + " is disabled before clear");
    }
    question.dropdownListModel.popupModel.hide();
    question.dropdownListModel.onClear({
      keyCode: 0,
      preventDefault: () => { },
      stopPropagation: () => { }
    });

    question.dropdownListModel.popupModel.show();
    setTimeout(() => {
      assert.deepEqual(question.value, [], "question value is empty");
      list.onItemClick(list.actions[0]);
      assert.deepEqual(question.value, [1], "question value is [1]");

      for (let index = 0; index < list.actions.length - 1; index++) {
        assert.ok(list.actions[index].enabled, list.actions[index].id + " is enabled after clear");
      }

      list.onItemClick(list.actions[1]);
      assert.deepEqual(question.value, [1, 2], "question value is [1, 2] after clear");
      assert.ok(list.actions[0].enabled, "action 1 is enabled after clear");
      assert.ok(list.actions[1].enabled, "action 2 is enabled after clear");
      for (let index = 2; index < list.actions.length - 1; index++) {
        assert.notOk(list.actions[index].enabled, list.actions[index].id + " is disabled after clear");
      }

      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});
QUnit.test("lazy loading & maxSelectedChoices: Items remains disabled when unselecting choices within a drop-down list", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "defaultValue": [1],
      "choicesLazyLoadEnabled": true,
      "choicesLazyLoadPageSize": 30,
      "maxSelectedChoices": 2
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.equal(question.choicesLazyLoadEnabled, true);
  assert.equal(question.choices.length, 0);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    assert.deepEqual(question.value, [1]);
    assert.equal(question.choices.length, 30);
    for (let index = 0; index < list.actions.length - 1; index++) {
      assert.ok(list.actions[index].enabled, list.actions[index].id + " is enabled before unselecting choice");
    }

    list.onItemClick(list.actions[1]);
    assert.deepEqual(question.value, [1, 2]);
    assert.ok(list.actions[0].enabled, "action 1 is enabled before unselecting choice");
    assert.ok(list.actions[1].enabled, "action 2 is enabled before unselecting choice");
    for (let index = 2; index < list.actions.length - 1; index++) {
      assert.notOk(list.actions[index].enabled, list.actions[index].id + " is disabled before unselecting choice");
    }
    question.dropdownListModel.popupModel.hide;
    question.dropdownListModel.popupModel.show();
    setTimeout(() => {
      assert.deepEqual(question.value, [1, 2], "question value is [1, 2]");
      assert.ok(list.actions[0].enabled, "action 1 is enabled");
      assert.ok(list.actions[1].enabled, "action 2 is enabled");
      for (let index = 2; index < list.actions.length - 1; index++) {
        assert.notOk(list.actions[index].enabled, list.actions[index].id + " is disabled");
      }

      list.onItemClick(list.actions[1]);
      assert.deepEqual(question.value, [1], "question value is [1]");
      for (let index = 0; index < list.actions.length - 1; index++) {
        assert.ok(list.actions[index].enabled, list.actions[index].id + " is enabled after unselecting choice");
      }

      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);

    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});
QUnit.test("Can clear tagbox value", assert => {
  const json = {
    elements: [{
      "type": "matrixdynamic",
      "name": "detailTable",
      "columns": [
        {
          "name": "showDetails",
        }
      ],
      "detailElements": [
        {
          "type": "tagbox",
          "name": "detailTypes",
          "visibleIf": "{row.showDetails} = 'true'",
          "clearIfInvisible": "onHidden",
          "requiredIf": "{row.showDetails} = 'true'",
          "choices": ["a", "b"]
        }
      ],
      "detailPanelMode": "underRow",
      "cellType": "text"
    }
    ]
  };
  const survey = new SurveyModel(json);

  const matrix = <QuestionMatrixDynamicModel>survey.getAllQuestions()[0];
  const row = matrix.visibleRows[0];
  row.showDetailPanel();
  const question = row.getQuestionByName("detailTypes");
  assert.ok(question, "There is no exception");
});

QUnit.test("Check readOnly tagbox with markdown", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "tagbox",
        name: "q1",
        choices: [
          "item1",
          "item2",
          "item3",
          "item4"
        ]
      }
    ]
  });
  survey.onGetQuestionDisplayValue.add((sender, options) => {
    const strs = options.displayValue.split(",");
    options.displayValue = strs.join(" | ");
  });
  const q1 = survey.getQuestionByName("q1") as QuestionTagboxModel;

  survey.mode = "display";
  survey.data = { q1: ["item1", "item2", "item3"] };

  assert.equal(q1.displayValue, "item1 |  item2 |  item3");
  assert.equal(q1.locReadOnlyText.renderedHtml, "item1 |  item2 |  item3");
});

QUnit.test("Tagbox searchmode filter options", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      searchEnabled: true,
      searchMode: "startsWith",
      choices: [
        "abc",
        "abd",
        "cab",
        "efg"
      ]
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.searchMode, "startsWith");
  const dropdownListModel = question.dropdownListModel;
  const list: ListModel = dropdownListModel.popupModel.contentComponentData.model as ListModel;

  dropdownListModel.filterString = "ab";
  const getfilteredItems = () => list.renderedActions.filter(item => list.isItemVisible(item));

  assert.equal(list.renderedActions.length, 4);
  assert.equal(getfilteredItems().length, 2);

  question.searchMode = "contains";
  assert.equal(list.renderedActions.length, 4);
  assert.equal(getfilteredItems().length, 3);
});

QUnit.test("Tagbox readonly", (assert) => {
  const survey = new SurveyModel({
    questions: [{
      type: "tagbox",
      name: "question1",
      readOnly: true,
      choices: [
        "1",
        "2",
        "3"
      ],
      "showSelectAllItem": true
    }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.equal(question.readOnlyText, "Select...");
});
QUnit.test("Create tag box in the code, dropdownListModel instance", (assert) => {
  const survey = new SurveyModel();
  const question = new QuestionTagboxModel("q1");
  const page = new PageModel("page1");
  page.addQuestion(question);
  assert.notOk(question["dropdownListModelValue"], "It is not created yet");
  survey.addPage(page);
  assert.notOk(question["dropdownListModelValue"], "It is not created yet");
  assert.ok(question.dropdownListModel, "It is created on demand");
});
QUnit.test("Create tag box from json, dropdownListModel instance", (assert) => {
  const survey = new SurveyModel({
    elements: [{ type: "tagbox", name: "q1" }]
  });
  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  assert.ok(question.dropdownListModel, "It is created");
});

QUnit.test("Prevoiusly selected options disappear", (assert) => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const done4 = assert.async();
  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "defaultValue": [5],
      "choicesLazyLoadEnabled": true,
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item)));
    }
  });

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.deepEqual(question.value, [5], "question value");
  assert.equal(question.selectedItems.length, 1);
  assert.equal(question.selectedChoices.length, 1);

  question.dropdownListModel.popupModel.show();
  setTimeout(() => {
    dropdownListModel.inputStringRendered = "777";
    assert.deepEqual(question.value, [5], "question value");
    assert.equal(question.selectedItems.length, 1);
    assert.equal(question.selectedChoices.length, 1);

    setTimeout(() => {
      list.onItemClick(list.actions[0]);
      assert.deepEqual(question.value, [5, 777], "question value");
      assert.equal(question.selectedItems.length, 2);
      assert.equal(question.selectedChoices.length, 2);

      setTimeout(() => {
        dropdownListModel.inputStringRendered = "888";
        assert.deepEqual(question.value, [5, 777], "question value");
        assert.equal(question.selectedItems.length, 2);
        assert.equal(question.selectedChoices.length, 2);

        setTimeout(() => {
          assert.deepEqual(question.value, [5, 777], "question value");
          assert.equal(question.selectedItems.length, 2);
          assert.equal(question.selectedChoices.length, 2);

          done4();
        }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
        done3();
      }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});

QUnit.test("The new selected value is replaced with the the default value while searching #8751", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();

  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "closeOnSelect": true,
      "choicesLazyLoadEnabled": true,
      "defaultValue": [222],
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item)));
    }
  });

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.deepEqual(question.value, [222], "question value #1");
  assert.equal(question.selectedChoices.length, 1);

  dropdownListModel.onClear(null);
  assert.deepEqual(question.value, [], "question value #2");
  assert.equal(question.selectedChoices.length, 0);

  setTimeout(() => {
    dropdownListModel.inputStringRendered = "999";
    assert.deepEqual(question.value, [], "question value #3");
    assert.equal(question.selectedChoices.length, 0);

    setTimeout(() => {
      list.onItemClick(list.actions[0]);
      assert.deepEqual(question.value, [999], "question value #4");
      assert.equal(question.selectedChoices.length, 1);
      assert.equal(question.selectedChoices[0].value, 999, "question.selectedChoices[0] value #1");

      setTimeout(() => {
        assert.deepEqual(question.value, [999], "question value #5");
        assert.equal(question.selectedChoices.length, 1);
        assert.equal(question.selectedChoices[0].value, 999, "question.selectedChoices[0] value #2");

        done3();
      }, callbackTimeOutDelta);
      done2();
    }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
    done1();
  }, callbackTimeOutDelta);
});

QUnit.test("The new selected value is always replaced with the the first selected value while searching #8751", assert => {
  const done1 = assert.async();
  const done2 = assert.async();
  const done3 = assert.async();
  const done4 = assert.async();
  const done5 = assert.async();

  const json = {
    questions: [{
      "type": "tagbox",
      "name": "q1",
      "closeOnSelect": true,
      "choicesLazyLoadEnabled": true,
    }]
  };
  const survey = new SurveyModel(json);
  survey.onChoicesLazyLoad.add(callback);
  survey.onGetChoiceDisplayValue.add((sender, options) => {
    if (options.question.name == "q1") {
      options.setItems(options.values.map(item => ("DisplayText_" + item)));
    }
  });

  const question = <QuestionTagboxModel>survey.getAllQuestions()[0];
  const dropdownListModel = question.dropdownListModel;
  const list: MultiSelectListModel = dropdownListModel.popupModel.contentComponentData.model as MultiSelectListModel;
  assert.deepEqual(question.value, [], "question value is empty");
  assert.equal(question.selectedChoices.length, 0);

  dropdownListModel.inputStringRendered = "222";
  setTimeout(() => {
    list.onItemClick(list.actions[0]);
    assert.deepEqual(question.value, [222], "question value #1");
    assert.equal(question.selectedChoices.length, 1);

    setTimeout(() => {
      dropdownListModel.onClear(null);
      assert.deepEqual(question.value, [], "question value #2");
      assert.equal(question.selectedChoices.length, 0);

      setTimeout(() => {
        dropdownListModel.inputStringRendered = "999";
        assert.deepEqual(question.value, [], "question value #3");
        assert.equal(question.selectedChoices.length, 0);

        setTimeout(() => {
          list.onItemClick(list.actions[0]);
          assert.deepEqual(question.value, [999], "question value #4");
          assert.equal(question.selectedChoices.length, 1);
          assert.equal(question.selectedChoices[0].value, 999, "question.selectedChoices[0] value #1");

          setTimeout(() => {
            assert.deepEqual(question.value, [999], "question value #5");
            assert.equal(question.selectedChoices.length, 1);
            assert.equal(question.selectedChoices[0].value, 999, "question.selectedChoices[0] value #2");

            done5();
          }, callbackTimeOutDelta);
          done4();
        }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
        done3();
      }, callbackTimeOutDelta);
      done2();
    }, callbackTimeOutDelta);
    done1();
  }, onChoicesLazyLoadCallbackTimeOut + callbackTimeOutDelta);
});
QUnit.test("rendering actions id", assert => {
  const json = {
    questions: [{
      type: "tagbox",
      name: "q1",
      searchEnabled: false,
      choices: ["Item1", "Item2"]
    }]
  };
  const survey = new SurveyModel(json);
  const question = <QuestionTagboxModel>survey.getQuestionByName("q1");
  assert.notOk(question["dropdownListModelValue"], "It is not created yet");
  question.id = "el1";
  const listModel = question.popupModel.contentComponentData.model as ListModel;
  const actions = listModel.renderedActions;
  assert.equal(actions.length, 2, "two actions");
  assert.equal((<IAction>actions[0]).elementId, "el1i_listItem1", "elementId, action1");
  assert.equal((<IAction>actions[1]).elementId, "el1i_listItem2", "elementId, action2");
  assert.equal((<IAction>actions[0]).disableTabStop, true, "disableTabStop, action1");
  assert.equal((<IAction>actions[1]).disableTabStop, true, "disableTabStop, action2");
});
QUnit.test("List actions disableTabStop", assert => {
  const json = {
    questions: [{
      type: "tagbox",
      name: "q1",
      searchEnabled: true,
      choices: ["Item1", "Item2"]
    }]
  };
  const survey = new SurveyModel(json);
  const question = <QuestionTagboxModel>survey.getQuestionByName("q1");
  question.dropdownListModel.inputStringRendered = "o";
  const listModel = question.popupModel.contentComponentData.model as ListModel;
  const actions = listModel.renderedActions;
  assert.equal(actions.length, 2, "two actions");
  assert.equal((<IAction>actions[0]).disableTabStop, true, "disableTabStop, action1");
  assert.equal((<IAction>actions[1]).disableTabStop, true, "disableTabStop, action2");
});
