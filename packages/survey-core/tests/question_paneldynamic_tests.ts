import { Question, IConditionObject } from "../src/question";
import { PanelModel } from "../src/panel";
import { QuestionPanelDynamicModel } from "../src/question_paneldynamic";
import { SurveyModel } from "../src/survey";
import { CustomWidgetCollection } from "../src/questionCustomWidgets";
import { QuestionMultipleTextModel } from "../src/question_multipletext";
import { QuestionCheckboxModel } from "../src/question_checkbox";
import { QuestionRadiogroupModel } from "../src/question_radiogroup";
import { QuestionTextModel } from "../src/question_text";
import { QuestionMatrixDynamicModel } from "../src/question_matrixdynamic";
import { FunctionFactory } from "../src/functionsfactory";
import { ExpressionValidator } from "../src/validator";
import { QuestionFileModel } from "../src/question_file";
import { QuestionDropdownModel } from "../src/question_dropdown";
import { defaultCss } from "../src/defaultCss/defaultCss";
import { ItemValue } from "../src/itemvalue";
import { settings } from "../src/settings";
import { QuestionMatrixModel } from "../src/question_matrix";
import { AnimationGroup, AnimationTab } from "../src/utils/animation";
import { SurveyElement } from "../src/survey-element";
import { setOldTheme } from "./oldTheme";
import { DynamicPanelValueChangingEvent } from "../src/survey-events-api";
import { AdaptiveActionContainer } from "../src/actions/adaptive-container";
export default QUnit.module("Survey_QuestionPanelDynamic");

QUnit.test("Create panels based on template on setting value", function(
  assert
) {
  var question = new QuestionPanelDynamicModel("q");
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.value = [{}, {}];

  assert.equal(question.panels.length, 2, "There are two panels now");
  var p1 = question.panels[0];
  assert.equal(
    p1.elements.length,
    2,
    "There are two elements in the first panel"
  );
  assert.equal(p1.parentQuestion, question, "parentQuestion is set for inner panel");
});

QUnit.test("Synhronize panelCount and value array length", function(assert) {
  var question = new QuestionPanelDynamicModel("q");
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.panelCount = 3;
  assert.equal(
    question.value.length,
    3,
    "There should be 3 items in the array"
  );
  question.value = [{}, { q1: "val1" }, {}, {}];
  assert.equal(question.panelCount, 4, "panelCount is 4 now");
  question.panelCount = 2;
  assert.equal(
    question.value.length,
    2,
    "There should be 2 items in the array"
  );
  assert.equal(
    question.value[1]["q1"],
    "val1",
    "Do not delete the value in non deleted panels"
  );
});

QUnit.test("Test panel showNavigation readOnly", function (assert) {
  const survey = new SurveyModel({
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "paneldynamic",
            "name": "question1",
            "readOnly": true,
            "templateElements": [
              {
                "type": "text",
                "name": "question2"
              }
            ]
          }
        ]
      }
    ]
  });
  var oldCss = survey.css.root;
  survey.css.root = "sd-root-modern";
  var question = survey.getQuestionByName("question1");
  question.cssClasses.footer = "footer";
  question.panelCount = 0;
  assert.notOk(question.showNavigation, "ne records");
  question.panelCount = 1;
  assert.notOk(question.showNavigation, "one record");
  question.panelCount = 2;
  assert.ok(question.showNavigation, "two records");
  survey.css.root = oldCss;
});

QUnit.test("Dynamic Panel, clearIncorrectValues", function(assert) {
  var question = new QuestionPanelDynamicModel("q");
  (<QuestionRadiogroupModel>(
    question.template.addNewQuestion("radiogroup", "q1")
  )).choices = [1, 2];
  (<QuestionRadiogroupModel>(
    question.template.addNewQuestion("radiogroup", "q2")
  )).choices = [1, 2, 3];

  question.value = [{ q1: 1 }, { q1: "val1" }, { q4: 3, q2: 5 }];
  question.clearIncorrectValues();
  assert.deepEqual(
    question.value,
    [{ q1: 1 }, {}, {}],
    "Remove incorrect values in all panels"
  );
});

QUnit.test(
  "Dynamic Panel, clearIncorrectValues, do not clear other value, Bug#2490",
  function(assert) {
    var question = new QuestionPanelDynamicModel("q");
    (<QuestionRadiogroupModel>(
      question.template.addNewQuestion("radiogroup", "q1")
    )).choices = [1, 2];
    (<QuestionRadiogroupModel>(
      question.template.addNewQuestion("radiogroup", "q2")
    )).choices = [1, 2, 3];
    question.template.questions[1].hasOther = true;

    question.value = [
      { q1: 1, q2: "other", "q2-Comment": "Some Value" },
      { q1: 1, q2: 2, "q3-Comment": "Some Value" },
    ];
    question.clearIncorrectValues();
    assert.deepEqual(
      question.value,
      [
        { q1: 1, q2: "other", "q2-Comment": "Some Value" },
        { q1: 1, q2: 2 },
      ],
      "Remove incorrect values, but do not remove correct comment"
    );
  }
);

QUnit.test(
  "By pass values from question.value into panel values and vice versa",
  function(assert) {
    var question = new QuestionPanelDynamicModel("q");
    question.template.addNewQuestion("text", "q1");
    question.template.addNewQuestion("text", "q2");
    question.value = [
      { q1: "item1_1", q2: "item1_2" },
      { q1: "item2_1", q2: "item2_2" },
    ];

    assert.equal(question.panels.length, 2, "There are two panels now");
    var p1 = question.panels[0];
    var p2 = question.panels[1];
    assert.equal(
      (<Question>p1.questions[1]).value,
      "item1_2",
      "value set correct q2 panel1"
    );
    assert.equal(
      (<Question>p2.questions[0]).value,
      "item2_1",
      "value set correct q1 panel2"
    );
    (<Question>p1.questions[0]).value = "newValue";
    assert.equal(
      question.value[0].q1,
      "newValue",
      "The value from question has been assign successful"
    );
  }
);

QUnit.test("Change values in panels on changing in question.value", function(
  assert
) {
  var question = new QuestionPanelDynamicModel("q");
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.panelCount = 2;
  assert.equal(question.panels.length, 2, "There are two panels now");
  var p1 = question.panels[0];
  var p2 = question.panels[1];
  question.value = [
    { q1: "item1_1", q2: "item1_2" },
    { q1: "item2_1", q2: "item2_2" },
  ];

  assert.equal(
    (<Question>p1.questions[1]).value,
    "item1_2",
    "value set correct q2 panel1"
  );
  assert.equal(
    (<Question>p2.questions[0]).value,
    "item2_1",
    "value set correct q1 panel2"
  );
});

QUnit.test("Load from Json", function(assert) {
  var json = {
    questions: [
      {
        type: "paneldynamic",
        name: "q",
        panelCount: 3,
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  assert.equal(
    survey.jsonErrors == null || survey.jsonErrors.length == 0,
    true,
    "There should not be any errors"
  );
  var question = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  assert.equal(
    question.template.elements.length,
    2,
    "template elements are loaded correctly"
  );
  assert.equal(
    question.template.elements[1].name,
    "q2",
    "the name of the second question is 'q2'"
  );
  assert.equal(question.panelCount, 3, "panelCount loaded correctly");
  assert.equal(question.panels.length, 3, "There are 3 panels now");
  var p1 = question.panels[0];
  var p2 = question.panels[1];
  assert.ok(p1, "the panel has been created");
  assert.equal(
    p1.elements.length,
    2,
    "There are two elements in the copied panel"
  );
  assert.equal(
    p1.questions[1].name,
    "q2",
    "the name of the second question in the copied panel is 'q2'"
  );
  assert.equal(p1.isVisible, true, "the panel is visible");

  question.value = [
    { q1: "item1_1", q2: "item1_2" },
    { q1: "item2_1", q2: "item2_2" },
  ];

  assert.equal(
    (<Question>p1.questions[1]).value,
    "item1_2",
    "value set correct q2 panel1"
  );
  assert.equal(
    (<Question>p2.questions[0]).value,
    "item2_1",
    "value set correct q1 panel2"
  );
  (<Question>p1.questions[0]).value = "newValue";
  assert.equal(question.value[0].q1, "newValue", "The value changed correctly");
});

QUnit.test("Load from Json with nested panel", function(assert) {
  var json = {
    questions: [
      {
        type: "paneldynamic",
        name: "q",
        panelCount: 3,
        templateElements: [
          { type: "text", name: "q1" },
          {
            type: "panel",
            name: "np1",
            elements: [{ type: "text", name: "q2" }],
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var question = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  assert.equal(
    question.template.elements.length,
    2,
    "template elements are loaded correctly"
  );
  assert.equal(
    question.template.elements[1].name,
    "np1",
    "the name of the second element is 'np1'"
  );
  assert.equal(
    (<PanelModel>question.template.elements[1]).elements.length,
    1,
    "there is one element in nested panel 'np1'"
  );
  assert.equal(
    (<PanelModel>question.template.elements[1]).elements[0].name,
    "q2",
    "q2 is an element in the 'np1'"
  );
  assert.equal(question.panelCount, 3, "panelCount loaded correctly");
  assert.equal(question.panels.length, 3, "There are 3 panels now");
  var p1 = question.panels[0];
  var p2 = question.panels[1];
  assert.ok(p1, "the panel has been created");

  assert.equal(p1.elements.length, 2, "template elements are loaded correctly");
  assert.equal(
    p1.elements[1].name,
    "np1",
    "the name of the second element is 'np1'"
  );
  assert.equal(
    (<PanelModel>p1.elements[1]).elements.length,
    1,
    "there is one element in nested panel 'np1'"
  );
  assert.equal(
    (<PanelModel>p1.elements[1]).elements[0].name,
    "q2",
    "q2 is an element in the 'np1'"
  );

  question.value = [
    { q1: "item1_1", q2: "item1_2" },
    { q1: "item2_1", q2: "item2_2" },
  ];

  assert.equal(
    (<Question>p1.questions[1]).value,
    "item1_2",
    "value set correct q2 panel1"
  );
  assert.equal(
    (<Question>p2.questions[0]).value,
    "item2_1",
    "value set correct q1 panel2"
  );
  (<Question>p1.questions[1]).value = "newValue";
  assert.equal(question.value[0].q2, "newValue", "The value changed correctly");
});

QUnit.test("Has errors", function(assert) {
  var question = new QuestionPanelDynamicModel("q");
  question.template.addNewQuestion("text", "q1");
  (<Question>question.template.questions[0]).isRequired = true;
  question.isRequired = true;
  question.value = [];
  assert.equal(question.hasErrors(), true, "main question requires a value");
  question.value = [{ q1: "item1_1" }, {}];
  assert.equal(question.hasErrors(), true, "q1 on the second row is not set");
  question.value = [{ q1: "item1_1" }, { q1: "item2_1" }];
  assert.equal(question.hasErrors(), false, "There is no errors now");
});
QUnit.test("Update panels elements on changing template panel", function(
  assert
) {
  var question = new QuestionPanelDynamicModel("q");
  question.panelCount = 2;
  assert.equal(
    question.panels[0].elements.length,
    0,
    "Initially there is no elements in the copied panel"
  );
  question.template.addNewQuestion("text", "q1");
  assert.equal(
    question.panels[0].elements.length,
    1,
    "Add question into template - add question into copied panels"
  );
  question.template.removeQuestion(question.template.questions[0]);
  assert.equal(
    question.panels[0].elements.length,
    0,
    "Remove question from template - from question from copied panels"
  );
});

QUnit.test("Support visibleIf and panel variable", function(assert) {
  var survey = new SurveyModel();
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  survey.pages[0].addQuestion(question);
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.template.questions[1].visibleIf = "{panel.q1} = 'val'";
  question.panelCount = 2;
  assert.equal(
    question.panels[0].questions[1].visible,
    false,
    "q1 is not 'val'"
  );
  question.value = [{ q1: "val" }];
  assert.equal(question.panels[0].questions[1].visible, true, "q1 is 'val'");
});
QUnit.test("Support visibleIf and panel variable, question.valueName", function(
  assert
) {
  var survey = new SurveyModel();
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  survey.pages[0].addQuestion(question);
  (<Question>question.template.addNewQuestion("text", "q1")).valueName =
    "panelQ1";
  question.template.addNewQuestion("text", "q2");
  question.template.questions[1].visibleIf = "{panel.panelQ1} = 'val'";
  question.panelCount = 2;
  assert.equal(
    question.panels[0].questions[1].visible,
    false,
    "panelQ1 is not 'val'"
  );
  question.value = [{ panelQ1: "val" }];
  assert.equal(
    question.panels[0].questions[1].visible,
    true,
    "panelQ1 is 'val'"
  );
});
QUnit.test("Support panelIndex in visibleIf expression", function(assert) {
  var survey = new SurveyModel();
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  survey.pages[0].addQuestion(question);
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.template.questions[1].visibleIf = "{panelIndex} = 0";
  question.panelCount = 2;
  assert.equal(
    question.panels[0].questions[1].isVisible,
    true,
    "panel index = 0"
  );
  assert.equal(
    question.panels[1].questions[1].isVisible,
    false,
    "panel index != 0"
  );
});

QUnit.test("Text Processing and panel variable, question.valueName", function(
  assert
) {
  var survey = new SurveyModel();
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  survey.pages[0].addQuestion(question);
  (<Question>question.template.addNewQuestion("text", "q1")).valueName =
    "panelQ1";
  question.templateTitle = "Value: {panel.panelQ1}";
  question.panelCount = 2;
  assert.equal(
    question.panels[0].processedTitle,
    "Value: ",
    "panelQ1 is empty"
  );
  question.value = [{ panelQ1: "val" }];
  assert.equal(
    question.panels[0].processedTitle,
    "Value: val",
    "panelQ1 is 'val'"
  );
});

QUnit.test("Text Processing from panel.data", function(assert) {
  var survey = new SurveyModel();
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  question.templateTitle = "Value: {panel.panelQ1}";
  question.panelCount = 2;
  assert.equal(
    question.panels[0].processedTitle,
    "Value: ",
    "panelQ1 is empty"
  );
  question.value = [{ panelQ1: "val" }];
  assert.equal(
    question.panels[0].processedTitle,
    "Value: val",
    "panelQ1 is 'val'"
  );
});

QUnit.test("Text Processing and parent panel variable", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "rootPanel",
        panelCount: 1,
        templateElements: [
          {
            type: "text",
            name: "q1",
            title: "{panel.q2}",
          },
          {
            type: "text",
            name: "q2",
          },
          {
            type: "paneldynamic",
            name: "childPanel",
            panelCount: 1,
            templateElements: [
              {
                type: "text",
                name: "childPanel_q1",
                title: "{parentPanel.q2}",
              },
              {
                type: "text",
                name: "childPanel_q2",
                title: "{parentpanel.q2}",
              },
            ],
          },
        ],
      },
    ],
  });
  var rootPanel = <QuestionPanelDynamicModel>(
    survey.getQuestionByName("rootPanel")
  );
  var q1 = rootPanel.panels[0].getQuestionByName("q1");
  var q2 = rootPanel.panels[0].getQuestionByName("q2");
  var childPanel = <QuestionPanelDynamicModel>(
    rootPanel.panels[0].getQuestionByName("childPanel")
  );
  var childPanel_q1 = childPanel.panels[0].getQuestionByName("childPanel_q1");
  var childPanel_q2 = childPanel.panels[0].getQuestionByName("childPanel_q2");
  q2.value = "q2-title";
  assert.equal(
    q1.locTitle.renderedHtml,
    "q2-title",
    "root processed text correctly"
  );
  assert.equal(
    childPanel_q1.locTitle.renderedHtml,
    "q2-title",
    "child processed text correctly"
  );
  assert.equal(
    childPanel_q2.locTitle.renderedHtml,
    "q2-title",
    "child processed text correctly, lowcase"
  );
});

QUnit.test("Text Processing design mode - https://github.com/surveyjs/survey-creator/issues/2192", function(assert) {
  var survey = new SurveyModel({
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "text",
            "name": "question4"
          },
          {
            "type": "paneldynamic",
            "name": "question1",
            "panelCount": 1,
            "templateElements": [
              {
                "type": "text",
                "name": "question3"
              },
              {
                "type": "text",
                "name": "question2",
                "title": "How are you {panel.question3}? How are you {question4}?"
              }
            ]
          }
        ]
      }
    ]
  });
  survey.setDesignMode(true);
  var panel = <QuestionPanelDynamicModel>(
    survey.getQuestionByName("question1")
  );
  var q2 = panel.panels[0].getQuestionByName("question2");
  assert.equal(
    q2.locTitle.renderedHtml,
    "How are you {panel.question3}? How are you {question4}?",
    "no text processing in design mode"
  );
});

QUnit.test("Initial Text Processing in panel title", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateTitle: "title:{panel.q1}",
        templateElements: [
          {
            type: "text",
            name: "q1",
            title: "{panel.q2}",
          },
        ],
      },
    ],
  });
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  var q1 = panel.panels[0].getQuestionByName("q1");
  assert.equal(
    panel.panels[0].locTitle.renderedHtml,
    "title:",
    "initial text processing"
  );
  q1.value = "q1-title";
  assert.equal(
    panel.panels[0].locTitle.renderedHtml,
    "title:q1-title",
    "Text processing on setting value"
  );
});

QUnit.test("Set panel value, question.valueName", function(assert) {
  var survey = new SurveyModel();
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  survey.pages[0].addQuestion(question);
  (<Question>question.template.addNewQuestion("text", "q1")).valueName =
    "panelQ1";
  question.panelCount = 2;
  assert.equal(
    question.template.questions[0].getValueName(),
    "panelQ1",
    "value name is set"
  );
  assert.equal(
    question.panels[0].questions[0].getValueName(),
    "panelQ1",
    "value name is set for generated panel"
  );
  (<Question>question.panels[0].questions[0]).value = "val1";
  (<Question>question.panels[1].questions[0]).value = "val2";
  assert.deepEqual(
    question.value,
    [{ panelQ1: "val1" }, { panelQ1: "val2" }],
    "set value correctly, use valueName property"
  );
});

QUnit.test("Support panelIndex variable", function(assert) {
  var survey = new SurveyModel();
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  survey.pages[0].addQuestion(question);
  question.templateTitle = "{panelIndex}. test";
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.panelCount = 2;
  assert.equal(
    question.panels[0].processedTitle,
    "1. test",
    "panelIndex = 1 for the first panel"
  );
  assert.equal(
    question.panels[1].processedTitle,
    "2. test",
    "panelIndex = 2 for the second panel"
  );
});
QUnit.test("remove Panel", function(assert) {
  var question = new QuestionPanelDynamicModel("q");
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.panelCount = 3;
  question.value = [{}, { q1: "val1" }, {}];
  question.removePanel(2);
  question.removePanel(0);
  assert.equal(question.value.length, 1, "There should be 1 item in the array");
  assert.equal(question.panelCount, 1, "panelCount is 1 now");
  assert.equal(
    question.value[0]["q1"],
    "val1",
    "Do not delete the value in non deleted panels"
  );
});
QUnit.test("remove Panel Question from Page, Bug#184, in editor repo", function(
  assert
) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  page.addElement(question);
  var q = question.template.addNewQuestion("text", "q1");
  assert.equal(question.template.elements.length, 1, "There is one element");
  page.removeElement(q);
  assert.equal(question.template.elements.length, 0, "Template panel is empty");
});
QUnit.test("Process text in titles", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var survey_q1 = <Question>page.addNewQuestion("text", "q1");
  var survey_q2 = <Question>page.addNewQuestion("text", "q2");
  survey_q2.title = "q1:{q1}";
  var question = new QuestionPanelDynamicModel("q");
  page.addQuestion(question);
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.templateTitle = "q1:{q1}, panel.q1:{panel.q1}";
  (<Question>question.template.questions[1]).title =
    "q1:{q1}, panel.q1:{panel.q1}";
  question.panelCount = 3;
  survey_q1.value = "val_q1";
  question.value = [{}, { q1: "val1" }, {}];
  var panel = question.panels[1];
  var panel_q2 = <Question>panel.questions[1];
  assert.equal(
    survey_q2.locTitle.renderedHtml,
    "q1:val_q1",
    "process root question title correclty"
  );
  assert.equal(
    panel.locTitle.renderedHtml,
    "q1:val_q1, panel.q1:val1",
    "process panel title correctly"
  );
  assert.equal(
    panel_q2.locTitle.renderedHtml,
    "q1:val_q1, panel.q1:val1",
    "process question title correctly"
  );
});
QUnit.test(
  "Process text in titles, variable that has name different from questions, bug#802",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("p");
    var question = new QuestionPanelDynamicModel("q");
    question.template.addNewQuestion("text", "q1");
    page.addQuestion(question);
    question.templateTitle = "panel.q1:{panel.q1}, panel.name:{panel.name}";
    question.value = [{ q1: "q1Value", name: "nameValue" }, {}];
    var panel = question.panels[0];
    assert.equal(
      panel.locTitle.renderedHtml,
      "panel.q1:q1Value, panel.name:nameValue",
      "process panel title correctly"
    );
  }
);
QUnit.test(
  "Process text in titles, get correct value, question.valueName",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("p");
    var survey_qName = <Question>page.addNewQuestion("text", "name");
    var question = new QuestionPanelDynamicModel("q");
    page.addQuestion(question);
    (<Question>question.template.addNewQuestion("text", "q1")).valueName =
      "name";
    question.templateTitle = "survey.name:{name}, panel.name:{panel.name}";
    question.panelCount = 3;
    survey_qName.value = "surveyName";
    question.value = [{}, { name: "panel1Name" }, {}];
    var panel = question.panels[1];
    assert.equal(
      panel.locTitle.renderedHtml,
      "survey.name:surveyName, panel.name:panel1Name",
      "process panel title correctly"
    );
  }
);

QUnit.test("PanelDynamic in design time", function(assert) {
  var survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.addNewPage("p");
  var question = new QuestionPanelDynamicModel("q");
  survey.pages[0].addQuestion(question);
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.panelCount = 2;
  assert.equal(question.panels.length, 1, "Only one panel at design time");
  assert.equal(
    question.panels[0].id,
    question.template.id,
    "The template panel should be shown"
  );
  question.panelCount = 0;
  assert.equal(question.panels.length, 1, "There are still one panel");
  assert.equal(question.currentIndex, -1, "It is -1 in list mode");
  question.renderMode = "progressTop";
  assert.equal(
    question.panels.length,
    1,
    "There are still one panel in non list mode"
  );
  assert.equal(
    question.currentIndex,
    0,
    "It is always zero  in non list mode at design-time"
  );
});
QUnit.test("PanelDynamic in design time + panelCount", function(assert) {
  const survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON({
    elements: [
      { type: "paneldynamic", name: "q1", panelCount: 5 }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  assert.equal(panel.panelCount, 5, "Loading correctly");
  assert.equal(panel.getPropertyValue("panelCount"), 5, "property is set correcty on loading");
  panel.setPropertyValue("panelCount", 7);
  assert.equal(panel.panelCount, 7, "panelCount set correctly");
  panel.panelCount = 3;
  assert.equal(panel.getPropertyValue("panelCount"), 3, "property is set correcty");
});
QUnit.test("PanelDynamic, question no", function(assert) {
  var survey = new SurveyModel();
  survey.showQuestionNumbers = "on";
  var page = survey.addNewPage("p");
  var question1 = <Question>page.addNewQuestion("text", "q1");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  panel.template.addNewQuestion("text", "panelq1");
  panel.template.addNewQuestion("text", "panelq2");
  panel.panelCount = 2;
  var panelQuestion1 = <Question>panel.panels[0].questions[0];
  var panelQuestion2 = <Question>panel.panels[1].questions[1];
  var question2 = <Question>page.addNewQuestion("text", "q2");
  assert.equal(panel.showQuestionNumbers, "off", "off is the default value");
  assert.equal(question1.visibleIndex, 0, "off - question1.visibleIndex");
  assert.equal(panel.visibleIndex, 1, "off - panel.visibleIndex");
  assert.equal(
    panelQuestion1.visibleIndex,
    -1,
    "off - panelQuestion1.visibleIndex"
  );
  assert.equal(
    panelQuestion2.visibleIndex,
    -1,
    "off - panelQuestion2.visibleIndex"
  );
  assert.equal(question2.visibleIndex, 2, "off - question2.visibleIndex");

  panel.showQuestionNumbers = "onPanel";
  assert.equal(question1.visibleIndex, 0, "onPanel - question1.visibleIndex");
  assert.equal(panel.visibleIndex, 1, "onPanel - panel.visibleIndex");
  assert.equal(
    panelQuestion1.visibleIndex,
    0,
    "onPanel - panelQuestion1.visibleIndex"
  );
  assert.equal(
    panelQuestion2.visibleIndex,
    1,
    "onPanel - panelQuestion2.visibleIndex"
  );
  assert.equal(question2.visibleIndex, 2, "onPanel - question2.visibleIndex");
  panel.addPanel();
  var panelQuestion3 = <Question>panel.panels[2].questions[1];
  assert.equal(panelQuestion3.visibleIndex, 1, "onPanel - panelQuestion3.visibleIndex");
  panel.removePanel(2);

  panel.showQuestionNumbers = "onSurvey";
  assert.equal(question1.visibleIndex, 0, "onSurvey - question1.visibleIndex");
  assert.equal(panel.visibleIndex, -1, "onSurvey - panel.visibleIndex");
  assert.equal(
    panelQuestion1.visibleIndex,
    1,
    "onSurvey - panelQuestion1.visibleIndex"
  );
  assert.equal(
    panelQuestion2.visibleIndex,
    4,
    "onSurvey - panelQuestion2.visibleIndex"
  );
  assert.equal(question2.visibleIndex, 5, "onSurvey - question2.visibleIndex");

  panel.addPanel();
  panelQuestion3 = <Question>panel.panels[2].questions[1];
  assert.equal(panelQuestion3.visibleIndex, 4 + 2, "onSurvey - panelQuestion3.visibleIndex");
  panel.removePanel(2);

  panelQuestion1.visible = false;
  assert.equal(
    panelQuestion2.visibleIndex,
    3,
    "onSurvey, panelQuestion1 is invisible - panelQuestion2.visibleIndex"
  );
  assert.equal(
    question2.visibleIndex,
    4,
    "onSurvey, panelQuestion1 is invisible - question2.visibleIndex"
  );
  panel.removePanel(1);
  assert.equal(question2.visibleIndex, 2, "onSurvey, second panel is removed - question2.visibleIndex"
  );
});
QUnit.test("PanelDynamic, showQuestionNumbers onSurvey & design time ", function(assert) {
  const survey = new SurveyModel();
  survey.showQuestionNumbers = "on";
  survey.setDesignMode(true);
  survey.fromJSON({
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "text",
            "name": "q1"
          }
        ]
      },
      {
        "name": "page2",
        "elements": [
          {
            "type": "paneldynamic",
            "name": "panel",
            "templateElements": [
              {
                "type": "text",
                "name": "q2"
              }
            ],
            "showQuestionNumbers": "onSurvey"
          }
        ]
      }
    ]
  });
  const q1 = survey.getQuestionByName("q1");
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const q2 = <Question>panel.templateElements[0];
  assert.equal(q1.no, "1.", "The number should be 1.");
  assert.equal(q2.no, "2.", "The number should be 2.");
});
QUnit.test("PanelDynamic, renderMode", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  panel.template.addNewQuestion("text", "panelq1");
  panel.template.addNewQuestion("text", "panelq2");
  assert.equal(panel.renderMode, "list", "list is a default mode");
  panel.panelCount = 2;
  assert.equal(
    panel.currentIndex,
    -1,
    "list mode doesn't support currentIndex"
  );
  assert.equal(
    panel.currentPanel,
    null,
    "list mode doesn't support currentPanel"
  );
  panel.renderMode = "progressTop";
  assert.equal(panel.currentIndex, 0, "list mode doesn't support currentIndex");
  assert.equal(
    panel.currentPanel.id,
    panel.panels[0].id,
    "list mode doesn't support currentPanel"
  );
  assert.equal(
    panel.isPrevButtonVisible,
    false,
    "currentIndex = 0, prevButton is hidden"
  );
  assert.equal(
    panel.isNextButtonVisible,
    true,
    "currentIndex = 0, nextButton is visible"
  );
  panel.currentIndex++;
  assert.equal(
    panel.isPrevButtonVisible,
    true,
    "currentIndex = 1, prevButton is visible"
  );
  assert.equal(
    panel.isNextButtonVisible,
    false,
    "currentIndex = 1, nextButton is hidden"
  );
  panel.addPanel();
  assert.equal(panel.currentIndex, 2, "The last added panel is current");
  panel.removePanel(2);
  assert.equal(panel.currentIndex, 1, "The last  panel is removed");
});
QUnit.test("PanelDynamic, renderMode is not list + hasError", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  (<Question>(
    panel.template.addNewQuestion("text", "panelq1")
  )).isRequired = true;
  panel.template.addNewQuestion("text", "panelq2");
  panel.panelCount = 2;
  panel.renderMode = "progressTop";
  panel.currentIndex = 1;
  assert.equal(panel.currentIndex, 1, "go to the second panel");
  panel.hasErrors(true, { focusOnFirstError: true });
  assert.equal(panel.currentIndex, 0, "it should show the first panel where the error happened");
});
QUnit.test("PanelDynamic, keyName + hasError + getAllErrors", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  panel.template.addNewQuestion("text", "panelq1");
  panel.template.addNewQuestion("text", "panelq2");
  panel.panelCount = 2;
  panel.keyName = "panelq1";
  assert.equal(panel.hasErrors(true), false, "There is no errors");
  (<Question>panel.panels[0].questions[0]).value = "val1";
  assert.equal(
    panel.hasErrors(true),
    false,
    "There is no errors panel[0].q1 = val1"
  );
  (<Question>panel.panels[1].questions[0]).value = "val1";
  assert.equal(
    panel.hasErrors(true),
    true,
    "There is the error panel[0].q1 = val1 and panel[1].q1 = val1"
  );
  assert.equal(
    (<Question>panel.panels[1].questions[0]).hasVisibleErrors,
    true,
    "We have visible errors now"
  );
  assert.equal(
    panel.errors.length,
    0,
    "There is no errors in the panel question itself"
  );
  assert.equal(
    panel.getAllErrors().length,
    1,
    "There is errors in question inside the panel"
  );
  (<Question>panel.panels[1].questions[0]).value = "val2";
  assert.equal(
    panel.hasErrors(true),
    false,
    "There is no error panel[0].q1 = val1 and panel[1].q1 = val2"
  );
  assert.equal(
    (<Question>panel.panels[1].questions[0]).hasVisibleErrors,
    false,
    "We do not have visible errors"
  );
  assert.equal(
    panel.getAllErrors().length,
    0,
    "There is no errors in question inside the panel"
  );
});
QUnit.test("PanelDynamic, keyName + hasError, Bug #1820", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "relatives",
        templateTitle: "Information about: {panel.relativeType}",
        keyName: "relativeType",
        templateElements: [
          {
            name: "relativeType",
            type: "dropdown",
            choices: [
              "father",
              "mother",
              "brother",
              "sister",
              "son",
              "daughter",
            ],
          },
        ],
        panelCount: 2,
      },
    ],
  });
  survey.setValue("relatives", [
    { relativeType: "father" },
    { relativeType: "father" },
  ]);
  assert.equal(
    survey.currentPage.hasErrors(true),
    true,
    "There are two 'father' in keyName property"
  );
});

QUnit.test("assign customWidgets to questions in dynamic panel", function(
  assert
) {
  CustomWidgetCollection.Instance.clear();
  CustomWidgetCollection.Instance.addCustomWidget({
    name: "customWidget",
    isFit: (question) => {
      return question.name == "panelq2";
    },
  });
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  panel.template.addNewQuestion("text", "panelq1");
  panel.template.addNewQuestion("text", "panelq2");
  panel.panelCount = 2;
  assert.equal(
    panel.panels[0].questions[0].customWidget,
    null,
    "panel0, there is no custom widget for this question"
  );
  assert.equal(
    panel.panels[0].questions[1].customWidget.name,
    "customWidget",
    "panel0, has the custom widget"
  );
  assert.equal(
    panel.panels[1].questions[0].customWidget,
    null,
    "panel1, there is no custom widget for this question"
  );
  assert.equal(
    panel.panels[1].questions[1].customWidget.name,
    "customWidget",
    "panel1, has the custom widget"
  );
  CustomWidgetCollection.Instance.clear();
});

QUnit.test("Auto generate names", function(assert) {
  var survey = new SurveyModel();
  var page1 = survey.addNewPage();
  var panel = <QuestionPanelDynamicModel>page1.addNewQuestion("paneldynamic");
  var q2 = panel.template.addNewQuestion("text");
  var p1 = panel.template.addNewPanel();
  var q3 = page1.addNewQuestion("text");

  assert.equal(p1.name, "panel1", "the first name for panel is panel1");
  assert.equal(
    q2.name,
    "question2",
    "the second name for question is question2"
  );
  assert.equal(
    q3.name,
    "question3",
    "the third name for question is question3"
  );
});

QUnit.test(
  "Set data for loaded panel after clearing the survey data, bug#784",
  function(assert) {
    var json = {
      questions: [
        {
          type: "paneldynamic",
          name: "q",
          panelCount: 1,
          templateElements: [
            { type: "text", name: "q1" },
            { type: "text", name: "q2" },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    //clear data
    survey.data = {};
    var dymamicPanel = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
    var q1 = <Question>dymamicPanel.panels[0].questions[0];
    q1.value = "test";
    assert.equal(q1.value, "test", "question keep the value");
    assert.deepEqual(
      survey.data,
      { q: [{ q1: "test" }] },
      "value set into survey"
    );
  }
);

QUnit.test("Set panel count to 0, Editor bug#228", function(assert) {
  var json = {
    questions: [
      {
        type: "paneldynamic",
        name: "q",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  survey.setDesignMode(true);
  var dymamicPanel = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  assert.equal(dymamicPanel.panelCount, 0, "The default panel count is 0");
  dymamicPanel.panelCount = 1;
  assert.equal(dymamicPanel.panelCount, 1, "There is one panel");
  dymamicPanel.panelCount = 0;
  assert.equal(dymamicPanel.panelCount, 0, "There is no panels");
});

QUnit.test("PanelDynamic, question.getTitleLocation(), bug#800", function(
  assert
) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  panel.template.addNewQuestion("text", "panelq1");

  panel.panelCount = 2;
  var p = panel.panels[0];
  var q = <Question>p.questions[0];

  assert.equal(q.getTitleLocation(), "top", "it is top by default");

  page.questionTitleLocation = "left";

  assert.equal(
    p.getQuestionTitleLocation(),
    "left",
    "it is left based on survey.questionTitleLocation"
  );
  assert.equal(
    q.getTitleLocation(),
    "left",
    "it is left based on survey.questionTitleLocation"
  );
  panel.templateTitleLocation = "bottom";
  assert.equal(
    q.getTitleLocation(),
    "bottom",
    "it is bottom, based on templateTitleLocation"
  );
});

QUnit.test("PanelDynamic, canAddPanel/canRemovePanel", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );

  assert.equal(panel.canAddPanel, true, "By default you can add panel");
  assert.equal(panel.canRemovePanel, false, "There is no panels");
  panel.panelCount = 2;
  assert.equal(panel.canRemovePanel, true, "You can remove now");
  survey.setDesignMode(true);
  assert.equal(panel.canAddPanel, false, "You can't add in design mode");
  assert.equal(panel.canRemovePanel, false, "You can't delete in design mode");
  survey.setDesignMode(false);
  assert.equal(panel.canAddPanel, true, "You can add in run-time mode");
  assert.equal(panel.canRemovePanel, true, "You can delete in run-time mode");
  panel.allowAddPanel = false;
  panel.allowRemovePanel = false;
  assert.equal(panel.canAddPanel, false, "allowAddPanel = false");
  assert.equal(panel.canRemovePanel, false, "allowRemovePanel = false");
});

QUnit.test(
  "PanelDynamic, survey.clearInvisibleValues='onHidden', bug#806",
  function(assert) {
    var survey = new SurveyModel();
    survey.clearInvisibleValues = "onHidden";
    var page = survey.addNewPage("p");
    var panel = <QuestionPanelDynamicModel>(
      page.addNewQuestion("paneldynamic", "panel")
    );
    var q1 = <Question>panel.template.addNewQuestion("text", "panelq1");
    var q2 = <Question>panel.template.addNewQuestion("text", "panelq2");
    q2.visibleIf = "{panel.panelq1} = 'a'";

    panel.panelCount = 2;
    var p = panel.panels[0];
    var rq1 = <Question>p.questions[0];
    var rq2 = <Question>p.questions[1];

    assert.equal(rq2.isVisible, false, "the question is invisible");
    rq1.value = "a";
    assert.equal(rq2.isVisible, true, "the question is visible");
    rq2.value = "b";
    assert.equal(rq2.isEmpty(), false, "the value is set");
    rq1.value = "c";
    assert.equal(rq2.isVisible, false, "the question is invisible again");
    assert.equal(rq2.isEmpty(), true, "the question is empty");
  }
);

QUnit.test(
  "PanelDynamic, survey.clearInvisibleValues='onComplete', bug#806",
  function(assert) {
    var survey = new SurveyModel();
    survey.clearInvisibleValues = "onComplete";
    var page = survey.addNewPage("p");
    var panel = <QuestionPanelDynamicModel>(
      page.addNewQuestion("paneldynamic", "panel")
    );
    var q1 = <Question>panel.template.addNewQuestion("text", "panelq1");

    panel.panelCount = 2;
    var p = panel.panels[0];
    var rq1 = <Question>p.questions[0];

    rq1.value = "a";
    rq1.visible = false;
    assert.deepEqual(
      survey.data,
      { panel: [{ panelq1: "a" }, {}] },
      "The value is here"
    );
    survey.doComplete();
    assert.deepEqual(survey.data, { panel: [{}, {}] }, "The value is gone");
  }
);

QUnit.test("PanelDynamic, survey.onDanamicPanelAdd/Remove", function(assert) {
  var survey = new SurveyModel();
  survey.clearInvisibleValues = "onComplete";
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  var q1 = <Question>panel.template.addNewQuestion("text", "panelq1");
  var questionName = "";
  var panelAddedCounter = 0;
  var panelRemovedCounter = 0;
  var panelIndex = -1;
  survey.onDynamicPanelAdded.add(function(survey, options) {
    questionName = options.question.name;
    assert.ok(
      options.panel.getQuestionByName("panelq1"),
      "Panel added correctly"
    );
    panelAddedCounter++;
  });
  survey.onDynamicPanelRemoved.add(function(survey, options) {
    questionName = options.question.name;
    panelRemovedCounter++;
    panelIndex = options.panelIndex;
  });
  panel.panelCount = 2;
  assert.equal(panelAddedCounter, 0, "Nothing was added");
  assert.equal(panelRemovedCounter, 0, "Nothing was removed");
  panel.addPanel();
  assert.equal(panelAddedCounter, 1, "one panel was added");
  assert.equal(
    questionName,
    "panel",
    "the question was passed correctly on added"
  );
  questionName = "";
  panel.removePanel(1);
  assert.equal(panelAddedCounter, 1, "one panel was removed");
  assert.equal(
    questionName,
    "panel",
    "the question was passed correctly on removed"
  );
  assert.equal(panelIndex, 1, "the removed panel index is correct");
});
QUnit.test("PanelDynamic, survey.onDanamicPanelRemoving", function(assert) {
  var survey = new SurveyModel();
  survey.clearInvisibleValues = "onComplete";
  var page = survey.addNewPage("p");
  var panel = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "panel")
  );
  panel.template.addNewQuestion("text", "panelq1");
  var questionName = "";
  var panelRemovedCounter = 0;
  var panelIndex = -1;
  survey.onDynamicPanelRemoving.add(function(survey, options) {
    questionName = options.question.name;
    panelRemovedCounter++;
    panelIndex = options.panelIndex;
    options.allow = panelIndex != 1;
  });
  panel.panelCount = 3;
  panel.removePanel(0);
  assert.equal(questionName, "panel", "the question was passed correctly on removed, #1");
  assert.equal(panelRemovedCounter, 1, "one panel was removed, #1");
  assert.equal(panel.panelCount, 2, "panel count is 2, #1");
  assert.equal(panelIndex, 0, "the removed panel index is correct, #1");
  panel.removePanel(1);
  assert.equal(questionName, "panel", "the question was passed correctly on removed, #2");
  assert.equal(panelRemovedCounter, 2, "one panel was removed, #2");
  assert.equal(panel.panelCount, 2, "panel count is still 2, #2");
  assert.equal(panelIndex, 1, "the removed panel index is correct, #2");
});
QUnit.test("PanelDynamic defaultValue in questions", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "question1",
        templateElements: [
          {
            type: "text",
            name: "question2",
            defaultValue: "100",
          },
          {
            type: "dropdown",
            name: "question3",
            defaultValue: "item2",
            choices: ["item1", "item2", "item3"],
          },
        ],
      },
    ],
  });
  var question = <QuestionPanelDynamicModel>(
    survey.getQuestionByName("question1")
  );
  question.panelCount = 2;
  var textQuestion = <Question>(
    question.panels[1].getQuestionByName("question2")
  );
  var dropDownQuestion = <Question>(
    question.panels[1].getQuestionByName("question3")
  );
  assert.equal(textQuestion.value, "100", "The default value to text is set");
  assert.equal(
    dropDownQuestion.value,
    "item2",
    "The default value to dropdown is set"
  );
});

QUnit.test("Two PanelDynamic questions bound to the same value", function(
  assert
) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("p");
  var q1 = new QuestionPanelDynamicModel("q1");
  q1.valueName = "panel";
  q1.template.addNewQuestion("text", "t1");
  var q2 = new QuestionPanelDynamicModel("q2");
  q2.valueName = "panel";
  q2.template.addNewQuestion("text", "t1");
  q2.template.addNewQuestion("text", "t2");
  page.addElement(q1);
  page.addElement(q2);

  q1.panelCount = 1;
  assert.equal(q2.panelCount, 1, "By default there are two panels in panel2");
  q1.addPanel();
  assert.equal(q2.panelCount, 2, "One panel was added");
  q1.removePanel(1);
  assert.equal(q1.panelCount, 1, "q1: One panel was removed");
  assert.equal(q2.panelCount, 1, "q2: One panel was removed");
});
QUnit.test(
  "PanelDynamic vs MatrixDynamic questions bound to the same value on different pages, bug#T464",
  function(assert) {
    var survey = new SurveyModel();
    var page1 = survey.addNewPage("p1");
    var page2 = survey.addNewPage("p2");
    var matrix = new QuestionMatrixDynamicModel("q1");
    matrix.valueName = "val";
    matrix.addColumn("t1");
    matrix.rowCount = 1;
    var panel = new QuestionPanelDynamicModel("q2");
    panel.valueName = "val";
    panel.template.addNewQuestion("text", "t1");
    panel.template.addNewQuestion("text", "t2");
    page1.addElement(matrix);
    page2.addElement(panel);

    matrix.value = [{ t1: "test" }];
    assert.equal(
      panel.panelCount,
      1,
      "By default there are two panels in panel2"
    );
    matrix.value = [{ t1: "test" }, { t1: "test2" }];
    assert.equal(panel.panelCount, 2, "One row and one panel were added");
    matrix.removeRow(1);
    assert.equal(matrix.rowCount, 1, "matrix: One row was removed");
    assert.equal(panel.panelCount, 1, "panel: One panel was removed");
  }
);

QUnit.test(
  "PanelDynamic vs MatrixDynamic add/remove items, bug#T2130",
  function(assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          rowCount: 1,
          name: "employer_names",
          valueName: "employers",
          columns: [
            {
              name: "RowId",
              cellType: "expression",
              expression: "{rowIndex}",
            },
            {
              name: "name",
              isRequired: true,
              cellType: "text",
            },
          ],
        },
        {
          type: "paneldynamic",
          renderMode: "list",
          allowAddPanel: false,
          allowRemovePanel: false,
          name: "arrray_employer_info",
          valueName: "employers",
          templateTitle: "{panel.name}",
          templateElements: [
            {
              type: "text",
              name: "address",
            },
            {
              type: "text",
              name: "abn",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var matrix = <QuestionMatrixDynamicModel>(
      survey.getQuestionByName("employer_names")
    );
    var panel = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("arrray_employer_info")
    );
    matrix.visibleRows[0].cells[1].question.value = 1;
    matrix.addRow();
    matrix.visibleRows[1].cells[1].question.value = 2;
    matrix.addRow();
    matrix.visibleRows[2].cells[1].question.value = 3;
    assert.equal(panel.panels.length, 3, "There are 3 panels");
    assert.equal(
      panel.panels[0].locTitle.renderedHtml,
      "1",
      "The first panel title is correct"
    );
    assert.equal(
      panel.panels[1].locTitle.renderedHtml,
      "2",
      "The second panel title is correct"
    );
    assert.equal(
      panel.panels[2].locTitle.renderedHtml,
      "3",
      "The third panel title is correct"
    );
    panel.panels[0].getQuestionByName("address").value = "address: row1";
    panel.panels[2].getQuestionByName("address").value = "address: row3";
    matrix.removeRow(1);
    assert.equal(panel.panels.length, 2, "There are two panels now");
    assert.equal(
      panel.panels[0].locTitle.renderedHtml,
      "1",
      "The first panel title is still correct"
    );
    assert.equal(
      panel.panels[1].locTitle.renderedHtml,
      "3",
      "The second panel title is 3 now"
    );
    assert.deepEqual(
      survey.data,
      {
        employers: [
          { RowId: 1, name: 1, address: "address: row1" },
          { RowId: 2, name: 3, address: "address: row3" },
        ],
      },
      "The value is correct"
    );
  }
);
QUnit.test("PanelDynamic vs MatrixDynamic onValueChanged, bug#9130", function(assert) {
  const json = {
    elements: [
      {
        type: "matrixdynamic",
        rowCount: 1,
        name: "employer_names",
        valueName: "employers",
        columns: [
          {
            name: "name",
            isRequired: true,
            cellType: "text",
          },
        ],
      },
      {
        type: "paneldynamic",
        renderMode: "list",
        allowAddPanel: false,
        allowRemovePanel: false,
        name: "arrray_employer_info",
        valueName: "employers",
        templateTitle: "{panel.name}",
        templateElements: [
          {
            type: "text",
            name: "address",
          },
          {
            type: "text",
            name: "abn",
          },
          {
            type: "text",
            name: "name",
          }
        ],
      },
    ],
  };
  const survey = new SurveyModel(json);
  const logs = new Array<any>();
  survey.onValueChanged.add((sender, options) => {
    logs.push({ name: options.name, questionName: options.question.name });
  });
  const matrix = <QuestionMatrixDynamicModel>(survey.getQuestionByName("employer_names"));
  const panel = <QuestionPanelDynamicModel>(survey.getQuestionByName("arrray_employer_info"));
  matrix.visibleRows[0].getQuestionByName("name").value = "def";
  panel.panels[0].getQuestionByName("name").value = "abc";
  assert.deepEqual(logs, [
    { name: "employers", questionName: "employer_names" },
    { name: "employers", questionName: "arrray_employer_info" }
  ], "check logs, #1");
});

function updateObjsQuestions(objs: Array<any>): void {
  for (var i = 0; i < objs.length; i++) {
    objs[i].question = objs[i].question.name;
    if(!!objs[i].context) {
      objs[i].context = objs[i].context.name;
    }
  }
}
QUnit.test("panelDynamic.addConditionObjectsByContext", function(assert) {
  var objs = [];
  var panel = new QuestionPanelDynamicModel("qPanel");
  panel.title = "Question Panel";
  var q1 = panel.template.addNewQuestion("text", "q1");
  var question = new QuestionMultipleTextModel("q2");
  question.title = "Question 2";
  question.addItem("item1");
  question.addItem("item2");
  panel.template.addQuestion(question);
  panel.addConditionObjectsByContext(objs, null);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel[0].q1", text: "Question Panel[0].q1", question: "q1" },
      { name: "qPanel[0].q2.item1", text: "Question Panel[0].Question 2.item1", question: "q2" },
      { name: "qPanel[0].q2.item2", text: "Question Panel[0].Question 2.item2", question: "q2" }
    ],
    "addConditionObjectsByContext work correctly for panel dynamic"
  );
  objs = [];
  panel.addConditionObjectsByContext(objs, q1);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel[0].q1", text: "Question Panel[0].q1", question: "q1" },
      { name: "qPanel[0].q2.item1", text: "Question Panel[0].Question 2.item1", question: "q2" },
      { name: "qPanel[0].q2.item2", text: "Question Panel[0].Question 2.item2", question: "q2" },
      {
        name: "panel.q2.item1",
        text: "panel.Question 2.item1",
        question: "q2",
        context: "qPanel"
      },
      {
        name: "panel.q2.item2",
        text: "panel.Question 2.item2",
        question: "q2",
        context: "qPanel"
      },
    ],
    "addConditionObjectsByContext work correctly for panel dynamic with context"
  );
  objs = [];
  panel.addConditionObjectsByContext(objs, true);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel[0].q1", text: "Question Panel[0].q1", question: "q1" },
      { name: "qPanel[0].q2.item1", text: "Question Panel[0].Question 2.item1", question: "q2" },
      { name: "qPanel[0].q2.item2", text: "Question Panel[0].Question 2.item2", question: "q2" },
      { name: "qPanel.panel.q1", text: "Question Panel.panel.q1", question: "q1", context: "qPanel" },
      {
        name: "qPanel.panel.q2.item1",
        text: "Question Panel.panel.Question 2.item1",
        question: "q2", context: "qPanel"
      },
      {
        name: "qPanel.panel.q2.item2",
        text: "Question Panel.panel.Question 2.item2",
        question: "q2", context: "qPanel"
      },
    ],
    "addConditionObjectsByContext work correctly for panel dynamic with context equals true"
  );
});
QUnit.test("panelDynamic.addConditionObjectsByContext && question validator, Bug#8914", function(assert) {
  const objs = [];
  const panel = new QuestionPanelDynamicModel("qPanel");
  const q1 = panel.template.addNewQuestion("text", "q1");
  q1.validators.push(new ExpressionValidator());
  panel.template.addNewQuestion("text", "q2");
  panel.addConditionObjectsByContext(objs, q1.validators[0]);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel[0].q1", text: "qPanel[0].q1", question: "q1" },
      { name: "qPanel[0].q2", text: "qPanel[0].q2", question: "q2" },
      { name: "panel.q1", text: "panel.q1", question: "q1", context: "qPanel" },
      { name: "panel.q2", text: "panel.q2", question: "q2", context: "qPanel" }
    ],
    "addConditionObjectsByContext work correctly for panel dynamic"
  );
});
QUnit.test("panelDynamic.getNestedQuestions", function(assert) {
  const panel = new QuestionPanelDynamicModel("qPanel");
  panel.template.addNewQuestion("text", "q1");
  const q2 = new QuestionMultipleTextModel("q2");
  q2.title = "Question 2";
  q2.addItem("item1");
  q2.addItem("item2");
  panel.template.addQuestion(q2);
  panel.panelCount = 2;
  const questions = panel.getNestedQuestions();
  assert.equal(questions.length, 6, "two panels * 3");
  assert.equal(questions[0].name, "q1", "panel[0].q1");
  assert.equal(questions[1].name, "item1", "panel[0].q2.item1");
  assert.equal(questions[2].name, "item2", "panel[0].q2.item2");
  assert.equal(questions[3].name, "q1", "panel[1].q1");
  assert.equal(questions[4].name, "item1", "panel[1].q2.item1");
  assert.equal(questions[5].name, "item2", "panel[1].q2.item2");
});
QUnit.test("panelDynamic.getNestedQuestions for created from JSON elements", function(assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 4,
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage",
  });

  const panel = survey.getQuestionByName("panel1");
  assert.equal(panel.getNestedQuestions(true).length, 4 * 2, "Calculate questions correctly");
});
QUnit.test("panelDynamic.getNestedQuestions for created from JSON elements & nested", function(assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic", name: "panel1",
        panelCount: 4,
        templateElements: [
          { type: "text", name: "q1" },
          { type: "matrixdropdown", name: "q2", columns: [{ name: "col1" }, { name: "col2" }], rows: ["row1", "row2"] }
        ]
      }
    ],
    questionsOnPageMode: "inputPerPage",
  });

  const panel = survey.getQuestionByName("panel1");
  assert.equal(panel.getNestedQuestions(true).length, 4 * (1 + 4), "Include nested questions");
  assert.equal(panel.getNestedQuestions(true, false).length, 4 * 2, "exclude nested questions");
});

QUnit.test("panelDynamic.addConditionObjectsByContext + settings.panelDynamicMaxPanelCountInCondition = 0", function(assert) {
  settings.panelDynamicMaxPanelCountInCondition = 0;
  var objs = [];
  var panel = new QuestionPanelDynamicModel("qPanel");
  panel.title = "Question Panel";
  var q1 = panel.template.addNewQuestion("text", "q1");
  var question = new QuestionMultipleTextModel("q2");
  question.title = "Question 2";
  question.addItem("item1");
  question.addItem("item2");
  panel.template.addQuestion(question);
  panel.addConditionObjectsByContext(objs, null);
  updateObjsQuestions(objs);
  assert.deepEqual(objs, [], "addConditionObjectsByContext work correctly for panel dynamic");
  objs = [];
  panel.addConditionObjectsByContext(objs, q1);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      {
        name: "panel.q2.item1",
        text: "panel.Question 2.item1",
        question: "q2",
        context: "qPanel"
      },
      {
        name: "panel.q2.item2",
        text: "panel.Question 2.item2",
        question: "q2",
        context: "qPanel"
      },
    ],
    "addConditionObjectsByContext work correctly for panel dynamic with context"
  );
  objs = [];
  panel.addConditionObjectsByContext(objs, true);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel.panel.q1", text: "Question Panel.panel.q1", question: "q1", context: "qPanel" },
      {
        name: "qPanel.panel.q2.item1",
        text: "Question Panel.panel.Question 2.item1",
        question: "q2", context: "qPanel"
      },
      {
        name: "qPanel.panel.q2.item2",
        text: "Question Panel.panel.Question 2.item2",
        question: "q2", context: "qPanel"
      },
    ],
    "addConditionObjectsByContext work correctly for panel dynamic with context equals true"
  );
  settings.panelDynamicMaxPanelCountInCondition = 1;
});

QUnit.test("panelDynamic.addConditionObjectsByContext + settings.panelDynamicMaxPanelCountInCondition = 2;", function(assert) {
  settings.panelDynamicMaxPanelCountInCondition = 2;
  var objs = [];
  var panel = new QuestionPanelDynamicModel("qPanel");
  panel.title = "Question Panel";
  var q1 = panel.template.addNewQuestion("text", "q1");
  var question = new QuestionMultipleTextModel("q2");
  question.title = "Question 2";
  question.addItem("item1");
  question.addItem("item2");
  panel.template.addQuestion(question);
  panel.addConditionObjectsByContext(objs, null);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel[0].q1", text: "Question Panel[0].q1", question: "q1" },
      { name: "qPanel[0].q2.item1", text: "Question Panel[0].Question 2.item1", question: "q2" },
      { name: "qPanel[0].q2.item2", text: "Question Panel[0].Question 2.item2", question: "q2" },
      { name: "qPanel[1].q1", text: "Question Panel[1].q1", question: "q1" },
      { name: "qPanel[1].q2.item1", text: "Question Panel[1].Question 2.item1", question: "q2" },
      { name: "qPanel[1].q2.item2", text: "Question Panel[1].Question 2.item2", question: "q2" }
    ],
    "addConditionObjectsByContext work correctly for panel dynamic"
  );
  objs = [];
  panel.addConditionObjectsByContext(objs, q1);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel[0].q1", text: "Question Panel[0].q1", question: "q1" },
      { name: "qPanel[0].q2.item1", text: "Question Panel[0].Question 2.item1", question: "q2" },
      { name: "qPanel[0].q2.item2", text: "Question Panel[0].Question 2.item2", question: "q2" },
      { name: "qPanel[1].q1", text: "Question Panel[1].q1", question: "q1" },
      { name: "qPanel[1].q2.item1", text: "Question Panel[1].Question 2.item1", question: "q2" },
      { name: "qPanel[1].q2.item2", text: "Question Panel[1].Question 2.item2", question: "q2" },
      {
        name: "panel.q2.item1",
        text: "panel.Question 2.item1",
        question: "q2",
        context: "qPanel"
      },
      {
        name: "panel.q2.item2",
        text: "panel.Question 2.item2",
        question: "q2",
        context: "qPanel"
      },
    ],
    "addConditionObjectsByContext work correctly for panel dynamic with context"
  );
  objs = [];
  panel.addConditionObjectsByContext(objs, true);
  updateObjsQuestions(objs);
  assert.deepEqual(
    objs,
    [
      { name: "qPanel[0].q1", text: "Question Panel[0].q1", question: "q1" },
      { name: "qPanel[0].q2.item1", text: "Question Panel[0].Question 2.item1", question: "q2" },
      { name: "qPanel[0].q2.item2", text: "Question Panel[0].Question 2.item2", question: "q2" },
      { name: "qPanel[1].q1", text: "Question Panel[1].q1", question: "q1" },
      { name: "qPanel[1].q2.item1", text: "Question Panel[1].Question 2.item1", question: "q2" },
      { name: "qPanel[1].q2.item2", text: "Question Panel[1].Question 2.item2", question: "q2" },
      { name: "qPanel.panel.q1", text: "Question Panel.panel.q1", question: "q1", context: "qPanel" },
      {
        name: "qPanel.panel.q2.item1",
        text: "Question Panel.panel.Question 2.item1",
        question: "q2", context: "qPanel"
      },
      {
        name: "qPanel.panel.q2.item2",
        text: "Question Panel.panel.Question 2.item2",
        question: "q2", context: "qPanel"
      },
    ],
    "addConditionObjectsByContext work correctly for panel dynamic with context equals true"
  );
  settings.panelDynamicMaxPanelCountInCondition = 1;
});
QUnit.test("panelDynamic.addConditionObjectsByContext + nested dynamic panel + context", function(assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "paneldynamic",
        "name": "question1",
        "title": "parent dynamic panel",
        "templateElements": [
          {
            "type": "paneldynamic",
            "name": "question2",
            "title": "nested dynamic panel",
            "templateElements": [
              {
                "type": "text",
                "name": "question3",
                "title": "nq1"
              },
              {
                "type": "text",
                "name": "question4",
                "title": "nq2"
              }
            ]
          },
          {
            "type": "text",
            "name": "question5",
            "title": "pq1"
          }
        ]
      }
    ]
  });
  const rootPanel = survey.getQuestionByName("question1");
  const nestedPanel = rootPanel.template.getQuestionByName("question2");
  const question3 = nestedPanel.template.getQuestionByName("question3");
  const objs: IConditionObject[] = [];
  rootPanel.addConditionObjectsByContext(objs, question3);
  assert.equal(objs.length, 4, "There should be 4 elements");
  assert.equal(objs[0].name, "question1[0].question2[0].question3", "value #0");
  assert.equal(objs[1].name, "question1[0].question2[0].question4", "value #1");
  assert.equal(objs[2].name, "panel.question4", "value #2");
  assert.equal(objs[2].text, "panel.nq2", "text #2");
  assert.equal(objs[3].name, "question1[0].question5", "value #3");
});
QUnit.test("matrixdropdown.addConditionObjectsByContext + in nested paneldynamic + context, Bug#8475", function(assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "templateElements": [
          {
            "type": "matrixdropdown",
            "name": "matrix1",
            "columns": [
              { "cellType": "text", "name": "col1" },
              { "cellType": "text", "name": "col2" },
              { "cellType": "text", "name": "col3" }
            ]
          }
        ]
      }
    ]
  });
  const rootPanel = survey.getQuestionByName("panel1");
  const nestedMatrix = rootPanel.template.getQuestionByName("matrix1");
  const column = nestedMatrix.columns[0];
  const objs: IConditionObject[] = [];
  rootPanel.addConditionObjectsByContext(objs, column);
  assert.equal(objs.length, 2, "There should be 4 elements");
  assert.equal(objs[0].name, "row.col2", "value #0");
  assert.equal(objs[1].name, "row.col3", "value #1");
});
QUnit.test("matrixDynamic.getConditionJson", function(assert) {
  var panel = new QuestionPanelDynamicModel("panel");
  (<QuestionCheckboxModel>(
    panel.template.addNewQuestion("checkbox", "q1")
  )).choices = [1, 2];
  var question = new QuestionMultipleTextModel("q2");
  question.addItem("item1");
  question.addItem("item2");
  panel.template.addQuestion(question);
  var json = panel.getConditionJson("equals", "q1");
  assert.deepEqual(json.choices, [1, 2], "choices get correctly");
  json = panel.getConditionJson("equals", "q2.item2");
  assert.equal(json.type, "text", "mutliple item type get correctly");
});

QUnit.test("matrixDynamic.panelsState, set value", function(assert) {
  var panel = new QuestionPanelDynamicModel("panel");
  panel.templateTitle = "Panel Title";
  panel.template.addNewQuestion("text", "q1");
  panel.panelCount = 2;
  assert.equal(panel.panelsState, "default", "The default value is normal");
  assert.equal(
    panel.panels[0].state,
    "default",
    "The default value for all panels is normal"
  );
  panel.panelsState = "expanded";
  assert.equal(
    panel.panels[0].state,
    "expanded",
    "panelsState = 'expanded', the first panel is expanded"
  );
  assert.equal(
    panel.panels[1].state,
    "expanded",
    "panelsState = 'expanded', the second panel is expanded"
  );
  panel.panelsState = "collapsed";
  assert.equal(
    panel.panels[0].state,
    "collapsed",
    "panelsState = 'collapsed', the first panel is collapsed"
  );
  assert.equal(
    panel.panels[1].state,
    "collapsed",
    "panelsState = 'collapsed', the second panel is collapsed"
  );
  panel.panelsState = "firstExpanded";
  assert.equal(
    panel.panels[0].state,
    "expanded",
    "panelsState = 'firstExpanded', the first panel is expanded"
  );
  assert.equal(
    panel.panels[1].state,
    "collapsed",
    "panelsState = 'firstExpanded', the second panel is collapsed"
  );
  panel.panelsState = "default";
  assert.equal(
    panel.panels[0].state,
    "default",
    "panelsState = 'default', the first panel has default state"
  );
  assert.equal(
    panel.panels[1].state,
    "default",
    "panelsState = 'default', the second panel has default state"
  );
});

QUnit.test("matrixDynamic.panelsState and not panel.title", function(assert) {
  var panel = new QuestionPanelDynamicModel("panel");
  panel.template.addNewQuestion("text", "q1");
  panel.panelCount = 2;
  assert.equal(panel.panelsState, "default", "The default value is normal");
  assert.equal(
    panel.panels[0].state,
    "default",
    "The default value for all panels is normal"
  );
  panel.panelsState = "collapsed";
  assert.equal(
    panel.panels[0].state,
    "default",
    "panelsState = 'expanded', by panel title is empty"
  );
  panel.panelsState = "firstExpanded";
  assert.equal(
    panel.panels[0].state,
    "default",
    "panelsState = 'firstExpanded', but panel.title is empty"
  );
});

QUnit.test("matrixDynamic.panelsState, add panel always expanded", function(
  assert
) {
  var panel = new QuestionPanelDynamicModel("panel");
  panel.template.addNewQuestion("text", "q1");
  panel.templateTitle = "Some text";
  panel.panelCount = 2;
  panel.addPanelUI();
  assert.equal(
    panel.panels[2].state,
    "default",
    "User can't collapse/expand the panel"
  );
  panel.panelsState = "expanded";
  assert.equal(panel.panels[2].state, "expanded", "It is expanded now");
  panel.addPanelUI();
  assert.equal(
    panel.panels[3].state,
    "expanded",
    "the panel is added with expanded state"
  );
  panel.panelsState = "collapsed";
  panel.addPanelUI();
  assert.equal(
    panel.panels[4].state,
    "expanded",
    "Also the panelsState = 'collapsed' the panel is added with expanded state"
  );
});
QUnit.test("matrixDynamic.panelsState, load from json", function(assert) {
  var json = {
    questions: [
      {
        type: "paneldynamic",
        name: "q",
        panelCount: 2,
        panelsState: "firstExpanded",
        templateElements: [{ type: "text", name: "q1" }],
        templateTitle: "Some text",
      },
    ],
  };
  var survey = new SurveyModel(json);
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("q");
  assert.equal(
    panel.panels[0].state,
    "expanded",
    "The first panel is expanded"
  );
  assert.equal(
    panel.panels[1].state,
    "collapsed",
    "The second panel is collapsed"
  );
});
QUnit.test(
  "matrixDynamic.panelsState, not tempalteTitle load from json",
  function(assert) {
    var json = {
      questions: [
        {
          type: "paneldynamic",
          name: "q",
          panelCount: 2,
          panelsState: "firstExpanded",
          templateElements: [{ type: "text", name: "q1" }],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("q");
    assert.equal(
      panel.panels[0].state,
      "default",
      "First panel, not templateTitle"
    );
    assert.equal(
      panel.panels[1].state,
      "default",
      "Second panel, not templateTitle"
    );
  }
);
QUnit.test(
  "Dynamic Panel, multiple text question and validation, Bug#1037",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("page");
    var panel = new QuestionPanelDynamicModel("q");
    var question = <QuestionMultipleTextModel>(
      panel.template.addNewQuestion("multipletext", "q1")
    );
    question.addItem("item1");
    question.addItem("item2");
    page.addElement(panel);
    survey.onValidateQuestion.add(function(survey, options) {
      if (options.name != "q1") return;
      var v1 = !!options.value ? options.value["item1"] : null;
      var v2 = !!options.value ? options.value["item2"] : null;
      if (!v1 || !v2) {
        options.error = "all items should be set";
        return;
      }
      if (v1 < 5) {
        options.error = "item1 should be more than 4";
      }
      if (v2 < 10) {
        options.error = "item2 should be more than 9";
      }
    });

    panel.panelCount = 1;
    panel.panels[0].questions[0].value = {};

    assert.equal(page.hasErrors(), true, "There are errors items are empty");

    panel.panels[0].questions[0].value = { item1: 5, item2: 5 };
    assert.equal(page.hasErrors(), true, "There is error item2 less than 10");
    panel.panels[0].questions[0].value = { item1: 5, item2: 11 };
    assert.equal(page.hasErrors(), false, "There is no errors");
  }
);
QUnit.test("Dynamic Panel, survey in readonly mode, Bug#1051", function(
  assert
) {
  var json = {
    questions: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 2,
        templateElements: [
          {
            type: "text",
            name: "q1",
          },
        ],
      },
      {
        type: "text",
        name: "q2",
      },
    ],
  };
  var survey = new SurveyModel(json);
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  var question = <QuestionTextModel>survey.getQuestionByName("q2");
  assert.ok(panel.panels[0].questions[0].survey, "The survey is set");
  assert.equal(
    panel.panels[0].questions[0].isReadOnly,
    false,
    "The question is not readonly"
  );
  survey.mode = "display";
  assert.equal(question.isReadOnly, true, "The standard question is readonly");
  assert.equal(
    panel.panels[0].questions[0].isReadOnly,
    true,
    "The question in dynamic panel should be readonly"
  );
});

QUnit.test(
  "Dynamic Panel readOnly, Bug#https://surveyjs.answerdesk.io/ticket/details/T1663",
  function(assert) {
    var json = {
      questions: [
        {
          type: "paneldynamic",
          name: "panel",
          readOnly: true,
          panelCount: 2,
          templateElements: [
            {
              type: "text",
              name: "q1",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
    var question = panel.panels[0].questions[0];
    assert.equal(
      question.isReadOnly,
      true,
      "The question is readonly initially"
    );
    panel.readOnly = false;
    assert.equal(
      question.isReadOnly,
      false,
      "The question is not readonly, panel is not readOnly"
    );
    survey.pages[0].readOnly = true;
    assert.equal(
      question.isReadOnly,
      true,
      "The question is readonly, page is readOnly"
    );
    survey.pages[0].readOnly = false;
    assert.equal(
      question.isReadOnly,
      false,
      "The question is not readonly again"
    );
    survey.mode = "display";
    assert.equal(
      question.isReadOnly,
      true,
      "The question is readonly, survey mode is display"
    );
  }
);

QUnit.test("Dynamic Panel, doesn't work with isSinglePage, Bug#1082", function(
  assert
) {
  var json = {
    isSinglePage: true,
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 2,
        templateElements: [
          {
            type: "text",
            name: "q1",
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.ok(panel.template.survey, "The survey is set for template");
  assert.ok(panel.panels[0].questions[0].survey, "The survey is set for panel");
});

QUnit.test("Dynamic Panel, doesn't work with isSinglePage, Bug#T1527", function(
  assert
) {
  var json = {
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "matrixdynamic",
            rowCount: 1,
            name: "employer_names",
            valueName: "employers",
            columns: [
              {
                name: "name",
                cellType: "text",
              },
            ],
          },
        ],
      },
      {
        name: "page2",
        elements: [
          {
            type: "paneldynamic",
            renderMode: "list",
            name: "arrray_employer_info",
            valueName: "employers",
            templateElements: [
              {
                type: "panel",
                name: "panel_employer_role",
                elements: [
                  {
                    type: "radiogroup",
                    choices: ["Full time", "Part time", "Casual", "Seasonal"],
                    name: "employer_role",
                    valueName: "role",
                  },
                ],
              },
              {
                type: "panel",
                name: "panel_employer_hours_work",
                title: "What hours do you work?",
                elements: [
                  {
                    type: "text",
                    inputType: "number",
                    name: "member_hours_worked",
                    valueName: "hours_worked",
                    title: "Hours:",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  survey.mode = "display";

  survey.data = {
    employers: [
      {
        name: "aaaa",
        address: "sasa",
        role: "Full time",
        hours_worked: 4,
      },
      {
        name: "bbbb",
        address: "aaaaa",
        role: "Part time",
        hours_worked: 4,
      },
    ],
  };

  survey.isSinglePage = true;
  var dPanel = <QuestionPanelDynamicModel>(
    survey.getQuestionByName("arrray_employer_info")
  );
  assert.ok(dPanel, "Get question correctly");
  assert.equal(dPanel.panelCount, 2, "There should be two panels");
});

QUnit.test(
  "Nested dynamic panel doesn't set data correctly, Bug#1096",
  function(assert) {
    var json = {
      isSinglePage: true,
      elements: [
        {
          type: "paneldynamic",
          name: "panel1",
          templateElements: [
            { type: "text", name: "q1" },
            {
              type: "paneldynamic",
              name: "nested1",
              templateElements: [{ type: "text", name: "q2" }],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    survey.data = {
      panel1: [
        { q1: 1, nested1: [{ q2: 1 }] },
        { q1: 2, nested1: [{ q2: 1 }, { q2: 2 }, { q2: 3 }] },
      ],
    };
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
    var panel1 = panel.panels[0];
    var panel2 = panel.panels[1];
    var panel1Nested1 = <QuestionPanelDynamicModel>(
      panel1.getQuestionByName("nested1")
    );
    var panel2Nested1 = <QuestionPanelDynamicModel>(
      panel2.getQuestionByName("nested1")
    );
    assert.equal(
      panel1.getQuestionByName("q1").value,
      1,
      "q1 in first panel set correctly"
    );
    assert.equal(
      panel2.getQuestionByName("q1").value,
      2,
      "q1 in second panel set correctly"
    );
    assert.equal(
      panel1Nested1.panelCount,
      1,
      "There should be one panel in the first nested panel"
    );
    assert.equal(
      panel1Nested1.panels[0].getQuestionByName("q2").value,
      1,
      "q2 set correctly in the first nested panel"
    );
    assert.equal(
      panel2Nested1.panelCount,
      3,
      "There should be three panels in the second nested panel"
    );
    assert.equal(
      panel2Nested1.panels[0].getQuestionByName("q2").value,
      1,
      "first q2 set correctly in the second nested panel"
    );
    assert.equal(
      panel2Nested1.panels[1].getQuestionByName("q2").value,
      2,
      "second q2 set correctly in the second nested panel"
    );
    assert.equal(
      panel2Nested1.panels[2].getQuestionByName("q2").value,
      3,
      "third q2 set correctly in the second nested panel"
    );
  }
);

QUnit.test(
  "visibleIf and add new panel in child paneldynamic bug #1139",
  function(assert) {
    var json = {
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "paneldynamic",
              name: "question1",
              templateElements: [
                {
                  type: "radiogroup",
                  name: "question2",
                  choices: ["item1", "item2", "item3"],
                },
                {
                  type: "paneldynamic",
                  name: "question3",
                  minPanelCount: 1,
                  visibleIf: "{panel.question2} notempty",
                  templateElements: [
                    {
                      type: "text",
                      name: "question4",
                      title: "Input",
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    var survey = new SurveyModel(json);

    var rootPanel = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("question1")
    );
    var rootPanelEl1 = rootPanel.addPanel();
    var question2 = rootPanelEl1.getQuestionByName("question2");
    var question3 = <QuestionPanelDynamicModel>(
      rootPanelEl1.getQuestionByName("question3")
    );

    assert.notOk(question3.isVisible, "Child panel is hidden");
    question2.value = "item1";
    assert.ok(question3.isVisible, "Child panel become visible");
    var childPanelEl1 = question3.addPanel();
    assert.ok(question3.isVisible, "Child panel still visible");
  }
);

QUnit.test(
  "visibleIf and parentpanel paneldynamic",
  function(assert) {
    const json = {
      elements: [
        {
          type: "paneldynamic",
          name: "question1",
          panelCount: 1,
          templateElements: [
            {
              type: "checkbox",
              name: "question2",
              choices: ["item1", "item2", "item3"],
            },
            {
              type: "paneldynamic",
              name: "question3",
              minPanelCount: 1,
              templateElements: [
                {
                  type: "checkbox",
                  name: "question4",
                  choicesVisibleIf: "{parentpanel.question2} contains {item}",
                  choices: ["item1", "item2", "item3"],
                },
              ],
            },
          ],
        },
      ],
    };

    const survey = new SurveyModel(json);

    const rootPanel = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("question1")
    );
    const rootPanelEl1 = rootPanel.panels[0];
    const question2 = rootPanelEl1.getQuestionByName("question2");
    const childPanel = rootPanelEl1.getQuestionByName("question3");
    const question4 = childPanel.panels[0].getQuestionByName("question4");
    assert.equal(question4.visibleChoices.length, 0, "There is not visible choices by default");
    question2.value = ["item1", "item2"];
    assert.equal(question4.visibleChoices.length, 2, "There are two visible choices by now");
  }
);

QUnit.test(
  "panel.defaultPanelValue, apply from json and then from UI",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "dPanel",
          elements: [
            { type: "text", name: "q1" },
            { type: "text", name: "q2" },
            { type: "text", name: "q3" },
          ],
          panelCount: 2,
          defaultPanelValue: { q1: "val1", q3: "val3" },
        },
      ],
    };
    var survey = new SurveyModel(json);
    var question = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("dPanel")
    );
    assert.deepEqual(
      question.value,
      [
        { q1: "val1", q3: "val3" },
        { q1: "val1", q3: "val3" },
      ],
      "defaultPanelValue set correctly on json loading"
    );
    question.addPanel();
    assert.deepEqual(
      question.value,
      [
        { q1: "val1", q3: "val3" },
        { q1: "val1", q3: "val3" },
        { q1: "val1", q3: "val3" },
      ],
      "defaultPanelValue set correclty on adding row"
    );
  }
);

QUnit.test(
  "matrix.defaultRowValue, defaultValue has higher priority than defaultRowValue",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "dPanel",
          templateElements: [
            { type: "text", name: "q1" },
            { type: "text", name: "q2" },
            { type: "text", name: "q3" },
          ],
          panelCount: 2,
          defaultPanelValue: { q1: "val1", q3: "val3" },
          defaultValue: [
            { q1: "v1", q2: "v2" },
            { q1: "v11", q3: "v3" },
          ],
        },
      ],
    };

    var survey = new SurveyModel(json);
    var question = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("dPanel")
    );
    assert.deepEqual(
      question.value,
      [
        { q1: "v1", q2: "v2" },
        { q1: "v11", q3: "v3" },
      ],
      "defaultValue is used"
    );
  }
);

QUnit.test("Synhronize elements on changing template", function(assert) {
  var question = new QuestionPanelDynamicModel("q");
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.panelCount = 2;
  assert.equal(question.panels[0].elements.length, 2, "There are two elements");
  question.template.addNewQuestion("text", "q3");
  assert.equal(
    question.panels[0].elements.length,
    3,
    "There are three elements"
  );
  question.template.removeQuestion(question.template.questions[0]);
  assert.equal(
    question.panels[0].elements.length,
    2,
    "There are two elements again"
  );
  assert.equal(
    question.panels[0].questions[0].name,
    "q2",
    "The first element is 'q2"
  );
});

QUnit.test("synhronize on template question property change", function(assert) {
  var json = {
    elements: [
      {
        type: "paneldynamic",
        name: "dPanel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "checkbox", name: "q2", choices: [1, 2] },
          {
            type: "panel",
            name: "p1",
            elements: [{ type: "text", name: "p1_q1" }],
          },
        ],
        panelCount: 2,
      },
    ],
  };

  var survey = new SurveyModel(json);
  var question = <QuestionPanelDynamicModel>survey.getQuestionByName("dPanel");
  var q1_1 = question.panels[0].elements[0];
  var q1_2 = question.panels[1].elements[0];
  var q2_1 = question.panels[0].elements[1];
  var q2_2 = question.panels[1].elements[1];
  (<QuestionTextModel>question.templateElements[0]).title = "title1";
  (<QuestionCheckboxModel>question.templateElements[1]).choices = [1, 2, 3];
  assert.equal((<QuestionTextModel>q1_1).title, "title1", "q1_1 title changed");
  assert.equal((<QuestionTextModel>q1_2).title, "title1", "q1_2 title changed");
  assert.equal(
    (<QuestionCheckboxModel>q2_1).choices.length,
    3,
    "q2_1 choices changed"
  );
  assert.deepEqual(
    (<QuestionCheckboxModel>q2_2).choices.length,
    3,
    "q2_2 choices changed"
  );
  var q3 = <QuestionTextModel>question.template.addNewQuestion("text", "q3");
  var q3_1 = <QuestionTextModel>question.panels[0].getQuestionByName("q3");
  assert.equal(q3_1.title, "q3", "The title is empty");
  q3.title = "title_3";
  assert.equal(
    q3_1.title,
    "title_3",
    "The title for added question has been changed"
  );
  var p1_q1 = <QuestionTextModel>question.template.getQuestionByName("p1_q1");
  var q3_q1_1 = <QuestionTextModel>(
    question.panels[0].getQuestionByName("p1_q1")
  );
  p1_q1.title = "title_in_panel";
  assert.equal(
    q3_q1_1.title,
    "title_in_panel",
    "The title for a question in a panel has been changed"
  );
});

QUnit.test(
  "synhronize on template question property change bug #1278",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "dPanel",
          templateElements: [
            { type: "text", name: "q1" },
            { type: "checkbox", name: "q2", choices: [1, 2] },
            {
              type: "panel",
              name: "p1",
              elements: [{ type: "text", name: "p1_q1" }],
            },
          ],
          panelCount: 2,
        },
      ],
    };

    var survey = new SurveyModel(json);
    var question = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("dPanel")
    );
    assert.equal(
      question.panels[0].elements[0].isVisible,
      true,
      "The first question is visible"
    );
    question.templateElements[0].visible = false;
    assert.equal(
      question.panels[0].elements[0].isVisible,
      false,
      "The first question is not visible now"
    );
  }
);

QUnit.test("Test copyDefaultValueFromLastEntry property", function(assert) {
  var survey = new SurveyModel();
  var page = survey.addNewPage("page");
  var question = <QuestionPanelDynamicModel>(
    page.addNewQuestion("paneldynamic", "question")
  );
  question.panelCount = 0;
  question.template.addNewQuestion("text", "q1");
  question.template.addNewQuestion("text", "q2");
  question.template.addNewQuestion("text", "q3");
  question.copyDefaultValueFromLastEntry = true;
  question.addPanel();
  assert.equal(question.isEmpty(), true, "It is empty");
  question.value = [{ q1: 1, q2: 2 }];
  question.addPanel();
  assert.deepEqual(
    question.value,
    [
      { q1: 1, q2: 2 },
      { q1: 1, q2: 2 },
    ],
    "copyDefaultValueFromLastEntry is working"
  );
  question.defaultPanelValue = { q1: 11, q3: 3 };
  question.addPanel();
  assert.deepEqual(
    question.value,
    [
      { q1: 1, q2: 2 },
      { q1: 1, q2: 2 },
      { q1: 1, q2: 2, q3: 3 },
    ],
    "defaultValueFromLastRow is merging with defaultPanelValue"
  );
});
QUnit.test("copyDefaultValueFromLastEntry property && hasOther", function(assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic", name: "root",
        panelCount: 1,
        templateElements: [
          { type: "paneldynamic", name: "question",
            defaultValueFromLastPanel: true,
            panelCount: 0,
            templateElements: [
              { type: "dropdown", name: "q1", choices: [1, 2, 3], hasOther: true },
              { type: "dropdown", name: "q2", choices: [1, 2, 3], hasOther: true }
            ]
          }
        ]
      }
    ]
  });
  const rootPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("root");
  const question = <QuestionPanelDynamicModel>(rootPanel.panels[0].getQuestionByName("question"));
  const panel1 = question.addPanel();
  panel1.getQuestionByName("q1").value = "other";
  panel1.getQuestionByName("q1").comment = "comment1";
  panel1.getQuestionByName("q2").value = "other";
  panel1.getQuestionByName("q2").comment = "comment2";
  let counter = 0;
  survey.onDynamicPanelItemValueChanged.add((sender, options) => {
    counter ++;
  });
  question.addPanel();
  question.addPanel();
  question.addPanel();
  question.addPanel();
  const panel6 = question.addPanel();
  assert.equal(panel6.getQuestionByName("q1").value, "other", "Value set");
  assert.equal(panel6.getQuestionByName("q1").comment, "comment1", "Comment set");
  assert.equal(counter, 5 * 2, "Call updates 10 times");
});

QUnit.test("Generates error on clearIncorrectValue()", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "qid68",
        visible: false,
        visibleIf: "{qid752} contains 'OUI'",
        isRequired: true,
        templateElements: [
          {
            type: "text",
            name: "pnd1790",
          },
          {
            type: "dropdown",
            name: "pnd72",
          },
          {
            type: "radiogroup",
            name: "pnd1791",
          },
        ],
        panelCount: 1,
      },
    ],
  });
  const data = {
    qid1760: "teste",
    qid1761: "tygjhg",
    qid1792: "OUI",
    qid1787: [{ pnd1788: "teste" }],
  };
  survey.data = data;
  survey.clearIncorrectValues();
  assert.deepEqual(survey.data, data, "Do not touch anything");
});

QUnit.test("Panel dynamic and survey.data setup", function(assert) {
  var json = {
    isSinglePage: true,
    elements: [
      {
        type: "paneldynamic",
        renderMode: "progressTop",
        name: "p1",
        panelCount: 2,
        templateElements: [
          {
            type: "text",
            name: "q1",
          },
        ],
      },
    ],
  };

  var survey = new SurveyModel(json);

  survey.data = {};

  survey.clearIncorrectValues();
  assert.deepEqual(
    survey.data,
    { },
    "Remove panels if set empty data"
  );
});
QUnit.test(
  "Panel dynamic and clearIncorrectValue, do not remove matrix-total values, Bug#2553",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "question3",
          templateElements: [
            {
              type: "matrixdynamic",
              name: "question1",
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
              rowCount: 1,
            },
            {
              type: "expression",
              name: "question2",
              expression: "{panel.question1-total.column3}",
            },
          ],
        },
      ],
    };

    var survey = new SurveyModel(json);
    var data = {
      question3: [
        {
          "question1-total": { Column3: 3 },
          question2: 3,
          question1: [{ Column1: "1", Column2: "2", Column3: 3 }],
        },
      ],
    };

    survey.data = data;

    survey.clearIncorrectValues();
    assert.deepEqual(survey.data, data, "values should be the same");
  }
);

QUnit.test(
  "Panel dynamic nested dynamic panel and display mode, Bug#1488",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "question1",
          templateElements: [
            {
              type: "paneldynamic",
              name: "question2",
              title: "Inner dynamic panel",
              templateElements: [
                {
                  type: "text",
                  name: "question3",
                },
              ],
              panelCount: 2,
            },
            {
              type: "checkbox",
              name: "question4",
              title: "Checkbox question",
              choices: ["item1", "item2", "item3"],
            },
          ],
          panelCount: 1,
        },
      ],
      mode: "display",
    };

    var survey = new SurveyModel(json);
    var panel1 = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("question1")
    );
    var question4 = <QuestionPanelDynamicModel>(
      panel1.panels[0].getQuestionByName("question4")
    );
    assert.equal(question4.isReadOnly, true, "The question should be readonly");
    var panel2 = <QuestionPanelDynamicModel>(
      panel1.panels[0].getQuestionByName("question2")
    );
    assert.ok(
      panel2.survey,
      "survey is set correctly to the nest dynamic panel"
    );
    var question3 = panel2.panels[0].getQuestionByName("question3");
    assert.ok(
      question3.survey,
      "survey is set correctly to the nest dynamic panel question"
    );
    assert.equal(
      question3.isReadOnly,
      true,
      "The question inside the nested dynamic panel should be readonly"
    );
  }
);

QUnit.test("Panel dynamic nested dynamic panel and result, Bug#1514", function(
  assert
) {
  var ljson = {
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "paneldynamic",
            name: "dp1",
            templateElements: [
              {
                type: "paneldynamic",
                name: "dp2",
                templateElements: [
                  {
                    type: "text",
                    name: "q1",
                  },
                ],
                panelCount: 1,
              },
            ],
            panelCount: 1,
          },
        ],
      },
    ],
  };
  var lsurvey = new SurveyModel(ljson);
  assert.deepEqual(
    lsurvey.data,
    { dp1: [{ }] },
    "Has only one element in they array"
  );

  var dp1 = <QuestionPanelDynamicModel>(
    lsurvey.currentPage.getQuestionByName("dp1")
  );
  var dp2 = <QuestionPanelDynamicModel>dp1.panels[0].getQuestionByName("dp2");
  var q1 = dp2.panels[0].questions[0];
  q1.value = "val1";
  assert.deepEqual(
    lsurvey.data,
    { dp1: [{ dp2: [{ q1: "val1" }] }] },
    "The result is correct"
  );
  var json = {
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "paneldynamic",
            name: "dp1",
            templateElements: [
              {
                type: "paneldynamic",
                name: "dp2",
                templateElements: [
                  {
                    type: "paneldynamic",
                    name: "dp3",
                    templateElements: [
                      {
                        type: "paneldynamic",
                        name: "dp4",
                        templateElements: [
                          {
                            type: "text",
                            name: "q1",
                            defaultValue: "val1",
                          },
                        ],
                        panelCount: 1,
                      },
                    ],
                    panelCount: 1,
                  },
                ],
                panelCount: 1,
              },
            ],
            panelCount: 1,
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  assert.deepEqual(
    survey.data,
    { dp1: [{ dp2: [{ dp3: [{ dp4: [{ q1: "val1" }] }] }] }] },
    "The result is correct"
  );
});

QUnit.test(
  "Bug on caching panel data during onValueChanged event, Bug#T1533",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "dp1",
          templateElements: [
            {
              type: "text",
              name: "q1",
            },
            {
              type: "checkbox",
              valueName: "v2",
              name: "q2",
            },
          ],
          panelCount: 1,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var changedValue = null;
    survey.onDynamicPanelItemValueChanged.add(function(sender, options) {
      if (options.name != "q1") return;
      var q2 = options.panel.getQuestionByName("q2");
      q2.value = [1, 2, 3];
      changedValue = q2.value;
    });
    var dp1 = <QuestionPanelDynamicModel>survey.getQuestionByName("dp1");
    var q1 = dp1.panels[0].getQuestionByName("q1");
    q1.value = "val1";
    assert.deepEqual(changedValue, [1, 2, 3], "value set correctly");
  }
);

QUnit.test(
  "Bug on visibleIf in dynamic panel + dynamic matrix, Bug#T1716",
  function(assert) {
    var json = {
      elements: [
        {
          type: "matrixdynamic",
          name: "entities",
          columns: [
            {
              name: "q3",
              cellType: "text",
              isRequired: true,
            },
          ],
          rowCount: 1,
        },
        {
          type: "paneldynamic",
          name: "entities_info",
          valueName: "entities",
          templateElements: [
            {
              type: "radiogroup",
              name: "q1",
              choices: ["a", "b"],
            },
            {
              type: "text",
              name: "q2",
              visibleIf: "{panel.q1} = 'b'",
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    survey.setValue("entities", [{ q3: "some text" }]);
    var panel = <QuestionMatrixDynamicModel>(
      survey.getQuestionByName("entities_info")
    );
    assert.equal(
      panel.panels[0].getQuestionByName("q2").isVisible,
      false,
      "By default, q2 is invisible"
    );
    panel.panels[0].getQuestionByName("q1").value = "b";
    assert.equal(
      panel.panels[0].getQuestionByName("q2").isVisible,
      true,
      "q2 is visible now"
    );
  }
);

QUnit.test("goToNextPanel method", function(assert) {
  var json = {
    elements: [
      {
        type: "paneldynamic",
        name: "pd",
        renderMode: "progressTop",
        panelCount: 2,
        templateElements: [
          {
            type: "radiogroup",
            name: "q1",
            isRequired: true,
            choices: ["a", "b"],
          },
        ],
      },
    ],
  };

  var survey = new SurveyModel(json);
  var panelDynamic = <QuestionPanelDynamicModel>survey.getQuestionByName("pd");
  assert.equal(panelDynamic.currentIndex, 0, "first panel is current");

  panelDynamic.goToNextPanel();
  assert.equal(
    panelDynamic.currentIndex,
    0,
    "first panel is current because of validation errors"
  );
  assert.equal(panelDynamic.currentPanel.hasErrors(), true);

  survey.data = { pd: [{ q1: "a" }, { q1: "b" }] };
  assert.equal(panelDynamic.currentPanel.hasErrors(), false);

  panelDynamic.goToNextPanel();
  assert.equal(panelDynamic.currentIndex, 1, "second panel is current");
});

QUnit.test("do not add new panel for list", function(assert) {
  const json = {
    elements: [
      {
        type: "paneldynamic",
        name: "pd",
        renderMode: "progressTop",
        panelCount: 1,
        templateElements: [
          {
            type: "radiogroup",
            name: "q1",
            isRequired: true,
            choices: ["a", "b"],
          },
        ],
      },
    ],
  };

  let survey = new SurveyModel(json);
  let panelDynamic = <QuestionPanelDynamicModel>survey.getQuestionByName("pd");
  assert.equal(panelDynamic.currentIndex, 0, "first panel is current");
  assert.equal(panelDynamic.panelCount, 1, "There is one panel");
  panelDynamic.addPanelUI();
  assert.equal(panelDynamic.currentIndex, 0, "first panel is current because of validation errors");
  assert.equal(panelDynamic.panelCount, 1, "There is still one panel");
  assert.equal(panelDynamic.canAddPanel, true, "You still can show buttons");
  assert.equal(panelDynamic.currentPanel.hasErrors(), true);

  survey.data = { pd: [{ q1: "a" }] };
  assert.equal(panelDynamic.currentPanel.hasErrors(), false);

  panelDynamic.addPanelUI();
  assert.equal(panelDynamic.currentIndex, 1, "second panel is current");
  assert.equal(panelDynamic.panelCount, 2, "There are two panels");

  survey = new SurveyModel(json);
  panelDynamic = <QuestionPanelDynamicModel>survey.getQuestionByName("pd");
  panelDynamic.renderMode = "list";
  panelDynamic.addPanelUI();
  assert.equal(panelDynamic.panelCount, 2, "Do not check for list mode");
});

QUnit.test("addPanel(index, skipvalidation)", function(assert) {
  const json = {
    elements: [
      {
        type: "paneldynamic",
        name: "pd",
        renderMode: "progressTop",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1", isRequired: true }
        ],
      },
    ],
  };

  let survey = new SurveyModel(json);
  let question = <QuestionPanelDynamicModel>survey.getQuestionByName("pd");
  assert.equal(question.currentIndex, 0, "first panel is current");
  assert.equal(question.panelCount, 1, "There is one panel");

  question.addPanel(undefined);
  assert.equal(question.currentIndex, 1, "currentIndex #2");
  assert.equal(question.panelCount, 2, "panelCount #2");
  assert.equal(question.canAddPanel, true, "canAddPanel #2");

  question.defaultValueFromLastPanel = true;
  question.value = [{ q1: 1 }, { q1: 2 }, { q1: 3 }];
  assert.equal(question.currentIndex, 1, "don't change currentIndex");
  question.addPanel(2);
  assert.equal(question.currentIndex, 2, "currentIndex #3");
  assert.equal(question.panelCount, 4, "panelCount #3");
});

QUnit.test("goToPrevPanel method", function(assert) {
  var json = {
    elements: [
      {
        type: "paneldynamic",
        name: "pd",
        renderMode: "progressTop",
        panelCount: 2,
        templateElements: [
          {
            type: "radiogroup",
            name: "q1",
            isRequired: true,
            choices: ["a", "b"],
          },
        ],
      },
    ],
  };

  var survey = new SurveyModel(json);
  var panelDynamic = <QuestionMatrixDynamicModel>survey.getQuestionByName("pd");

  panelDynamic.currentIndex = 1;
  assert.equal(panelDynamic.currentIndex, 1, "second panel is current");

  panelDynamic.goToPrevPanel();
  assert.equal(panelDynamic.currentIndex, 0, "first panel is current");
});
QUnit.test(
  "paneldynamic + radiogroup + others, Bug# https://github.com/surveyjs/editor/issues/480",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "panel1",
          templateElements: [
            {
              type: "radiogroup",
              name: "radio",
              choices: ["item1", "item2", "item3"],
              hasOther: true,
            },
          ],
        },
      ],
    };

    var survey = new SurveyModel(json);
    survey.data = { panel1: [{ radio: "other", "radio-Comment": "Comment" }] };

    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
    var question = <QuestionRadiogroupModel>(
      panel.panels[0].getQuestionByName("radio")
    );
    assert.equal(question.isOtherSelected, true, "Other is selected");
    assert.equal(question.comment, "Comment", "Comment is set correctly");
  }
);
QUnit.test(
  "paneldynamic + survey.checkErrorsMode='onValueChanged', Bug# https://surveyjs.answerdesk.io/ticket/details/T1758",
  function(assert) {
    var json = {
      checkErrorsMode: "onValueChanged",
      elements: [
        {
          type: "paneldynamic",
          name: "panel1",
          panelCount: 1,
          templateElements: [
            {
              type: "text",
              name: "q1",
              isRequired: true,
            },
            {
              type: "text",
              name: "q2",
              isRequired: true,
            },
          ],
        },
      ],
    };

    var survey = new SurveyModel(json);
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
    var q1 = <QuestionRadiogroupModel>panel.panels[0].getQuestionByName("q1");
    var q2 = <QuestionRadiogroupModel>panel.panels[0].getQuestionByName("q2");
    assert.equal(q2.errors.length, 0, "There are no errors in the second question");
    q1.value = "test";
    assert.equal(q2.errors.length, 0, "There are still no errors in the second question");
    panel.value = [{ }];
    assert.equal(q1.errors.length, 0, "There is no errors on panel.value changed, q1");
    assert.equal(q1.errors.length, 0, "There is no errors on panel.value changed, q2");
    assert.equal(q1.isEmpty(), true, "q1 is empty now");
    q1.value = "abc";
    assert.equal(q1.errors.length, 0, "There is no errors on value changed, #2");
    assert.equal(q2.errors.length, 0, "and there is no error in the second question");
    q1.value = "";
    assert.equal(q1.errors.length, 1, "We have the error in q1 now");
    survey.tryComplete();
    assert.equal(q1.errors.length, 1, "There is error in the first question");
    assert.equal(q2.errors.length, 1, "There is error in the second question");
  }
);
QUnit.test("paneldynamic isRequired + survey.checkErrorsMode='onValueChanged', Bug#6395", function(assert) {
  var survey = new SurveyModel({
    checkErrorsMode: "onValueChanged",
    elements: [
      {
        type: "paneldynamic",
        name: "panel1",
        panelCount: 1,
        isRequired: true,
        templateElements: [
          {
            type: "text",
            name: "q1"
          }
        ],
      },
    ],
  });
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  var q1 = <QuestionRadiogroupModel>panel.panels[0].getQuestionByName("q1");
  survey.hasErrors();
  assert.equal(panel.errors.length, 1, "There is one error in panel dynamic, #1");
  q1.value = "test";
  assert.equal(panel.errors.length, 0, "There is no error in panel dynamic, #2");
});

QUnit.test(
  "paneldynamic + expression value + clear data on survey.isSinglePage = true', Bug# 1625",
  function(assert) {
    var json = {
      pages: [
        {
          name: "page1",
          elements: [
            {
              type: "paneldynamic",
              name: "Dynamic Panel",
              templateElements: [
                {
                  type: "text",
                  name: "Input",
                },
                {
                  type: "expression",
                  name: "Expression",
                  expression: "1",
                },
              ],
              panelCount: 1,
            },
          ],
        },
      ],
    };
    var data = {
      "Dynamic Panel": [
        { Expression: 1, Input: "Test1" },
        { Expression: 1, Input: "Test2" },
        { Expression: 1, Input: "Test3" },
      ],
    };

    var survey = new SurveyModel(json);
    survey.data = data;
    assert.deepEqual(survey.data, data, "Data set correctly");
    survey.isSinglePage = true;
    assert.deepEqual(
      survey.data,
      data,
      "Data is not changed after setting single page"
    );
  }
);
QUnit.test(
  "Dynamic Panel validators, validators expression do not recognize 'panel.' prefix. Bug#1710",
  function(assert) {
    var json = {
      questions: [
        {
          type: "text",
          name: "q1",
        },
        {
          type: "paneldynamic",
          name: "panel1",
          panelCount: 1,
          templateElements: [
            {
              type: "text",
              name: "pq1",
              validators: [
                { type: "expression", expression: "{panel.pq1} = {q1}" },
              ],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
    panel.panels[0].getQuestionByName("pq1").value = "val1";
    survey.getQuestionByName("q1").value = "val";
    assert.equal(panel.hasErrors(), true, "There is an error");
    panel.panels[0].getQuestionByName("pq1").value = "val";
    assert.equal(panel.hasErrors(), false, "There is no errors");
  }
);

QUnit.test(
  "Dropdown inside Dynamic Panel. ChoicesMax choicesMin properties",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "relatives",
          title: "Please enter all blood relatives you know",
          renderMode: "progressTop",
          templateTitle: "Information about: {panel.relativeType}",
          templateElements: [
            {
              name: "liveage",
              type: "dropdown",
              choicesMin: 1,
              choicesMax: 115,
            },
          ],
          panelCount: 2,
          panelAddText: "Add a blood relative",
          panelRemoveText: "Remove the relative",
        },
      ],
    };
    var survey = new SurveyModel(json);

    var dropDownQuestion = survey.getAllQuestions()[0]["panels"][0].elements[0];

    assert.equal(dropDownQuestion.choicesMin, 1, "choicesMin is ok");
    assert.equal(dropDownQuestion.choicesMax, 115, "choicesMax is ok");
    assert.equal(
      dropDownQuestion.visibleChoices.length,
      115,
      "visibleChoices is ok"
    );
  }
);
QUnit.test(
  "Matrix validation in cells and async functions in expression",
  function(assert) {
    var returnResult: (res: any) => void;
    function asyncFunc(params: any): any {
      returnResult = this.returnResult;
      return false;
    }
    FunctionFactory.Instance.register("asyncFunc", asyncFunc, true);

    var question = new QuestionPanelDynamicModel("q1");
    question.panelCount = 1;
    var textQuestion = question.template.addNewQuestion("text", "q1");
    textQuestion.validators.push(new ExpressionValidator("asyncFunc() = 1"));
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
  "Nested panel, setting survey.data when survey.clearInvisibleValues='onHidden', Bug# 1866",
  function(assert) {
    var json = {
      clearInvisibleValues: "onHidden",
      elements: [
        {
          name: "samples",
          type: "paneldynamic",
          templateElements: [
            {
              name: "surgicalProcedures",
              type: "paneldynamic",
              templateElements: [
                {
                  name: "histologicalDianosis",
                  type: "text",
                },
                {
                  name: "histologicalCategory",
                  type: "text",
                  visibleIf: "{panel.histologicalDianosis}='yes'",
                },
              ],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    survey.data = {
      samples: [
        {
          surgicalProcedures: [
            {
              histologicalDianosis: "yes",
              histologicalCategory: "foo",
            },
          ],
        },
      ],
    };
    var nestedPanel = <QuestionPanelDynamicModel>(
      (<QuestionPanelDynamicModel>survey.getAllQuestions()[0]).panels[0]
        .questions[0]
    );
    var histologicalCategory = nestedPanel.panels[0].questions[1];
    assert.equal(histologicalCategory.value, "foo", "value set correctly");
  }
);
QUnit.test("Panel dynamic, clearInvisibleValues='onHidden' & question valueName, Bug#", function(assert) {
  const json = {
    clearInvisibleValues: "onHidden",
    elements: [
      {
        name: "panel",
        type: "paneldynamic",
        templateElements: [
          { name: "q1", type: "text", valueName: "q1_val" },
          { name: "q2", type: "text", valueName: "q2_val", visibleIf: "{panel.q1_val} = 'a'" }
        ],
        panelCount: 1
      }
    ]
  };
  const survey = new SurveyModel(json);
  assert.equal(survey.hasVisibleQuestionByValueName("q2_val"), false, "It is in templates");
  const pDynamic = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const panel = pDynamic.panels[0];
  panel.getQuestionByName("q1").value = "a";
  panel.getQuestionByName("q2").value = "b";
  assert.deepEqual(survey.data, { panel: [{ q1_val: "a", q2_val: "b" }] }, "#1");
  panel.getQuestionByName("q1").value = "c";
  assert.deepEqual(survey.data, { panel: [{ q1_val: "c" }] }, "#2");
});
QUnit.test(
  "Paneldynamic duplicate key value error with checkErrorsMode: onValueChanged",
  function(assert) {
    var survey = new SurveyModel({
      checkErrorsMode: "onValueChanged",
      elements: [
        {
          name: "panel1",
          type: "paneldynamic",
          keyName: "id",
          templateElements: [
            {
              name: "id",
              type: "text",
            },
          ],
          panelCount: 3,
        },
      ],
    });

    var panelDynamic = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("panel1")
    );
    var question1 = panelDynamic.panels[0].questions[0];
    var question2 = panelDynamic.panels[1].questions[0];
    var question3 = panelDynamic.panels[2].questions[0];
    question1.value = "1";
    question2.value = "0";
    assert.equal(
      question2.errors.length,
      0,
      "There is no unique errors by default"
    );
    question2.value = "1";
    assert.equal(
      question2.errors.length,
      1,
      "There is unique value error, when two key values are equal"
    );
    question2.value = "0";
    assert.equal(
      question2.errors.length,
      0,
      "There is no unique errors after question with error is changed"
    );
    question2.value = "1";
    question1.value = "0";
    assert.equal(
      question2.errors.length,
      0,
      "There is no unique errors after question with no error is changed"
    );
    question1.value = "1";
    question3.value = "1";
    assert.equal(
      question2.errors.length,
      1,
      "There is unique value error on second question, when three key values are equal"
    );
    assert.equal(
      question3.errors.length,
      1,
      "There is unique value error on third question, when three key values are equal"
    );
  }
);

QUnit.test(
  "Paneldynamic duplicate key value error with checkErrorsMode: onValueChanging",
  function(assert) {
    var survey = new SurveyModel({
      checkErrorsMode: "onValueChanging",
      elements: [
        {
          name: "panel1",
          type: "paneldynamic",
          keyName: "id",
          templateElements: [
            {
              name: "id",
              type: "text",
            },
          ],
          panelCount: 2,
        },
      ],
    });

    var panelDynamic = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("panel1")
    );
    var question1 = panelDynamic.panels[0].questions[0];
    var question2 = panelDynamic.panels[1].questions[0];
    question1.value = 1;
    question2.value = 3;
    assert.deepEqual(survey.data, { panel1: [{ id: 1 }, { id: 3 }] });
    question2.value = 1;
    assert.equal(
      question2.errors.length,
      1,
      "There is unique value error, when two key values are equal"
    );
    assert.equal(question2.value, 1, "Keep incorrect value in question");
    assert.deepEqual(
      survey.data,
      { panel1: [{ id: 1 }, { id: 3 }] },
      "Do not change the survey.data with incorrect values"
    );
    question2.value = 2;
    assert.equal(question2.errors.length, 0, "There is no errors");
    assert.deepEqual(
      survey.data,
      { panel1: [{ id: 1 }, { id: 2 }] },
      "set correct values into survey.data"
    );
  }
);
QUnit.test(
  "Paneldynamic duplicate key value error adds several times into cell question.errors on calling hasErrors(false), Bug #3869",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          name: "panel1",
          type: "paneldynamic",
          keyName: "id",
          templateElements: [
            {
              name: "id",
              type: "text",
            },
          ],
          panelCount: 2,
        },
      ],
    });

    var panelDynamic = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("panel1")
    );
    var question1 = panelDynamic.panels[0].questions[0];
    var question2 = panelDynamic.panels[1].questions[0];
    question1.value = "1";
    question2.value = "1";
    assert.equal(survey.hasErrors(false), true, "There is a duplication error, #1");
    assert.equal(survey.hasErrors(false), true, "There is a duplication error, #2");
    assert.equal(survey.hasErrors(false), true, "There is a duplication error, #2");
    assert.equal(question2.errors.length, 0, "There is no errors, fireCallback parameter is false");
    assert.equal(survey.hasErrors(), true, "There is a duplication error, #3");
    assert.equal(survey.hasErrors(), true, "There is a duplication error, #4");
    assert.equal(survey.hasErrors(), true, "There is a duplication error, #5");
    assert.equal(question2.errors.length, 1, "There is one error");
  }
);

QUnit.test(
  "Do not reset panelCount after deleting the last panel, Bug #1972",
  function(assert) {
    var json = {
      questions: [
        {
          type: "paneldynamic",
          name: "panel1",
          templateElements: [
            {
              type: "text",
              name: "q1",
            },
          ],
          panelsState: "collapsed",
          panelCount: 3,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
    assert.equal(panel.panelCount, 3, "There are 3 panels by default");
    panel.removePanelUI(2);
    assert.equal(panel.panelCount, 2, "Remove the third panel");
    panel.removePanelUI(1);
    assert.equal(panel.panelCount, 1, "Remove the second panel");
    panel.removePanelUI(0);
    assert.equal(panel.panelCount, 0, "Remove the first panel");
  }
);

QUnit.test(
  "call clearFiles for QuestionFile on removing the panel, Bug #1970",
  function(assert) {
    var json = {
      questions: [
        {
          type: "paneldynamic",
          name: "panel1",
          templateElements: [
            {
              type: "text",
              name: "q1",
            },
            {
              type: "file",
              name: "q2",
            },
          ],
          panelCount: 3,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var counter = 0;
    survey.onClearFiles.add(function(sender, options) {
      counter++;
      options.callback("success");
      assert.equal(
        options.question.name,
        "q2",
        "Question is passed in options"
      );
    });
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
    (<QuestionFileModel>panel.panels[0].getQuestionByName("q2")).value =
      "data:image/jpeg;base64,FILECONTENT";
    panel.removePanelUI(0);
    assert.equal(counter, 1, "clear files was called");
  }
);
QUnit.test("call clear value on hidden dynamic panel, Bug #6336", function(assert) {
  const json = {
    questions: [
      {
        type: "text",
        name: "q1",
      },
      {
        type: "paneldynamic",
        name: "panel1",
        visibleIf: "{q1} = 1",
        templateElements: [
          {
            type: "text",
            name: "q2",
            clearIfInvisible: "onHiddenContainer",
          },
        ],
        panelCount: 1
      },
    ],
  };
  const survey = new SurveyModel(json);
  survey.setValue("q1", 1);
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const textQuestion = (<QuestionTextModel>panel.panels[0].getQuestionByName("q2"));
  textQuestion.value = "val1";
  assert.equal(textQuestion.isParentVisible, true, "file question parent is visible");
  survey.setValue("q1", 2);
  assert.equal(panel.isVisible, false, "panel is invisible");
  assert.equal(textQuestion.isParentVisible, false, "file question parent is invisible");
  assert.equal(textQuestion.isEmpty(), true, "question value is empty, #1");
  survey.setValue("q1", 1);
  assert.equal(textQuestion.isEmpty(), true, "question value is empty, #2");
});

QUnit.test("call clearFiles for QuestionFile on clearing panel value, Bug #6336", function(assert) {
  const json = {
    questions: [
      {
        type: "text",
        name: "q1",
      },
      {
        type: "paneldynamic",
        name: "panel1",
        visibleIf: "{q1} = 1",
        templateElements: [
          {
            type: "file",
            name: "q2",
            clearIfInvisible: "onHiddenContainer",
          },
        ],
        panelCount: 1
      },
    ],
  };
  const survey = new SurveyModel(json);
  var counter = 0;
  survey.onClearFiles.add(function(sender, options) {
    counter++;
    options.callback("success");
    assert.equal(
      options.question.name,
      "q2",
      "Question is passed in options"
    );
  });
  survey.setValue("q1", 1);
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const fileQuestion = (<QuestionFileModel>panel.panels[0].getQuestionByName("q2"));
  fileQuestion.value = "data:image/jpeg;base64,FILECONTENT";
  assert.equal(fileQuestion.isParentVisible, true, "file question parent is visible");
  survey.setValue("q1", 2);
  assert.equal(panel.isVisible, false, "panel is invisible");
  assert.equal(fileQuestion.isParentVisible, false, "file question parent is invisible");
  assert.equal(fileQuestion.isEmpty(), true, "question value is empty, #1");
  assert.equal(counter, 1, "clear files was called");
  survey.setValue("q1", 1);
  assert.equal(fileQuestion.isEmpty(), true, "question value is empty, #2");
});

QUnit.test(
  "Question padding right inside panel - https://github.com/surveyjs/survey-library/issues/1977",
  function(assert) {
    var json = {
      pages: [
        {
          name: "Fancy page",
          elements: [
            {
              type: "panel",
              title: "Large panel",
              name: "large_panel",
              state: "expanded",
              elements: [
                {
                  type: "paneldynamic",
                  title: " ",
                  name: "dynamic_panel",
                  templateElements: [
                    {
                      type: "text",
                      name: "field_one",
                      width: "60%",
                      startWithNewLine: false,
                      title: "Field One",
                    },
                    {
                      type: "text",
                      name: "field_two",
                      width: "40%",
                      startWithNewLine: false,
                      title: "Field Two",
                    },
                  ],
                  templateTitle: "Fancy Title",
                  panelCount: 2,
                  minPanelCount: 1,
                  panelsState: "expanded",
                  confirmDelete: true,
                  confirmDeleteText: "Are you sure you want to delete this?",
                  panelAddText: "  Add panel",
                  panelRemoveText: "   Delete",
                },
              ],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    setOldTheme(survey);
    var panel = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("dynamic_panel")
    );
    panel.panels[0].rows[0]["setWidth"](panel.panels[0].rows[0].visibleElements);
    assert.equal((<any>panel.panels[0].elements[0]).paddingRight, "20px");
    panel.panels[1].rows[0]["setWidth"](panel.panels[0].rows[0].visibleElements);
    assert.equal((<any>panel.panels[1].elements[0]).paddingRight, "20px");
    panel.panelCount++;
    assert.equal((<any>panel.panels[2].elements[0]).paddingRight, "20px");
  }
);

QUnit.test(
  "Panel dynamic with matrix dynamic inside, where matrix has defaultValue - Bug #1984, initial T3351(private)",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "question1",
          templateElements: [
            {
              type: "matrixdynamic",
              name: "question2",
              defaultValue: [
                {
                  "Column 1": 1,
                  "Column 2": 2,
                  "Column 3": 3,
                },
                {
                  "Column 2": 4,
                },
              ],
              columns: [
                {
                  name: "Column 1",
                },
                {
                  name: "Column 2",
                },
                {
                  name: "Column 3",
                },
              ],
              choices: [1, 2, 3, 4, 5],
            },
          ],
          panelCount: 1,
        },
      ],
    };
    var survey = new SurveyModel(json);
    var defaultValue = [
      {
        "Column 1": 1,
        "Column 2": 2,
        "Column 3": 3,
      },
      {
        "Column 2": 4,
      },
    ];
    var panel = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("question1")
    );
    assert.deepEqual(
      panel.template.questions[0].defaultValue,
      defaultValue,
      "Default value in template is correct"
    );
    var matrix = <QuestionMatrixDynamicModel>(
      panel.panels[0].getQuestionByName("question2")
    );
    assert.deepEqual(
      matrix.defaultValue,
      defaultValue,
      "Default value is copied"
    );
    assert.deepEqual(
      matrix.value,
      defaultValue,
      "value is copied from default value"
    );
  }
);
QUnit.test(
  "Do not change panelCount on loading in design-time, Bug #2291",
  function(assert) {
    var json = {
      elements: [
        {
          type: "paneldynamic",
          name: "measurements",
          templateElements: [
            {
              type: "paneldynamic",
              name: "Some details",
              panelCount: 1,
              templateElements: [{ type: "text", name: "q1" }],
            },
          ],
          panelCount: 0,
        },
      ],
    };
    var survey = new SurveyModel();
    survey.setDesignMode(true);
    survey.fromJSON(json);
    var q = <QuestionPanelDynamicModel>survey.getQuestionByName("measurements");
    assert.equal(q.panelCount, 0, "The panel count is 0");
  }
);
QUnit.test("currentPanel is templatePanel in design-mode", function(assert) {
  var json = {
    elements: [
      {
        type: "paneldynamic",
        name: "measurements",
        renderMode: "tab",
        templateElements: [
          {
            type: "text",
            name: "q1",
          },
        ],
        panelCount: 0,
      },
    ],
  };
  var survey = new SurveyModel();
  survey.setDesignMode(true);
  survey.fromJSON(json);
  var q = <QuestionPanelDynamicModel>survey.getQuestionByName("measurements");
  assert.ok(q.currentPanel, "Current panel exists");
  assert.equal(q.currentPanel.id, q.template.id, "Current panel equals to tempalte");
});

QUnit.test("getProgressInfo()", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1", isRequired: true },
          { type: "text", name: "q2" },
          { type: "text", name: "q3" },
        ],
      },
    ],
  });
  survey.data = { panel: [{ q1: "1" }, { q2: "2" }, []] };
  var question = survey.getQuestionByName("panel");
  assert.deepEqual(question.getProgressInfo(), {
    questionCount: 9,
    answeredQuestionCount: 2,
    requiredQuestionCount: 3,
    requiredAnsweredQuestionCount: 1,
  });
});

QUnit.test(
  "Matrix dynamic in nested dynamic panel and properties in condition functions",
  function(assert) {
    var parentQuestions = [];
    var testFunc = function(params: Array<any>) {
      parentQuestions = [];
      var q = this.question;
      while (!!q) {
        parentQuestions.push(q.name);
        q = q.parentQuestion;
      }
    };
    FunctionFactory.Instance.register("testFunc", testFunc);
    var json = {
      isSinglePage: true,
      elements: [
        {
          type: "paneldynamic",
          name: "panel1",
          panelCount: 1,
          templateElements: [
            {
              type: "paneldynamic",
              name: "nested1",
              panelCount: 1,
              templateElements: [
                {
                  type: "matrixdynamic",
                  name: "matrix",
                  columns: [
                    { cellType: "text", name: "col1", visibleIf: "testFunc()" },
                  ],
                  rowCount: 1,
                },
              ],
            },
          ],
        },
      ],
    };
    var survey = new SurveyModel(json);
    var rootPanel = survey.getQuestionByName("panel1");
    assert.ok(rootPanel, "root panel is here");
    var nestedPanel = rootPanel.panels[0].getQuestionByName("nested1");
    assert.ok(nestedPanel, "nested panel is here");
    assert.equal(
      nestedPanel.panels.length,
      1,
      "There is one panel in nested panel"
    );
    var matrix = nestedPanel.panels[0].getQuestionByName("matrix");
    assert.ok(matrix, "matrix is here");
    assert.equal(matrix.visibleRows.length, 1, "Row has been created");
    assert.deepEqual(
      parentQuestions,
      ["col1", "matrix", "nested1", "panel1"],
      "parent questions is correct"
    );
    FunctionFactory.Instance.unregister("testFunc");
  }
);
QUnit.test("Check paretQuestion", function(assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "rootPanel",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1" },
        ],
      },
    ],
  });
  const panelDynamic = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  assert.equal(panelDynamic.template.getQuestionByName("q1").parentQuestion.name, "rootPanel", "q1 - template");
  assert.equal(panelDynamic.panels[0].getQuestionByName("q1").parentQuestion.name, "rootPanel", "q1 - panel");
  panelDynamic.template.addNewQuestion("text", "q2");
  assert.equal(panelDynamic.template.getQuestionByName("q2").parentQuestion.name, "rootPanel", "q2 - template");
  assert.equal(panelDynamic.panels[0].getQuestionByName("q2").parentQuestion.name, "rootPanel", "q2 - panel");
});
QUnit.test("Avoid stack-overflow", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1", isRequired: true },
          { type: "text", name: "q2" },
          { type: "text", name: "q3" },
        ],
      },
    ],
  });
  survey.onDynamicPanelItemValueChanged.add((sender, options) => {
    if (options.name == "q1") {
      options.panel.getQuestionByName("q2").value = "2";
    }
    if (options.name == "q2") {
      options.panel.getQuestionByName("q1").value = "1";
    }
  });

  var question = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  question.panelCount = 1;
  question.panels[0].getQuestionByName("q1").value = "1";
  assert.deepEqual(
    question.value,
    [{ q1: "1", q2: "2" }],
    "Value set and there is no stack-overflow"
  );
});

QUnit.test("survey.onDynamicPanelValueChanging event", function(assert) {
  const survey = new SurveyModel({ elements: [{
    type: "paneldynamic",
    name: "panel",
    templateElements: [
      { type: "text", name: "q1", isRequired: true },
      { type: "text", name: "q2" },
      { type: "text", name: "q3" },
    ]
  }] });
  const opt = new Array<any>();
  survey.onDynamicPanelValueChanging.add((sender, options: DynamicPanelValueChangingEvent) => {
    opt.push({ name: options.name, value: options.value, oldValue: options.oldValue, panelIndex: options.panelIndex });
  });

  const question = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  question.panelCount = 2;
  question.panels[0].getQuestionByName("q1").value = "1";
  question.panels[1].getQuestionByName("q2").value = "2";
  question.panels[0].getQuestionByName("q1").value = "3";
  question.panels[1].getQuestionByName("q2").value = "4";
  assert.deepEqual(opt,
    [{ name: "q1", panelIndex: 0, value: "1", oldValue: undefined },
      { name: "q2", panelIndex: 1, value: "2", oldValue: undefined },
      { name: "q1", panelIndex: 0, value: "3", oldValue: "1" },
      { name: "q2", panelIndex: 1, value: "4", oldValue: "2" }],
    "Check event calls");
});

QUnit.test("getPanelWrapperCss", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  setOldTheme(survey);
  const question = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const panel = question.panels[0];
  assert.equal(
    question.getPanelWrapperCss(panel),
    "sv_p_wrapper",
    "Default rendering: remove button in the bottom of the panel"
  );
  question.panelRemoveButtonLocation = "right";
  assert.equal(
    question.getPanelWrapperCss(panel),
    "sv_p_wrapper sv_p_wrapper_in_row",
    "Non-default rendering: remove button in the right of the panel"
  );
});
QUnit.test("getPanelWrapperCss & templateVisibleIf", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 2,
        templateVisibleIf: "{panelIndex} > 0",
        templateElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  setOldTheme(survey);
  const question = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(question.panels[0].isVisible, false, "The firt panel is not visible");
  assert.equal(question.getPanelWrapperCss(question.panels[0]), "", "panel invisible");
  assert.equal(question.panels[1].isVisible, true, "The second panel is visible");
  assert.equal(question.getPanelWrapperCss(question.panels[1]), "sv_p_wrapper", "panel visible");
  assert.equal(question.getPanelWrapperCss(undefined), "sv_p_wrapper", "panel is empty");
});

QUnit.test("getPanelRemoveButtonCss", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [{ type: "text", name: "q1" }],
      },
    ],
  });
  setOldTheme(survey);
  var question = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(
    question.getPanelRemoveButtonCss(),
    "sv_p_remove_btn",
    "Default rendering: remove button in the bottom of the panel"
  );
  question.panelRemoveButtonLocation = "right";
  assert.equal(
    question.getPanelRemoveButtonCss(),
    "sv_p_remove_btn sv_p_remove_btn_right",
    "Non-default rendering: remove button in the right of the panel"
  );
});
QUnit.test(
  "PanelDynamic, support panelIndex in expressions, Issue#2760",
  function(assert) {
    var survey = new SurveyModel();
    var page = survey.addNewPage("p");
    var panel = <QuestionPanelDynamicModel>(
      page.addNewQuestion("paneldynamic", "panel")
    );
    var q1 = panel.template.addNewQuestion("text", "q1");
    q1.defaultValueExpression = "{panelIndex} + 1";
    panel.panelCount = 2;
    assert.equal(
      panel.panels[0].questions[0].value,
      1,
      "Set 1 from defaultValueExpression"
    );
    assert.equal(
      panel.panels[1].questions[0].value,
      2,
      "Set 2 from defaultValueExpression"
    );
  }
);
QUnit.test(
  "Unable to Preview a Matrix Dynamic inside of a Panel Dynamic , Bug#2761",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "paneldynamic",
          name: "panel",
          templateElements: [
            {
              type: "matrixdynamic",
              name: "matrix",
              columns: [
                {
                  name: "col1",
                },
              ],
              choices: [1],
              rowCount: 1,
            },
          ],
        },
      ],
      showPreviewBeforeComplete: "showAnsweredQuestions",
    });
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
    panel.addPanel();
    panel.panels[0].questions[0].visibleRows[0].cells[0].question.value = 1;
    survey.showPreview();
    assert.equal(survey.state, "preview", "We show preview");
    assert.deepEqual(survey.data, { panel: [{ matrix: [{ col1: 1 }] }] });
  }
);
QUnit.test(
  "Preview and survey.onDynamicPanelAdded event, Bug#4523",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "paneldynamic",
          name: "panel",
          templateElements: [
            {
              type: "dropdown",
              choices: [{ value: 1, text: "item1" }],
            },
          ],
        },
      ],
      showPreviewBeforeComplete: "showAnsweredQuestions",
    });
    survey.onDynamicPanelAdded.add(function (survey, options) {
      options.panel.questions[0].choices.push(new ItemValue(2, "Item2"));
    });
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
    panel.addPanel();
    panel.panels[0].questions[0].value = 2;
    assert.equal(panel.panels[0].questions[0].displayValue, "Item2");
    survey.showPreview();
    panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
    assert.equal(panel.panels[0].questions[0].choices.length, 2, "Choices is added, #1");
    assert.equal(panel.panels[0].questions[0].displayValue, "Item2", "display value is correct, #1");
    survey.cancelPreview();
    panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
    assert.equal(panel.panels[0].questions[0].choices.length, 2, "Choices is added, #2");
    assert.equal(panel.panels[0].questions[0].displayValue, "Item2", "display value is correct, #2");
  }
);

QUnit.test(
  "question.indent property doesn't work inside Panel Dynamic , Bug#2764",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "paneldynamic",
          name: "panel",
          templateElements: [
            {
              type: "text",
              name: "question1",
              indent: 1,
            },
            {
              type: "panel",
              name: "nestedPanel",
              indent: 2,
              elements: [
                {
                  type: "text",
                  name: "question2",
                  indent: 3,
                },
              ],
            },
          ],
          panelCount: 1,
        },
      ],
    });
    var panel = <QuestionPanelDynamicModel>(
      survey.getQuestionByName("panel").panels[0]
    );
    assert.equal(
      panel.questions[0].paddingLeft,
      "20px",
      "set padding for the first question"
    );
    assert.equal(
      panel.elements[1].paddingLeft,
      "40px",
      "set padding for the nested panel"
    );
    assert.equal(
      panel.elements[1].questions[0].paddingLeft,
      "60px",
      "set padding for a question in the nested panel"
    );
  }
);
QUnit.test("templateTitle test + survey.onValueChanged", function(assert) {
  var survey = new SurveyModel({
    questions: [
      {
        name: "question1",
        type: "paneldynamic",
        allowAddPanel: false,
        allowRemovePanel: false,
        templateTitle: "{panel.sameVariable}",
      },
      {
        type: "radiogroup",
        name: "question2",
        choices: ["sample title 1", "sample title 2"],
      },
    ],
  });
  survey.onValueChanged.add((sender, options) => {
    if (options.name == "question2") {
      sender.getQuestionByName("question1").value = [
        { sameVariable: options.value },
      ];
    }
  });
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("question1");
  assert.equal(panel.panelCount, 0, "There is no any panel");
  var question2 = survey.getQuestionByName("question2");
  question2.value = question2.choices[0].value;
  assert.equal(panel.panelCount, 1, "One panel is added");
  assert.equal(
    panel.panels[0].locTitle.textOrHtml,
    "sample title 1",
    "the first panel title set correctly"
  );
  question2.value = question2.choices[1].value;
  assert.equal(panel.panelCount, 1, "We still have one panel");
  assert.equal(
    panel.panels[0].locTitle.textOrHtml,
    "sample title 2",
    "the first panel title set correctly again"
  );
});
QUnit.test("defaultValue &  survey.onValueChanged on adding new panel", function(assert) {
  const survey = new SurveyModel({
    questions: [
      { type: "text", name: "val1" },
      {
        name: "panel",
        type: "paneldynamic",
        templateElements: [
          { type: "expression", name: "q5", expression: "{panel.q4} + {panel.q3}" },
          { type: "text", name: "q1", defaultValue: 1 },
          { type: "text", name: "q2", defaultValue: 2 },
          { type: "text", name: "q3", defaultValueExpression: "{panel.q1} + {panel.q2}" },
          { type: "text", name: "q4", defaultValueExpression: "{val1}" }
        ]
      }
    ],
  });
  survey.setValue("val1", 4);
  let counter = 0;
  survey.onValueChanged.add((sender, options) => {
    counter ++;
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  panel.addPanel();
  assert.deepEqual(panel.value, [{ q1: 1, q2: 2, q3: 3, q4: 4, q5: 7 }], "panel.value #1");
  assert.equal(counter, 1, "survey.onValueChanged call times #1");
  panel.addPanel();
  assert.deepEqual(panel.value, [{ q1: 1, q2: 2, q3: 3, q4: 4, q5: 7 }, { q1: 1, q2: 2, q3: 3, q4: 4, q5: 7 }], "panel.value #2");
  assert.equal(counter, 2, "survey.onValueChanged call times #2");
});
QUnit.test(
  "Dependend choices not working properly in PanelDynamic Bug #2851",
  function(assert) {
    var survey = new SurveyModel({
      elements: [
        {
          type: "checkbox",
          name: "q1",
          choices: ["A", "B", "C", "D", "E"],
        },
        {
          type: "paneldynamic",
          name: "panel",
          templateElements: [
            {
              type: "dropdown",
              name: "q2",
              choicesFromQuestion: "q1",
              choicesFromQuestionMode: "selected",
            },
          ],
        },
      ],
    });
    survey.getQuestionByName("q1").value = ["A", "B", "C"];
    var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
    panel.panelCount = 1;
    var q2 = <QuestionDropdownModel>panel.panels[0].getQuestionByName("q2");
    assert.equal(q2.visibleChoices.length, 3, "has 3 items from q1");
    assert.equal(q2.visibleChoices[1].value, "B", "the second value is B");
    survey.getQuestionByName("q1").value = ["C"];
    assert.equal(q2.visibleChoices.length, 1, "has one item from q1");
    assert.equal(q2.visibleChoices[0].value, "C", "the only item is C");
  }
);
QUnit.test("Dynamic Panel, getDisplayValue(), Bug#2855", function(assert) {
  var json = {
    questions: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 3,
        templateElements: [
          {
            type: "text",
            name: "q1",
            title: "Question 1",
          },
          {
            type: "dropdown",
            name: "q2",
            title: "Question 2",
            choices: [
              { value: 1, text: "A" },
              { value: 2, text: "B" },
            ],
          },
        ],
      },
    ],
  };
  var survey = new SurveyModel(json);
  var panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.deepEqual(
    panel.getDisplayValue(true, [{ q1: "a", q2: 1 }, { q2: 2 }]),
    [{ "Question 1": "a", "Question 2": "A" }, { "Question 2": "B" }],
    "Do not use value"
  );
});
QUnit.test("Support panel dynamic for isContainerReady", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "templateElements": [
          {
            "type": "text",
            "name": "q1",
            "isRequired": true
          },
          {
            "type": "expression",
            "name": "exp1",
            "expression": "isContainerReady('panel1', {panelIndex})",
          }
        ],
        "panelCount": 2,
      },
      {
        "type": "expression",
        "name": "exp2",
        "expression": "isContainerReady('panel1')",
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const panel1Exp = panel.panels[0].getQuestionByName("exp1");
  const panel2Exp = panel.panels[1].getQuestionByName("exp1");
  const exp = survey.getQuestionByName("exp2");
  assert.equal(panel1Exp.value, false, "panel1Exp");
  assert.equal(panel2Exp.value, false, "panel2Exp");
  assert.equal(exp.value, false, "exp");

  panel.panels[0].getQuestionByName("q1").value = "val1";
  assert.equal(panel1Exp.value, true, "panel1Exp");
  assert.equal(panel2Exp.value, false, "panel2Exp");
  assert.equal(exp.value, false, "exp");

  panel.panels[1].getQuestionByName("q1").value = "val1";
  assert.equal(panel1Exp.value, true, "panel1Exp");
  assert.equal(panel2Exp.value, true, "panel2Exp");
  assert.equal(exp.value, true, "exp");
});

QUnit.test("cssClasses for a question in nested panel dynamic, #1", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "templateElements": [
          {
            "type": "paneldynamic",
            "name": "panel2",
            "templateElements": [
              {
                "type": "text",
                "name": "q1",
                "isRequired": true
              }
            ],
            "panelCount": 1,
          }
        ],
        "panelCount": 1,
      }
    ]
  });
  const rootPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const nestedPanel = <QuestionPanelDynamicModel>rootPanel.panels[0].getQuestionByName("panel2");
  const question = nestedPanel.panels[0].getQuestionByName("q1");
  assert.ok(question.cssClassesValue.mainRoot, "Main root style is set");
});
QUnit.test("cssClasses for a question in nested panel dynamic, #2", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "templateElements": [
          {
            "type": "paneldynamic",
            "name": "panel2",
            "templateElements": [
              {
                "type": "text",
                "name": "q1",
              },
              {
                "type": "text",
                "name": "q2",
                "startWithNewLine": false
              }
            ],
            "panelCount": 1,
          }
        ],
        "panelCount": 1,
      }
    ]
  });
  const rootPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const nestedPanel = <QuestionPanelDynamicModel>rootPanel.panels[0].getQuestionByName("panel2");
  const panel = nestedPanel.panels[0];
  const question = panel.getQuestionByName("q1");
  assert.equal(question.wasRendered, true, "question.onFirstRendering was called");
  assert.ok(question.cssClassesValue.mainRoot, "Main root style is set");
  assert.equal(panel.rows.length, 1, "There is one row");
  const row = panel.rows[0];
  assert.equal(row.visibleElements.length, 2, "There are two visible elements");
  assert.ok(panel.cssClasses.row, "panel classes has value");
  assert.ok(row.getRowCss(), "There are values");
});

QUnit.test("noEntriesText property for panel dynamic", function (assert) {
  let survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "q1",
        "noEntriesText": "text1"
      }
    ]
  });
  let question = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  assert.equal(question.noEntriesText, "text1", "noEntriesText set via JSON");
  question.noEntriesText = "text2";
  assert.equal(question.noEntriesText, "text2", "noEntriesText set via API");
  survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "q1",
      }
    ]
  });
  question = <QuestionPanelDynamicModel>survey.getQuestionByName("q1");
  assert.equal(question.noEntriesText, "No entries yet.\nClick the button below to add a new entry.", "noEntriesText default value");
});

QUnit.test("noEntriesReadonlyText property for panel dynamic", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { "type": "paneldynamic", "name": "panel1" },
      { "type": "paneldynamic", "name": "panel2", allowAddPanel: false },
    ]
  });
  const panel1 = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const panel2 = <QuestionPanelDynamicModel>survey.getQuestionByName("panel2");
  assert.equal(panel1.noEntriesText.indexOf("No entries yet.\nClick the button below to add a new entry."), 0, "panel1 default");
  assert.equal(panel2.noEntriesText.indexOf("No entries"), 0, "panel2: text for allowAddPanel false");
  panel1.allowAddPanel = false;
  assert.equal(panel1.noEntriesText.indexOf("No entries"), 0, "panel1: text for allowAddPanel false");
  assert.equal(panel2.noEntriesText.indexOf("No entries"), 0, "panel2: text for allowAddPanel false");
});

QUnit.test("Question defaultValueExpression in panel dynamic", function(
  assert
) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1", defaultValue: 1 },
          { type: "text", name: "q2", defaultValueExpression: "{panel.q1} + 2" },
        ],
      }
    ] });
  const panel = (<QuestionPanelDynamicModel>survey.getQuestionByName("panel")).panels[0];
  const q1 = panel.getQuestionByName("q1");
  const q2 = panel.getQuestionByName("q2");
  assert.equal(q2.value, 3, "initial value");
  q1.value = 5;
  assert.equal(q2.value, 7, "q1 is changed");
  q2.value = 4;
  assert.equal(q2.value, 4, "changed dirrectly");
  q1.value = 10;
  assert.equal(q2.value, 4, "stop react on defaultValueExpression");
});
QUnit.test("Check go prev/next", function(assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "rootPanel",
        panelCount: 2,
        renderMode: "progressTop",
        templateElements: [
          { type: "text", name: "q1" },
        ],
      },
    ],
  });
  const panelDynamic = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  assert.equal(panelDynamic.currentIndex, 0, "first panel");
  assert.equal(panelDynamic.panelCount, 2, "2 panels");
  panelDynamic.goToNextPanel();
  assert.equal(panelDynamic.currentIndex, 1, "second panel 1");
  panelDynamic.goToNextPanel();
  assert.equal(panelDynamic.currentIndex, 1, "second panel 2");
  panelDynamic.goToPrevPanel();
  assert.equal(panelDynamic.currentIndex, 0, "first panel 3");
  panelDynamic.goToPrevPanel();
  assert.equal(panelDynamic.currentIndex, 0, "first panel 4");

  panelDynamic.removePanel(0);
  assert.equal(panelDynamic.panelCount, 1, "1 panel");
  assert.equal(panelDynamic.currentIndex, 0, "first panel 5");
  panelDynamic.goToPrevPanel();
  assert.equal(panelDynamic.currentIndex, 0, "first panel 6");
  panelDynamic.goToNextPanel();
  assert.equal(panelDynamic.currentIndex, 0, "first panel 7");

  panelDynamic.removePanel(0);
  assert.equal(panelDynamic.panelCount, 0, "no panels");
  assert.equal(panelDynamic.currentIndex, -1, "first panel? 8");
  panelDynamic.goToNextPanel();
  assert.equal(panelDynamic.currentIndex, -1, "first panel? 9");
  panelDynamic.goToPrevPanel();
  assert.equal(panelDynamic.currentIndex, -1, "first panel? 10");

  panelDynamic.addPanel();
  assert.equal(panelDynamic.currentIndex, 0, "first panel 11");
  assert.equal(panelDynamic.panelCount, 1, "1 panels");
});
QUnit.test("Bindings to panelCount performance issue", function(assert) {
  var counter = 1;
  const calcCount = () => { return counter ++; };
  FunctionFactory.Instance.register("calcCount", calcCount);
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "paneldynamic",
        name: "panel1",
        bindings: {
          "panelCount": "q1"
        },
        templateElements: [
          { type: "text", name: "panel1_q1", visibleIf: "calcCount() > 1" },
        ],
      },
      {
        type: "paneldynamic",
        name: "panel2",
        bindings: {
          "panelCount": "q1"
        },
        templateElements: [
          { type: "text", name: "panel2_q1", visibleIf: "calcCount() > 1" },
        ],
      },
    ],
  });
  assert.equal(counter, 1, "There is no questions");
  survey.setValue("q1", 2);
  assert.equal(counter, 1 + 4 * 2, "4 questions has been created");
  FunctionFactory.Instance.unregister("calcCount");
});
QUnit.test("Bindings to panelCount performance issue", function(assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel1",
        panelCount: 2,
        templateElements: [
          { type: "text", name: "q1" },
          {
            type: "matrixdynamic",
            name: "q2",
            bindings: {
              "rowCount": "q1"
            },
            columns: [
              { name: "col1" }
            ]
          }
        ],
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  panel.panels[0].questions[0].value = 3;
  panel.panels[1].questions[0].value = 5;
  assert.equal(panel.panels[0].questions[1].rowCount, 3, "matrix in first panel binds correctly");
  assert.equal(panel.panels[1].questions[1].rowCount, 5, "matrix in second panel binds correctly");
});
QUnit.test("Bindings to panelCount performance issue #2 reduce recalc visibleIndex/no", function(assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      {
        type: "paneldynamic",
        name: "panel1",
        bindings: {
          "panelCount": "q1"
        },
        templateElements: [
          { type: "text", name: "panel1_q1" },
          { type: "text", name: "panel1_q2", visibleIf: "{q1} > 7" }
        ],
      },
      {
        type: "paneldynamic",
        name: "panel2",
        bindings: {
          "panelCount": "q1"
        },
        templateElements: [
          { type: "text", name: "panel2_q1" },
          { type: "text", name: "panel2_q2", visibleIf: "{q1} > 7" }
        ],
      },
      {
        type: "paneldynamic",
        name: "panel3",
        bindings: {
          "panelCount": "q1"
        },
        templateElements: [
          { type: "text", name: "panel3_q1" },
          { type: "text", name: "panel3_q2", visibleIf: "{q1} > 7" }
        ],
      },
    ],
  });
  var counter = 0;
  survey.onGetProgressText.add((sender, options) => {
    counter ++;
  });
  counter = 0;
  survey.setValue("q1", 5);
  const panel1 = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  assert.equal(panel1.panelCount, 5, "We have 5 panels");
  assert.equal(survey.progressText, "Page 1 of 1", "progressText");
  assert.equal(counter, 1, "update visible index calls only two times, on after binding (updateVisibleIndexes) and on value changed");
});
QUnit.test("Check needResponsiveWidth", function(assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "panel_q1" },
          { type: "text", name: "panel_q2", }
        ],
      },
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  panel.panelCount = 0;
  assert.equal(panel.needResponsiveWidth(), false);
  panel.panelCount = 2;
  assert.equal(panel.needResponsiveWidth(), false);
  panel.getPanel().elements[1].startWithNewLine = false;
  panel.panelCount = 0;
  assert.equal(panel.needResponsiveWidth(), true);
  panel.panelCount = 2;
  assert.equal(panel.needResponsiveWidth(), true);
});

QUnit.test("Check progress", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "progress_panel",
        renderMode: "progressTop",
        templateElements: [
          { type: "text", name: "panel_q1" },
          { type: "text", name: "panel_q2" }
        ],
        panelCount: 5
      },
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("progress_panel");
  panel.currentIndex = 0;
  assert.equal(panel.progress, "20%", "check progress 1 of 5");
  panel.currentIndex = 2;
  assert.equal(panel.progress, "60%", "check progress 3 of 5");
  panel.currentIndex = 4;
  assert.equal(panel.progress, "100%", "check progress 5 of 5");
});
QUnit.test("Check paneldynamic navigation", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "progress_panel",
        renderMode: "progressTop",
        templateElements: [
          { type: "text", name: "panel_q1" },
        ],
        panelCount: 5
      },
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("progress_panel");
  survey.css = defaultCss;
  panel.currentIndex = 0;
  assert.equal(panel.footerToolbar.actions[0].visible, false, "prev (text) btn is not visible when currentIndex is 0/4");
  assert.equal(panel.footerToolbar.actions[1].visible, true, "next (text) btn is visible when currentIndex is 0/4");
  assert.equal(panel.canAddPanel, false, "can't add panel when currentIndex less then panelCount");
  panel.currentIndex = 2;
  assert.equal(panel.footerToolbar.actions[0].visible, true, "prev (text) btn is visible when currentIndex is 2/4");
  assert.equal(panel.footerToolbar.actions[1].visible, true, "next (text) btn is visible when currentIndex is 2/4");
  assert.equal(panel.canAddPanel, false, "can't add panel when currentIndex less then panelCount");
  panel.currentIndex = 4;
  assert.equal(panel.footerToolbar.actions[0].visible, true, "prev (text) btn is visible when currentIndex is 4/4");
  assert.equal(panel.footerToolbar.actions[1].visible, false, "next (text) btn is visible when currentIndex is 4/4");
  assert.equal(panel.canAddPanel, true, "can add panel when currentIndex less then panelCount");
  panel["legacyNavigation"] = true;
  panel.currentIndex = 2;
  assert.equal(panel.footerToolbar.actions[0].visible, false, "prev (text) btn is not visible in legacy mode");
  assert.equal(panel.footerToolbar.actions[1].visible, false, "next (text) btn is not visible in legacy mode");
  assert.equal(panel.canAddPanel, true, "can always add panel in legacy mode");
  assert.equal(panel.footerToolbar.actions[3].visible, true, "prev (icon) btn is visible in legacy mode");
  assert.equal(panel.footerToolbar.actions[5].visible, true, "next (icon) btn is visible in legacy mode");
  panel["legacyNavigation"] = false;
  panel.renderMode = "list";
  assert.equal(panel.footerToolbar.actions[0].visible, false, "prev (text) btn is not visible in list mode");
  assert.equal(panel.footerToolbar.actions[1].visible, false, "next (text) btn is not visible in list mode");
  assert.equal(panel.canAddPanel, true, "can always add panel in list mode");
  panel.renderMode = "progressTop";
  panel.isMobile = true;
  assert.equal(panel.footerToolbar.actions[4].visible, false, "progress text is not visible in mobile mode");
});
QUnit.test("paneldynamic add new button is not visible for progress render mode, bug#5600", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "progress_panel",
        renderMode: "progressTopBottom",
        templateElements: [
          { type: "text", name: "panel_q1" },
        ],
      },
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("progress_panel");
  const addBtn = panel.footerToolbar.getActionById("sv-pd-add-btn");
  assert.equal(addBtn.isVisible, true, "It is visible by default");
  panel.addPanel();
  for(var i = 0; i < 4; i ++) {
    panel.addPanel();
    assert.equal(addBtn.isVisible, true, "It is visible by default");
  }
  assert.equal(panel.panelCount, 5, "We have 5 panels");
});

QUnit.test("call locationChangedCallback for cell question", function(
  assert
) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 2,
        templateElements: [
          { type: "text", name: "panel_q1" },
        ],
      }
    ] });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  let counter = 0;
  panel.panels[1].questions[0].localeChangedCallback = () => { counter ++; };
  survey.locale = "de";
  survey.locale = "";
  assert.equal(counter, 2, "locationChangedCallback called");
});
QUnit.test("checkbox vs valuePropertyName and display text", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: [{ value: 1, text: "apple" }, { value: 2, text: "banana" }, { value: 3, text: "orange" }],
        valueName: "data1",
        valuePropertyName: "fruit",
        hasOther: true
      },
      {
        type: "paneldynamic",
        name: "panel",
        valueName: "data1",
        templateTitle: "{panel.fruit}",
        templateElements: [
          { type: "text", name: "panel_q1", title: "{panel.fruit}" },
        ],
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  q.renderedValue = [1, 3];
  assert.equal(panel.panelCount, 2, "There are two panels");
  assert.equal(panel.panels[0].locTitle.renderedHtml, "apple", "panel1 title");
  assert.equal(panel.panels[1].locTitle.renderedHtml, "orange", "panel2 title");
  const p1_q1 = panel.panels[0].getQuestionByName("panel_q1");
  const p2_q1 = panel.panels[1].getQuestionByName("panel_q1");
  assert.equal(p1_q1.locTitle.renderedHtml, "apple", "title for question in panel1");
  assert.equal(p2_q1.locTitle.renderedHtml, "orange", "title for question in panel2");
});
QUnit.test("checkbox vs valuePropertyName and display text and useDisplayValuesInDynamicTexts = false", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "checkbox",
        name: "q1",
        choices: [{ value: 1, text: "apple" }, { value: 2, text: "banana" }, { value: 3, text: "orange" }],
        valueName: "data1",
        valuePropertyName: "fruit",
        useDisplayValuesInDynamicTexts: false
      },
      {
        type: "paneldynamic",
        name: "panel",
        valueName: "data1",
        templateTitle: "{panel.fruit}",
        templateElements: [
          { type: "text", name: "panel_q1", title: "{panel.fruit}" },
        ],
      }
    ]
  });
  const q = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  q.renderedValue = [1, 3];
  assert.equal(panel.panelCount, 2, "There are two panels");
  assert.equal(panel.panels[0].locTitle.renderedHtml, 1, "panel1 title");
  assert.equal(panel.panels[1].locTitle.renderedHtml, 3, "panel2 title");
  const p1_q1 = panel.panels[0].getQuestionByName("panel_q1");
  const p2_q1 = panel.panels[1].getQuestionByName("panel_q1");
  assert.equal(p1_q1.locTitle.renderedHtml, 1, "title for question in panel1");
  assert.equal(p2_q1.locTitle.renderedHtml, 3, "title for question in panel2");
});
QUnit.test("Incorrect default value in panel dynamic", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        defaultValueExpression: "no",
        templateElements: [
          { type: "text", name: "panel_q1" },
        ],
        panelCount: 2
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(panel.panelCount, 2, "There are two panels");
  const p1_q1 = panel.panels[0].getQuestionByName("panel_q1");
  assert.equal(p1_q1.name, "panel_q1", "question name is correct");
});

QUnit.test("Check paneldynamic isReady flag with onDownloadFile callback", (assert) => {
  const survey = new SurveyModel({
    questions: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [
          {
            type: "file",
            name: "file1",
            storeDataAsText: false,
          }
        ],
        panelCount: 1
      }
    ],
  });
  const panel = survey.getAllQuestions()[0];
  const question = panel.panels[0].questions[0];
  let log = "";
  const callbacks = new Array<any>();
  const contents = new Array<string>();
  survey.onDownloadFile.add((survey, options) => {
    assert.equal(options.question.isReady, false);
    contents.push(options.content.replace("url", "content"));
    callbacks.push(options.callback);
    log += "->" + options.fileValue.name;
  });
  const readyLogs = new Array<boolean>();
  panel.onReadyChanged.add(() => {
    readyLogs.push(question.isReady);
  });
  survey.data = { panel: [{
    "file1": [{
      content: "url1",
      name: "file1.png",
      type: "image/png"
    }, {
      content: "url2",
      name: "file2.png",
      type: "image/png"
    }]
  }] };

  assert.equal(panel.isReady, false, "panel is not ready");
  assert.equal(log, "->file1.png->file2.png");
  assert.equal(callbacks.length, 2, "Two callbacks");
  for(let i = 0; i < callbacks.length; i ++) {
    callbacks[i]("success", contents[i]);
  }
  assert.equal(panel.isReady, true, "panel is ready");
  assert.deepEqual(panel.panels[0].questions[0].previewValue, [{
    content: "content1",
    name: "file1.png",
    type: "image/png"
  }, {
    content: "content2",
    name: "file2.png",
    type: "image/png"
  }]);
  assert.equal(readyLogs.length, 2, "readyLogs.length");
  assert.equal(readyLogs[0], false, "readyLogs[0]");
  assert.equal(readyLogs[1], true, "readyLogs[1]");

});
QUnit.test("Two nested invisible dynamic panels do not clear itself correctly, Bug#5206", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "rootPanel",
        panelCount: 1,
        templateElements: [
          {
            name: "q1",
            type: "radiogroup",
            choices: [1, 2, 3],
          },
          {
            name: "panel1",
            type: "paneldynamic",
            visibleIf: "{panel.q1} = 1",
            panelCount: 1,
            allowAddPanel: false,
            allowRemovePanel: false,
            templateElements: [
              {
                type: "text",
                name: "panel1_q1",
              },
            ],
          },
          {
            name: "panel2",
            type: "paneldynamic",
            visibleIf: "{panel.q1} = 1",
            panelCount: 1,
            allowAddPanel: false,
            allowRemovePanel: false,
            templateElements: [
              {
                type: "text",
                name: "panel2_q1",
              },
            ],
          },
        ],
      },
    ],
  });
  const rootPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("rootPanel");
  rootPanel.panels[0].getQuestionByName("q1").value = 2;
  survey.tryComplete();
  assert.deepEqual(survey.data, { "rootPanel": [{ "q1": 2 }] }, "There is no empty data for any nested panels");
});

QUnit.test("Check paneldynamic panel actions", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
        ],
        minPanelCount: 1,
        panelCount: 2,
        panelRemoveText: "Remove Panel"
      }
    ]
  });
  const paneldynamic = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  let updatedPanels: any[] = [];
  survey.onGetPanelFooterActions.add((sender, opt) => {
    assert.equal(sender, survey);
    assert.equal(opt.question, paneldynamic);
    assert.ok(paneldynamic.panels.indexOf(opt.panel) > -1);
    updatedPanels.push(opt.panel);
    opt.actions.push({
      id: "test",
      title: "test",
      action: () => {}
    });
  });
  assert.equal(paneldynamic.panels[0].footerActions.length, 0);
  assert.equal(paneldynamic.panels[0]["footerToolbarValue"], undefined);

  //panel actions should be created only after footerToolbar is requested

  const actions = paneldynamic.panels[0].getFooterToolbar().actions;
  paneldynamic.panels[1].getFooterToolbar();
  assert.deepEqual(updatedPanels, paneldynamic.panels);

  assert.equal(actions.length, 2);
  assert.equal(actions[0].component, "sv-paneldynamic-remove-btn");
  assert.equal(actions[1].title, "test");

  paneldynamic.removePanel(paneldynamic.panels[1]);

  assert.equal(actions.length, 2);
  assert.equal(actions[0].visible, false);
});
QUnit.test("Error in nested dynamic collapsed panel", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "rootPanel",
        "templateElements": [{
          "type": "paneldynamic",
          "name": "childPanel",
          "title": "childPanel",
          "state": "collapsed",
          "templateElements": [{
            "type": "multipletext",
            "name": "question1",
            "items": [{
              "name": "mtom",
              "isRequired": true,
              "inputType": "number"
            }]
          }],
          "panelCount": 1
        }],
        "panelCount": 1
      }]
  });
  const rootPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("rootPanel");
  const childPanel = <QuestionPanelDynamicModel>rootPanel.panels[0].getQuestionByName("childPanel");
  assert.equal(childPanel.state, "collapsed", "child panel State is collapsed by default");
  survey.tryComplete();
  assert.equal(childPanel.state, "expanded", "child panel state is expanded now");
});
QUnit.test("Error in nested dynamic collapsed panel && renderMode - progressTop", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "rootPanel",
        "templateElements": [{
          "type": "paneldynamic",
          "name": "childPanel",
          "title": "childPanel",
          "state": "collapsed",
          "templateElements": [{
            "type": "multipletext",
            "name": "question1",
            "items": [{
              "name": "mtom",
              "isRequired": true,
              "inputType": "number"
            }]
          }],
          "panelCount": 1
        }],
        "panelCount": 1,
        "renderMode": "progressTop"
      }]
  });
  const rootPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("rootPanel");
  const childPanel = <QuestionPanelDynamicModel>rootPanel.panels[0].getQuestionByName("childPanel");
  assert.equal(childPanel.state, "collapsed", "child panel State is collapsed by default");
  assert.equal(rootPanel.panelCount, 1, "There is one panel");
  rootPanel.addPanelUI();
  assert.equal(rootPanel.panelCount, 1, "There is still one panel");
  assert.equal(childPanel.state, "expanded", "child panel state is expanded now");
});
QUnit.test("Skip unknown questions", (assert) => {
  const survey = new SurveyModel({
    elements: [
      {
        "type": "paneldynamic",
        "name": "panel",
        "templateElements": [
          { "type": "textqqq", "name": "q1" },
          { "type": "text", "name": "q2" },
          { "name": "q3" }
        ],
        "panelCount": 1
      }]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(panel.panels[0].elements.length, 1, "There is one quesiton in panel");
});
QUnit.test("NoentriesText and readOnly", (assert) => {
  const survey = new SurveyModel({
    elements: [
      { "type": "paneldynamic", "name": "panel1" },
      { "type": "paneldynamic", "name": "panel2", readOnly: true },
    ]
  });
  const panel1 = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const panel2 = <QuestionPanelDynamicModel>survey.getQuestionByName("panel2");
  assert.equal(panel1.noEntriesText.indexOf("No entries yet."), 0, "panel1: text for editing");
  assert.equal(panel2.noEntriesText.indexOf("No entries"), 0, "panel2: text for readonly");
  survey.mode = "display";
  assert.equal(panel1.noEntriesText.indexOf("No entries"), 0, "panel1: text for readonly");
});
QUnit.test("Carry forward in panel dynamic", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "paneldynamic",
        "name": "panel",
        templateElements: [
          { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] },
          { type: "dropdown", name: "q2", choicesFromQuestion: "panel.q1", choicesFromQuestionMode: "selected" }
        ],
        panelCount: 1
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel").panels[0];
  const q1 = panel.getQuestionByName("q1");
  const q2 = panel.getQuestionByName("q2");
  assert.equal(q2.choicesFromQuestion, "panel.q1", "choicesFromQuestion is loaded");
  assert.equal(q2.choicesFromQuestionMode, "selected", "choicesFromQuestionMode is loaded");
  assert.equal(q2.visibleChoices.length, 0, "There is no visible choices");
  q1.value = [1, 3, 5];
  assert.equal(q2.visibleChoices.length, 3, "Choices are here");
  assert.equal(q2.visibleChoices[1].value, 3, "A choice value is correct");
});
QUnit.test("Doesn't update value correctly for nested matrix with expressions, bug#5549", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
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
        ],
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const matrix = <QuestionMatrixDynamicModel>panel.panels[0].getQuestionByName("matrix");
  const cell = matrix.visibleRows[0].cells[0].question;
  cell.value = 10;
  assert.deepEqual(matrix.value, [{ col1: 10, col2: 20 }], "matrix value");
  assert.deepEqual(panel.value, [{ matrix: [{ col1: 10, col2: 20 }] }], "panel value");
  assert.deepEqual(survey.data, { panel: [{ matrix: [{ col1: 10, col2: 20 }] }] }, "survey.data");
});

QUnit.test("renderMode: tab, issue#5829", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "relatives",
        title: "Panel Dynamic",
        renderMode: "tab",
        templateTitle: "Information about: {panel.relativeType}",
        templateElements: [
          {
            name: "relativeType",
            type: "dropdown",
            title: "Relative",
            choices: [
              "father",
              "mother",
              "brother",
              "sister",
              "son",
              "daughter"
            ],
          },
          {
            name: "isalive",
            type: "radiogroup",
            title: "Alive?",
            startWithNewLine: false,
            colCount: 0,
            choices: ["Yes", "No"]
          },
          {
            name: "liveage",
            type: "dropdown",
            title: "Age",
            startWithNewLine: false,
            visibleIf: "{panel.isalive} = 'Yes'",
            choicesMin: 1,
            choicesMax: 115
          },
          {
            name: "deceasedage",
            type: "dropdown",
            title: "Deceased Age",
            startWithNewLine: false,
            visibleIf: "{panel.isalive} = 'No'",
            choices: [
              {
                value: -1,
                text: "Unknown"
              }
            ],
            choicesMin: 1,
            choicesMax: 115
          },
          {
            name: "causeofdeathknown",
            type: "radiogroup",
            title: "Cause of Death Known?",
            colCount: 0,
            startWithNewLine: false,
            visibleIf: "{panel.isalive} = 'No'",
            choices: ["Yes", "No"]
          },
          {
            name: "causeofdeath",
            type: "text",
            title: "Cause of Death",
            startWithNewLine: false,
            visibleIf:
              "{panel.isalive} = 'No' and {panel.causeofdeathknown} = 'Yes'"
          },
          {
            type: "panel",
            name: "moreInfo",
            state: "expanded",
            title: "Detail Information about: {panel.relativeType}",
            elements: [
              {
                type: "matrixdynamic",
                name: "relativeillness",
                title: "Describe the illness or condition.",
                rowCount: 0,
                columns: [
                  {
                    name: "illness",
                    cellType: "dropdown",
                    title: "Illness/Condition",
                    choices: [
                      "Cancer",
                      "Heart Disease",
                      "Diabetes",
                      "Stroke/TIA",
                      "High Blood Pressure",
                      "High Cholesterol or Triglycerides",
                      "Liver Disease",
                      "Alcohol or Drug Abuse",
                      "Anxiety, Depression or Psychiatric Illness",
                      "Tuberculosis",
                      "Anesthesia Complications",
                      "Genetic Disorder",
                      "Other – describe"
                    ],
                    isRequired: true
                  },
                  {
                    name: "description",
                    cellType: "text",
                    title: "Describe",
                    isRequired: true
                  }
                ]
              }
            ]
          }
        ],
        panelCount: 2,
        panelAddText: "Add a blood relative",
        panelRemoveText: "Remove the relative"
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("relatives");
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.ok(!!panel["tabbedMenuValue"], "tabbedMenuValue exist");
  assert.ok(panel.isRenderModeTab, "isRenderModeTab");
  assert.equal(panel.currentIndex, 0, "currentIndex is 0");
  assert.equal(panelTabToolbar.actions.length, 2, "2 panels");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "Panel 1", "Panel 1");
  assert.equal(panelTabToolbar.actions[0].pressed, true, "Panel 1 pressed true");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "Panel 2", "Panel 2");
  assert.equal(panelTabToolbar.actions[1].pressed, false, "Panel 2 pressed false");

  panel.currentIndex = 1;
  panel.addPanel();
  assert.equal(panel.currentIndex, 2, "currentIndex is 2");
  assert.equal(panelTabToolbar.actions.length, 3, "3 panels");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "Panel 1", "Panel 1");
  assert.equal(panelTabToolbar.actions[0].pressed, false, "Panel 1 pressed false");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "Panel 2", "Panel 2");
  assert.equal(panelTabToolbar.actions[1].pressed, false, "Panel 2 pressed false");
  assert.equal(panelTabToolbar.actions[2].locTitle.textOrHtml, "Panel 3", "Panel 3");
  assert.equal(panelTabToolbar.actions[2].pressed, true, "Panel 3 pressed true");

  panelTabToolbar.actions[1].action();
  assert.equal(panel.currentIndex, 1, "currentIndex is 1");

  panelTabToolbar.actions[2].action();
  assert.equal(panel.currentIndex, 2, "currentIndex is 2");

  panelTabToolbar.actions[0].action();
  assert.equal(panel.currentIndex, 0, "currentIndex is 0");
});

QUnit.test("renderMode: tab, check panelTabToolbar containerCss issue#5829", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "relatives",
        title: "Panel Dynamic",
        renderMode: "tab",
        tabAlign: "left"
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("relatives");
  survey.css = defaultCss;
  panel.cssClasses;
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.equal(panelTabToolbar.containerCss, "sd-tabs-toolbar sd-tabs-toolbar--left", "tabAlign value is left");

  panel.tabAlign = "right";
  assert.equal(panelTabToolbar.containerCss, "sd-tabs-toolbar sd-tabs-toolbar--right", "tabAlign value is right");

  panel.tabAlign = "center";
  assert.equal(panelTabToolbar.containerCss, "sd-tabs-toolbar sd-tabs-toolbar--center", "tabAlign default value is center");
});

QUnit.test("renderMode: tab check disableHide property", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "relatives",
        title: "Panel Dynamic",
        renderMode: "tab",
        templateTitle: "Information about: {panel.relativeType}",
        templateElements: [
          {
            type: "text",
            name: "q1"
          }
        ],
        panelCount: 2,
        panelAddText: "Add a blood relative",
        panelRemoveText: "Remove the relative"
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("relatives");
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.equal(panelTabToolbar.actions[0].disableHide, true);
  assert.equal(panelTabToolbar.actions[1].disableHide, false);

  panel.addPanel(2);
  assert.equal(panel.currentIndex, 2, "currentIndex is 2");
  assert.equal(panelTabToolbar.actions[0].disableHide, false);
  assert.equal(panelTabToolbar.actions[1].disableHide, false);
  assert.equal(panelTabToolbar.actions[2].disableHide, true);

  let log = "";
  panelTabToolbar.updateCallback = () => {
    log += "->raised";
  };
  panelTabToolbar.actions[1].mode = "popup";
  assert.equal(log, "");
  panel.currentIndex = 1;
  assert.ok(panelTabToolbar.actions[1].disableHide);
  assert.equal(log, "->raised");
  panel.currentIndex = 0;
  assert.notOk(panelTabToolbar.actions[1].disableHide);
  assert.ok(panelTabToolbar.actions[0].disableHide);
  assert.equal(log, "->raised");
  panelTabToolbar.actions[2].mode = "popup";
  panel.currentIndex = 2;
  assert.notOk(panelTabToolbar.actions[0].disableHide);
  assert.notOk(panelTabToolbar.actions[1].disableHide);
  assert.ok(panelTabToolbar.actions[2].disableHide);
  assert.equal(log, "->raised->raised");
});

QUnit.test("renderMode: tab check hasTabbedMenu property", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "relatives",
        renderMode: "tab",
        templateElements: [
          {
            type: "text",
            name: "q1"
          }
        ],
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("relatives");
  assert.notOk(panel.hasTabbedMenu);
  panel.addPanel(1);
  assert.ok(panel.hasTabbedMenu);
  panel.addPanel(2);
  assert.ok(panel.hasTabbedMenu);
});

QUnit.test("question.cssHeader class", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "relatives",
        title: "Panel Dynamic",
        renderMode: "tab",
        tabAlign: "left"
      }
    ],
  });
  setOldTheme(survey);
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("relatives");
  assert.equal(panel.cssHeader, "sv-paneldynamic__header sv_header");

  panel.addPanel();
  assert.equal(panel.cssHeader, "sv-paneldynamic__header sv_header sv-paneldynamic__header-tab");

  panel.renderMode = undefined;
  assert.equal(panel.cssHeader, "sv-paneldynamic__header sv_header");

  panel.titleLocation = "hidden";
  assert.equal(panel.cssHeader, "sv-paneldynamic__header sv_header");

  panel.renderMode = "tab";
  panel.titleLocation = "top";
  assert.equal(panel.cssHeader, "sv-paneldynamic__header sv_header sv-paneldynamic__header-tab");

  panel.removePanelUI(0);
  assert.equal(panel.cssHeader, "sv-paneldynamic__header sv_header");

});
QUnit.test("renderMode: tab & silent validation, Bug#8752", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel1",
        renderMode: "tab",
        templateElements: [
          {
            type: "text",
            name: "q1",
            isRequired: true
          }
        ],
        panelCount: 4,
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  panel.currentIndex = 3;
  survey.validate(false, false);
  assert.equal(panel.currentIndex, 3, "current index is not changed, #1");
  survey.validate(true, false);
  assert.equal(panel.currentIndex, 3, "current index is not changed, #2");
  survey.validate(false, true);
  assert.equal(panel.currentIndex, 0, "current index is not changed, #3");
});

QUnit.test("question.hasTitleOnLeftTop class", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "relatives",
        title: "Panel Dynamic",
        titleLocation: "hidden",
        tabAlign: "left"
      }
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("relatives");
  assert.equal(panel.hasTitleOnLeftTop, false, "titleLocation hidden");

  panel.renderMode = "tab";
  assert.equal(panel.hasTitleOnLeftTop, false, "renderMode is tab");

  panel.addPanel();
  assert.equal(panel.panels.length, 1, "There is one panel");
  assert.equal(panel.panels[0].visible, true, "There is one visiblePanel");
  assert.equal(panel.visiblePanelCount, 1, "There is one visible panel count");
  assert.equal(panel.hasTitleOnLeftTop, false, "title location should be independent on tabs visibility - tabs are visible and title location is hidden");

  panel.titleLocation = "top";
  assert.equal(panel.hasTitleOnLeftTop, true, "title location should be independent on tabs visibility - tabs are visible and title location is top");

  panel.titleLocation = "hidden";
  panel.renderMode = undefined;
  assert.equal(panel.hasTitleOnLeftTop, false, "title location should be independent on tabs visibility - tabs are invisible and title location is hidden");

  panel.titleLocation = "top";
  assert.equal(panel.hasTitleOnLeftTop, true, "title location should be independent on tabs visibility - tabs are invisible and title location top");

});
QUnit.test("Pass isMobile to the nested questions", function (assert) {
  const survey = new SurveyModel({
    "pages": [
      {
        "name": "page1",
        "elements": [
          {
            "type": "matrix",
            "name": "quality1",
            "title": "Please indicate if you agree or disagree with the following statements",
            "alternateRows": true,
            "columns": [
              {
                "value": 5,
                "text": "Strongly agree"
              },
              {
                "value": 4,
                "text": "Agree"
              },
              {
                "value": 3,
                "text": "Neutral"
              },
              {
                "value": 2,
                "text": "Disagree"
              },
              {
                "value": 1,
                "text": "Strongly disagree"
              }
            ],
            "rows": [
              {
                "value": "affordable",
                "text": "Product is affordable"
              },
              {
                "value": "does what it claims",
                "text": "Product does what it claims"
              },
              {
                "value": "better than others",
                "text": "Product is better than other products on the market"
              },
              {
                "value": "easy to use",
                "text": "Product is easy to use"
              }
            ],
            "isAllRowRequired": true
          },
          {
            "type": "paneldynamic",
            "name": "question1",
            "panelCount": 1,
            "templateElements": [
              {
                "type": "matrix",
                "name": "quality",
                "title": "Please indicate if you agree or disagree with the following statements",
                "alternateRows": true,
                "columns": [
                  {
                    "value": 5,
                    "text": "Strongly agree"
                  },
                  {
                    "value": 4,
                    "text": "Agree"
                  },
                  {
                    "value": 3,
                    "text": "Neutral"
                  },
                  {
                    "value": 2,
                    "text": "Disagree"
                  },
                  {
                    "value": 1,
                    "text": "Strongly disagree"
                  }
                ],
                "rows": [
                  {
                    "value": "affordable",
                    "text": "Product is affordable"
                  },
                  {
                    "value": "does what it claims",
                    "text": "Product does what it claims"
                  },
                  {
                    "value": "better than others",
                    "text": "Product is better than other products on the market"
                  },
                  {
                    "value": "easy to use",
                    "text": "Product is easy to use"
                  }
                ],
                "isAllRowRequired": true
              }
            ]
          }
        ]
      }
    ],
  });
  const matrix = <QuestionMatrixModel>survey.getQuestionByName("quality1");
  const dynPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("question1");

  survey.setIsMobile();
  assert.equal(matrix.isMobile, true, "Matrix is mobile");
  assert.equal(dynPanel.isMobile, true, "dynPanel is mobile");

  const innerMatrix = dynPanel.panels[0].elements[0] as QuestionMatrixModel;
  assert.equal(innerMatrix.isMobile, true, "innerMatrix is mobile");
});
QUnit.test("renderMode: tab, tabbedMenu&titles", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 2,
        renderMode: "tab"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.ok(panelTabToolbar.actions[0].locTitle.owner, "Owner is set");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "Panel 1");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "Panel 2");
  panel.templateTabTitle = "#{panelIndex} {panel.q1}";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1 ");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 ");
  panel.panels[0].getQuestionByName("q1").value = "q1-value";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1 q1-value");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 ");
});
QUnit.test("renderMode: tab, tabbedMenu&templateTabTitle in JSON", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 2,
        renderMode: "tab",
        templateTabTitle: "#{panelIndex} {panel.q1}"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1 ");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 ");
  let counter = 0;
  panelTabToolbar.actions[0].locTitle.onStringChanged.add((sender, options) => {
    counter++;
  });
  panel.panels[0].getQuestionByName("q1").value = "q1-value";
  assert.equal(counter, 1, "str has been changed");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1 q1-value");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 ");
  panel.addPanel();
  assert.strictEqual(panel.panels.indexOf(<PanelModel>panelTabToolbar.actions[2].locTitle.owner), 2, "Set correct panel as owner");
  panel.panels[2].getQuestionByName("q1").value = "q3-value";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1 q1-value");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 ");
  assert.equal(panelTabToolbar.actions[2].locTitle.textOrHtml, "#3 q3-value");
  panel.removePanel(1);
  assert.equal(panel.panels.indexOf(<PanelModel>panelTabToolbar.actions[1].locTitle.owner), 1, "Keep correct panel as owner");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1 q1-value");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 q3-value");
  panel.panels[1].getQuestionByName("q1").value = "q3-value!";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1 q1-value");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 q3-value!");
});
QUnit.test("renderMode: tab, tabbedMenu&titles&survey.onGetPanelDynamicTabTitle", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 2,
        renderMode: "tab"
      }],
  });
  survey.onGetDynamicPanelTabTitle.add((sender, options) => {
    if(options.visiblePanelIndex === 0) {
      const val = options.panel.getQuestionByName("q1").value;
      options.title = "First tab" + (!!val ? " " + val.toString() : "");
    }
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.ok(panelTabToolbar.actions[0].locTitle.owner, "Owner is set");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "First tab");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "Panel 2");
  panel.templateTabTitle = "#{panelIndex} {panel.q1}";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "First tab");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 ");
  panel.panels[0].getQuestionByName("q1").value = "q1-value";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "First tab q1-value");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2 ");
});
QUnit.test("templateVisibleIf", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 3,
        templateVisibleIf: "{panel.q1}='a'"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(panel.panels.length, 3, "There are two panels");
  assert.equal(panel.visiblePanels.length, 0, "There are 0 visible panels");
  assert.equal(panel.panels[0].visibleIf, "{panel.q1}='a'", "visibleIf for panel0");
  assert.equal(panel.panels[1].visibleIf, "{panel.q1}='a'", "visibleIf for panel1");
  assert.equal(panel.panels[2].visibleIf, "{panel.q1}='a'", "visibleIf for panel2");
  assert.equal(panel.panels[0].isVisible, false, "panel0 invisible #1");
  assert.equal(panel.panels[1].isVisible, false, "panel1 invisible #1");
  assert.equal(panel.panels[2].isVisible, false, "panel2 invisible #1");
  panel.value = [{ q1: "b" }, { q1: "a" }, { q1: "c" }];
  assert.equal(panel.panels[0].isVisible, false, "panel0 invisible #2");
  assert.equal(panel.panels[1].isVisible, true, "panel1 invisible #2");
  assert.equal(panel.panels[2].isVisible, false, "panel2 invisible #2");
  assert.equal(panel.visiblePanels.length, 1, "There is 1 visible panels");
});
QUnit.test("templateVisibleIf && currentPanelIndex", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 3,
        renderMode: "tab",
        templateVisibleIf: "{panel.q1}='a'"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(panel.panels.length, 3, "There are two panels");
  assert.equal(panel.visiblePanelCount, 0, "There are 0 visible panels");
  assert.equal(panel.currentIndex, -1, "currentIndex #1");
  panel.value = [{ q1: "a" }, { q1: "a" }, { q1: "a" }];
  assert.equal(panel.visiblePanelCount, 3, "There are three panels");
  assert.equal(panel.currentIndex, 0, "currentIndex #2");
  panel.currentIndex = -1;
  assert.equal(panel.currentIndex, 0, "currentIndex #3");
  panel.currentIndex = 100;
  assert.equal(panel.currentIndex, 2, "currentIndex #4");
  panel.value = [{ q1: "b" }, { q1: "a" }, { q1: "a" }];
  assert.equal(panel.currentIndex, 1, "currentIndex #5");
  panel.value = [{ q1: "b" }, { q1: "a" }, { q1: "c" }];
  assert.equal(panel.currentIndex, 0, "currentIndex #6");
  panel.value = [{ q1: "b" }, { q1: "d" }, { q1: "c" }];
  assert.equal(panel.currentIndex, -1, "currentIndex #7");
  panel.value = [{ q1: "b" }, { q1: "d" }, { q1: "a" }];
  assert.equal(panel.visiblePanelCount, 1, "There is one panel");
  assert.equal(panel.currentIndex, 0, "currentIndex #8");
});
QUnit.test("survey.onDynamicPanelCurrentIndexChanged", function (assert) {
  const survey = new SurveyModel();
  let questionName = "";
  let panelIndex = -2;
  let panelIndexOf = -2;
  survey.onDynamicPanelCurrentIndexChanged.add((_, options) => {
    questionName = options.question.name;
    panelIndex = options.visiblePanelIndex;
    panelIndexOf = !!options.panel ? options.question.visiblePanels.indexOf(options.panel) : -1;
  });
  survey.fromJSON({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 3,
        renderMode: "tab"
      }],
  });
  assert.equal(questionName, "panel", "question is correct");
  assert.equal(panelIndex, 0, "panelIndex #1");
  assert.equal(panelIndexOf, 0, "panelIndexOf #1");
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  panel.currentIndex = 1;
  assert.equal(panelIndex, 1, "panelIndex #2");
  assert.equal(panelIndexOf, 1, "panelIndexOf #2");
  panel.addPanel(-1);
  assert.equal(panel.currentIndex, 3, "panel.panelIndex #3");
  assert.equal(panelIndex, 3, "panelIndex #3");
  assert.equal(panelIndexOf, 3, "panelIndexOf #3");
  panel.removePanel(3);
  assert.equal(panel.currentIndex, 2, "panel.panelIndex #4");
  assert.equal(panelIndex, 2, "panelIndex #4");
  assert.equal(panelIndexOf, 2, "panelIndexOf #4");
});
QUnit.test("templateVisibleIf & renderMode: tab, tabbedMenu&templateTabTitle in JSON", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 3,
        templateVisibleIf: "{panel.q1}='a'",
        renderMode: "tab",
        templateTabTitle: "#{visiblePanelIndex}-{panelIndex} {panel.q1}"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.equal(panelTabToolbar.actions.length, 0, "All tabs are invisible");
  panel.value = [{ q1: "b" }, { q1: "c" }, { q1: "a" }];
  assert.equal(panelTabToolbar.actions.length, 1, "One tab is visible");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1-3 a");

  panel.value = [{ q1: "b" }, { q1: "a" }, { q1: "a" }];
  assert.equal(panelTabToolbar.actions.length, 2, "Two tabs are visible");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1-2 a");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2-3 a");

  panel.value = [{ q1: "a" }, { q1: "a" }, { q1: "a" }];
  assert.equal(panelTabToolbar.actions.length, 3, "Three tabs are visible");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "#1-1 a");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "#2-2 a");
  assert.equal(panelTabToolbar.actions[2].locTitle.textOrHtml, "#3-3 a");
});
QUnit.test("templateVisibleIf & renderMode: tab, templateTabTitle&tabTitlePlaceholder in JSON", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 2,
        renderMode: "tab",
        tabTitlePlaceholder: "Empty value",
        templateTabTitle: "{panel.q1}"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const panelTabToolbar = panel.tabbedMenu as AdaptiveActionContainer;
  assert.equal(panelTabToolbar.actions.length, 2, "There are two panels");
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "Empty value", "#1");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "Empty value", "#2");
  panel.panels[1].getQuestionByName("q1").value = "item2";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "Empty value", "#3");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "item2", "#4");
  panel.panels[0].getQuestionByName("q1").value = "item1";
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "item1", "#5");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "item2", "#6");
  panel.panels[1].getQuestionByName("q1").clearValue();
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "item1", "#7");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "Empty value", "#8");
  panel.locTabTitlePlaceholder.clear();
  assert.equal(panelTabToolbar.actions[0].locTitle.textOrHtml, "item1", "#9");
  assert.equal(panelTabToolbar.actions[1].locTitle.textOrHtml, "New Panel", "#10");
});
QUnit.test("templateVisibleIf & tabbedMenu", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ],
        panelCount: 3,
        templateVisibleIf: "{panel.q1}='a'",
        renderMode: "progressTop"
      }],
  });
  var oldCss = survey.css;
  survey.css = { root: "sd-root-modern" };
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const getAddBtn = () => {
    return panel.footerToolbar.getActionById("sv-pd-add-btn");
  };
  const getNextBtn = () => {
    return panel.footerToolbar.getActionById("sv-pd-next-btn");
  };
  panel.value = [{ q1: "b" }, { q1: "c" }, { q1: "a" }];
  assert.equal(getAddBtn().visible, true, "add button is visible #1");
  assert.equal(panel.canAddPanel, true, "canAddPanel #1");
  assert.equal(getNextBtn().visible, false, "nextButton #1");

  panel.value = [{ q1: "b" }, { q1: "a" }, { q1: "a" }];
  assert.equal(getAddBtn().visible, true, "add button is visible #2");
  assert.equal(panel.canAddPanel, true, "canAddPanel #2");
  assert.equal(getNextBtn().visible, false, "nextButton #2");
  panel.currentIndex = 0;
  assert.equal(getAddBtn().visible, false, "add button is invisible #3");
  assert.equal(panel.canAddPanel, false, "canAddPanel #3");
  assert.equal(getNextBtn().visible, true, "nextButton #3");
  panel.currentIndex = 1;
  assert.equal(getAddBtn().visible, true, "add button is visible #4");
  assert.equal(panel.canAddPanel, true, "canAddPanel #4");
  assert.equal(getNextBtn().visible, false, "nextButton #4");

  panel.value = [{ q1: "a" }, { q1: "a" }, { q1: "a" }];
  assert.equal(getAddBtn().visible, true, "add button is visible #5");
  assert.equal(panel.canAddPanel, true, "canAddPanel #5");
  assert.equal(getNextBtn().visible, false, "nextButton #5");
  panel.currentIndex = 1;
  assert.equal(getAddBtn().visible, false, "add button is invisible #6");
  assert.equal(panel.canAddPanel, false, "canAddPanel #6");
  assert.equal(getNextBtn().visible, true, "nextButton #6");
  survey.css = oldCss;
});
QUnit.test("templateVisibleIf & tabs action click, bug#8430", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" }
        ],
        panelCount: 4,
        templateVisibleIf: "{panel.q1}!='a'",
        renderMode: "tab"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const tabbedMenu = panel.tabbedMenu as AdaptiveActionContainer;
  assert.equal(tabbedMenu.visibleActions.length, 4, "There are 4 visible tabs");
  panel.panels[1].getQuestionByName("q1").value = "a";
  assert.equal(panel.currentIndex, 0, "Current Index 0");
  const panelId = panel.panels[2].id;
  assert.equal(tabbedMenu.visibleActions.length, 3, "There are 3 visible tabs");
  tabbedMenu.visibleActions[1].action();
  assert.equal(panel.currentIndex, 1, "Current Index 1");
  assert.equal(panel.currentPanel.id, panelId, "Select the correct panel");
});
QUnit.test("question.enableIf & add panel button visibility, Bug#6292", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        templateElements: [
          { type: "text", name: "q1" }
        ],
        enableIf: "{var1}='a'"
      }],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(panel.isReadOnly, true, "Panel is readonly, #1");
  assert.equal(panel.canAddPanel, false, "Panel is readonly, #2");
  const addBtn = panel.footerToolbar.getActionById("sv-pd-add-btn");
  assert.equal(addBtn.isVisible, false, "Add button is invisible, #3");
  survey.setValue("var1", "a");
  assert.equal(panel.isReadOnly, false, "Panel is editable, #4");
  assert.equal(panel.canAddPanel, true, "Panel is not readonly, #5");
  assert.equal(addBtn.isVisible, true, "Add button is visible, #6");
});
QUnit.test("newPanelPosition & add panel button visibility", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic",
        name: "panel",
        renderMode: "tab",
        newPanelPosition: "next",
        templateElements: [
          { type: "text", name: "q1" }
        ]
      }],
  });
  survey.css.root = "sd-root-modern";
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  panel.value = [{ q1: 1 }, { q1: 2 }, { q1: 3 }];
  panel.currentIndex = 0;
  assert.equal(panel.newPanelPosition, "next", "newPanelPosition #1");
  const addBtn = panel.footerToolbar.getActionById("sv-pd-add-btn");
  assert.equal(panel.canAddPanel, true, "canAddPanel, #1");
  assert.equal(addBtn.isVisible, true, "addBtn, #1");
  panel.newPanelPosition = "last";
  assert.equal(panel.visiblePanelCount, 3, "3 panels are visible");
  assert.equal(panel.currentIndex, 0, "the first panel is showing");
  assert.equal(panel.newPanelPosition, "last", "newPanelPosition #2");
  assert.equal(panel.canAddPanel, false, "canAddPanel, #2");
  assert.equal(addBtn.isVisible, false, "addBtn, #2");
  panel.currentIndex = 2;
  assert.equal(panel.canAddPanel, true, "canAddPanel, #3");
  assert.equal(addBtn.isVisible, true, "addBtn, #3");
  panel.currentIndex = 1;
  assert.equal(panel.canAddPanel, false, "canAddPanel, #4");
  assert.equal(addBtn.isVisible, false, "addBtn, #4");
  panel.newPanelPosition = "next";
  assert.equal(panel.newPanelPosition, "next", "newPanelPosition #3");
  assert.equal(panel.canAddPanel, true, "canAddPanel, #5");
  assert.equal(addBtn.isVisible, true, "addBtn, #5");
  panel.addPanelUI();
  assert.equal(panel.currentIndex, 2, "currentIndex is next");
  assert.equal(panel.panelCount, 4, "4 panels");
  assert.equal(panel.canAddPanel, true, "canAddPanel, #6");
  assert.equal(addBtn.isVisible, true, "addBtn, #5");
  survey.css.root = undefined;
});
QUnit.test("defaultValue in questions and set data", function (assert) {
  const survey = new SurveyModel({
    "elements": [{
      "name": "panel",
      "type": "paneldynamic",
      "templateElements": [
        {
          "name": "q1",
          "type": "text",
        },
        {
          "name": "q2",
          "type": "text",
          "defaultValue": 2
        }
      ]
    }
    ] });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  survey.data = { panel: [{ q1: "foo" }] };
  const q1 = panel.panels[0].getQuestionByName("q1");
  const q2 = panel.panels[0].getQuestionByName("q2");
  assert.equal(q1.value, "foo", "q1 is correct");
  assert.notOk(q2.value, "q2 is empty");
});
QUnit.test("Make sure that panel is not collapsed on focusing the question", function (assert) {
  const survey = new SurveyModel({
    "pages": [
      {
        "elements": [
          {
            "name": "q1",
            "type": "text",
          }
        ]
      },
      {
        "elements": [{
          "name": "panel",
          "type": "paneldynamic",
          "panelCount": 2,
          "templateElements": [
            {
              "name": "q2",
              "type": "text",
            }
          ]
        }] }] });
  assert.equal(survey.currentPageNo, 0);
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const q2 = panel.panels[0].getQuestionByName("q2");
  q2.focus();
  assert.equal(survey.currentPageNo, 1);
});
QUnit.test("templateErrorLocation property", function (assert) {
  const survey = new SurveyModel({
    "elements": [{
      "name": "panel",
      "type": "paneldynamic",
      "panelCount": 2,
      "templateElements": [
        {
          "name": "q1",
          "type": "text",
        }
      ]
    }]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  const q1 = panel.panels[0].getQuestionByName("q1");
  assert.equal(q1.getErrorLocation(), "top", "take from survey");
  panel.errorLocation = "bottom";
  assert.equal(q1.getErrorLocation(), "bottom", "take from question.errorLocation");
  panel.templateErrorLocation = "top";
  assert.equal(q1.getErrorLocation(), "top", "take from question.templateErrorLocation");
});
QUnit.test("paneldynamic.removePanelUI & confirmActionAsync, #6736", function(assert) {
  const prevAsync = settings.confirmActionAsync;
  const survey = new SurveyModel({
    questions: [
      {
        type: "paneldynamic",
        name: "panel1",
        templateElements: [
          {
            type: "text",
            name: "q1",
          },
        ]
      },
    ],
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  panel.confirmDelete = true;
  panel.value = [{ q1: 1 }, { q1: 2 }, { q1: 3 }];
  assert.equal(panel.panelCount, 3, "There are 3 panels by default");
  let f_resFunc = (res: boolean): void => {};
  settings.confirmActionAsync = (message: string, resFunc: (res: boolean) => void): boolean => {
    f_resFunc = resFunc;
    return true;
  };
  panel.removePanelUI(1);
  assert.equal(panel.panelCount, 3, "We are waiting for async function");
  f_resFunc(false);
  assert.equal(panel.panelCount, 3, "confirm action return false");
  panel.removePanelUI(1);
  assert.equal(panel.panelCount, 3, "We are waiting for async function, #2");
  f_resFunc(true);
  assert.equal(panel.panelCount, 2, "confirm action return true");
  assert.deepEqual(panel.value, [{ q1: 1 }, { q1: 3 }], "Row is deleted correctly");

  settings.confirmActionAsync = prevAsync;
});
QUnit.test("paneldynamic confirmDelete and panelDefaultValue, isRequireConfirmOnDelete", function(assert) {
  const survey = new SurveyModel({
    questions: [
      {
        type: "paneldynamic",
        name: "panel1",
        panelCount: 2,
        defaultPanelValue: { q1: 1, q2: 2 },
        templateElements: [
          { type: "text", name: "q1" },
          { type: "text", name: "q2" }
        ]
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  assert.deepEqual(panel.value, [{ q1: 1, q2: 2 }, { q1: 1, q2: 2 }], "Initial value is correct");
  assert.equal(panel.isRequireConfirmOnDelete(0), false, "#1");
  panel.confirmDelete = true;
  panel.panels[0].getQuestionByName("q1").value = 3;
  assert.equal(panel.isRequireConfirmOnDelete(0), true, "#2");
  assert.equal(panel.isRequireConfirmOnDelete(1), false, "#3");
  assert.equal(panel.isRequireConfirmOnDelete(-1), false, "#4");
  assert.equal(panel.isRequireConfirmOnDelete(2), false, "#5");

  panel.panels[0].getQuestionByName("q1").clearValue();
  panel.panels[0].getQuestionByName("q2").clearValue();
  assert.equal(panel.isRequireConfirmOnDelete(0), false, "#6");
});
QUnit.test("panel property in custom function", function (assert) {
  const panelCustomFunc = function (params: any) {
    if(!this.panel) return "";
    const q = this.panel.getQuestionByName(params[0]);
    if(q && !q.isEmpty()) return q.value + q.value;
    return "";
  };
  FunctionFactory.Instance.register("panelCustomFunc", panelCustomFunc);
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel1",
        templateElements: [
          { name: "q1", type: "text" },
          {
            name: "q2",
            type: "expression",
            expression: "panelCustomFunc('q1')",
          },
        ],
        panelCount: 2,
      },
    ],
  });
  const question = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const panel = question.panels[0];
  panel.getQuestionByName("q1").value = "abc";
  assert.equal(panel.getQuestionByName("q2").value, "abcabc", "Custom function with row property works correctly");
  FunctionFactory.Instance.unregister("panelCustomFunc");
});
QUnit.test("nested panel.panelCount&expression question", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "templateElements": [
          {
            "type": "text",
            "name": "q1"
          },
          {
            "type": "paneldynamic",
            "name": "panel2",
            "templateElements": [
              {
                "type": "expression",
                "name": "q2",
                "expression": "{panelIndex}"
              }
            ],
            "panelCount": 3
          }
        ],
        "panelCount": 1
      }
    ]
  });
  const rootPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  assert.equal(rootPanel.panels.length, 1);
  const panel1 = rootPanel.panels[0].getQuestionByName("panel2");
  assert.equal(panel1.panels.length, 3, "It should be 3 panels");
});
QUnit.test("templateElements question.onHidingContent", function (assert) {
  const survey = new SurveyModel({
    "elements": [{
      "name": "panel",
      "type": "paneldynamic",
      "panelCount": 2,
      "templateElements": [
        {
          "name": "q1",
          "type": "text",
        }
      ]
    }]
  });
  let counter = 0;
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  panel.panels[0].getQuestionByName("q1").onHidingContent = (): void => { counter ++; };
  panel.panels[1].getQuestionByName("q1").onHidingContent = (): void => { counter ++; };
  survey.doComplete();
  assert.equal(counter, 2, "on do complete");
});
QUnit.test("templateElements question.onHidingContent", function (assert) {
  const survey = new SurveyModel({
    "elements": [{
      "name": "panel",
      "type": "paneldynamic",
      "panelCount": 2,
      "renderMode": "tab",
      "templateElements": [
        {
          "name": "q1",
          "type": "text",
        }
      ]
    }]
  });
  let counter = 0;
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  panel.panels[0].getQuestionByName("q1").onHidingContent = (): void => { counter ++; };
  panel.currentIndex = 1;
  assert.equal(counter, 1, "Go to another tab");
});
QUnit.test("nested panel.panelCount&expression question", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "valueName": "shared",
        "templateElements": [
          {
            "type": "text",
            "name": "A"
          }
        ],
        "panelCount": 1
      },
      {
        "type": "paneldynamic",
        "name": "panel2",
        "valueName": "shared",
        "templateElements": [
          {
            "type": "text",
            "name": "B"
          },
          {
            "type": "text",
            "name": "C",
            "defaultValueExpression": "{panel.A}",
            "readOnly": true
          },
          {
            "type": "text",
            "name": "D",
            "defaultValueExpression": "{panel.B}+{panel.C}",
            "readOnly": true
          },
          {
            "type": "expression",
            "name": "E",
            "expression": "{panel.B}+{panel.C}"
          }
        ]
      }
    ]
  });
  const panel1 = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  panel1.panels[0].getQuestionByName("A").value = 1;
  const panel2 = <QuestionPanelDynamicModel>survey.getQuestionByName("panel2");
  const panel = panel2.panels[0];
  panel.getQuestionByName("B").value = 2;
  assert.equal(panel.getQuestionByName("C").value, 1, "C");
  assert.equal(panel.getQuestionByName("D").value, 3, "D");
  assert.equal(panel.getQuestionByName("E").value, 3, "E");
});
QUnit.test("Footer css for nested panels", function(assert) {
  const footerCss = "abcd";
  const survey = new SurveyModel({
    questions: [
      {
        type: "paneldynamic",
        name: "q",
        panelCount: 1,
        templateElements: [
          { type: "text", name: "q1" },
          {
            type: "paneldynamic",
            name: "qq",
            panelCount: 1,
            templateElements: [{ type: "text", name: "q2" }],
          },
        ],
      },
    ],
  });
  setOldTheme(survey);
  survey.css = {
    panel: {
      footer: footerCss
    }
  };
  const question = <QuestionPanelDynamicModel>survey.getQuestionByName("q");
  assert.equal(question.panels[0].getFooterToolbar().containerCss, footerCss, "root footer container css");
  const nested = <QuestionPanelDynamicModel>question.panels[0].getQuestionByName("qq");
  assert.equal(nested.panels[0].getFooterToolbar().containerCss, footerCss, "nested footer container css on loading");
  nested.addPanel();
  assert.equal(nested.panels[1].getFooterToolbar().containerCss, footerCss, "nested footer container css on creating");
});
QUnit.test("question.resetValueIf, basic functionality", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
          { name: "q1", type: "text" },
          { name: "q2", type: "text", resetValueIf: "{panel.q1} = 1" },
          { name: "q3", type: "text" }
        ]
      }
    ]
  });
  const panel = survey.getQuestionByName("panel");
  const q1 = panel.panels[0].getQuestionByName("q1");
  const q2 = panel.panels[0].getQuestionByName("q2");
  const q3 = panel.panels[0].getQuestionByName("q3");
  assert.equal(q2.resetValueIf, "{panel.q1} = 1", "Load from JSON");
  q2.value = "abc";
  q1.value = 2;
  assert.equal(q2.value, "abc", "value is set");
  q1.value = 1;
  assert.equal(q2.isEmpty(), true, "value is cleared");
  q2.value = "edf";
  assert.equal(q2.value, "edf", "value is set, #2");
  q3.value = 3;
  assert.equal(q2.value, "edf", "value is stay, #3");
});
QUnit.test("question.resetValueIf & quesiton.defaultValueExpression", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [{
          name: "q1",
          type: "text"
        },
        {
          name: "q2",
          type: "text",
          resetValueIf: "{panel.q1} = 1",
          defaultValueExpression: "iif({panel.q3} > 2, {panel.q3}, '')"
        },
        {
          name: "q3", type: "text"
        }]
      }
    ]
  });
  const panel = survey.getQuestionByName("panel");
  const q1 = panel.panels[0].getQuestionByName("q1");
  const q2 = panel.panels[0].getQuestionByName("q2");
  const q3 = panel.panels[0].getQuestionByName("q3");
  q2.value = "abc";
  q3.value = 3;
  assert.equal(q2.value, "abc", "value is set directly");
  q1.value = 1;
  assert.equal(q2.value, 3, "value is set from defaultValueExpression");
  q2.value = "edf";
  assert.equal(q2.value, "edf", "value is set directly, #2");
  q3.value = 4;
  assert.equal(q2.value, "edf", "value is stay, #3");
});
QUnit.test("question.resetValueIf based on root and row questions", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
          { name: "q1", type: "text" },
          { name: "q2", type: "text", resetValueIf: "{panel.q1} = 1 and {q4} = 4" },
          { name: "q3", type: "text" }
        ]
      },
      { type: "text", name: "q4" }
    ]
  });
  const panel = survey.getQuestionByName("panel");
  const q1 = panel.panels[0].getQuestionByName("q1");
  const q2 = panel.panels[0].getQuestionByName("q2");
  const q3 = panel.panels[0].getQuestionByName("q3");
  const q4 = survey.getQuestionByName("q4");
  q2.value = "abc";
  q1.value = 2;
  assert.equal(q2.value, "abc", "q2.value #1");
  q1.value = 1;
  assert.equal(q2.value, "abc", "q2.value #2");
  q4.value = 4;
  assert.equal(q2.isEmpty(), true, "q2.value #3");
  q2.value = "edf";
  q1.value = 2;
  assert.equal(q2.value, "edf", "q2.value, #4");
  q1.value = 1;
  assert.equal(q2.isEmpty(), true, "q2.value #5");
});
QUnit.test("question.setValueIf, basic functionality", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
          { name: "q1", type: "text" },
          { name: "q2", type: "text", setValueIf: "{panel.q1} = 1", setValueExpression: "{panel.q1} + {panel.q3}" },
          { name: "q3", type: "text" }
        ]
      }
    ]
  });
  const panel = survey.getQuestionByName("panel");
  const q1 = panel.panels[0].getQuestionByName("q1");
  const q2 = panel.panels[0].getQuestionByName("q2");
  const q3 = panel.panels[0].getQuestionByName("q3");
  assert.equal(q2.setValueIf, "{panel.q1} = 1", "Load from JSON setValueIf");
  assert.equal(q2.setValueExpression, "{panel.q1} + {panel.q3}", "Load from JSON setValueExpression");
  q2.value = "abc";
  q1.value = 2;
  q3.value = 3;
  assert.equal(q2.value, "abc", "value is set");
  q1.value = 1;
  assert.equal(q2.value, 4, "value is set correctly");
  q2.value = "edf";
  assert.equal(q2.value, "edf", "value is set, #2");
  q3.value = 5;
  assert.equal(q2.value, 1 + 5, "value is set, #3");
  q2.value = "klm";
  assert.equal(q2.value, "klm", "value is set, #4");
  q1.value = 2;
  assert.equal(q2.value, "klm", "value is set, #5");
  q3.value = 5;
  assert.equal(q2.value, "klm", "value is set, #6");
});
QUnit.test("panel dynamic getPlainData & comment", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        templateElements: [
          { name: "q1", type: "text" },
          { name: "q2", type: "text" }
        ],
        showCommentArea: true
      }
    ]
  });
  const q = survey.getQuestionByName("panel");
  q.value = [{ q1: 1, q2: 2 }, { q1: 3, q2: 4 }];
  q.comment = "Some comments";
  const data: any = survey.getPlainData();
  const qData = data[0].data;
  assert.equal(qData.length, 3, "There are 3 records");
  assert.equal(qData[2].title, "Comment", "comment title");
  assert.equal(qData[2].isComment, true, "comment isComment");
});
QUnit.test("panel dynamic & dropdown with showOtherItem", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
          { name: "q1", type: "dropdown", choices: [1, 2, 3], showOtherItem: true }
        ]
      }
    ]
  });
  const dynamicPanel = survey.getQuestionByName("panel");
  const panel = dynamicPanel.panels[0];
  const question = panel.getQuestionByName("q1");
  question.value = "other";
  question.comment = "comment1";
  assert.deepEqual(dynamicPanel.value, [{ q1: "other", "q1-Comment": "comment1" }], "panel.value #1");
  question.value = 1;
  assert.equal(question.value, 1, "question value is changed");
  assert.notOk(question.comment, "comment is empty");
  assert.deepEqual(dynamicPanel.value, [{ q1: 1 }], "panel.value #2");
  question.value = "other";
  assert.deepEqual(dynamicPanel.value, [{ q1: "other" }], "panel.value #3");
  question.comment = "comment2";
  assert.deepEqual(dynamicPanel.value, [{ q1: "other", "q1-Comment": "comment2" }], "panel.value #4");
});
QUnit.test("panel dynamic & getQuestionFromArray with non-build panels, #7693", function (assert) {
  const survey = new SurveyModel({
    pages: [
      { elements: [{ type: "text", name: "q1" }] },
      {
        elements: [
          {
            type: "paneldynamic",
            name: "panel",
            panelCount: 1,
            templateElements: [
              { name: "q2", type: "text" }
            ]
          }
        ]
      }
    ] });
  const dynamicPanel = survey.getQuestionByName("panel");
  assert.notOk(dynamicPanel.getQuestionFromArray("q2", 0), "Panels are not created yet");
  survey.currentPageNo = 1;
  assert.equal(dynamicPanel.getQuestionFromArray("q2", 0).name, "q2", "Panels are created");
});
QUnit.test("panel dynamic & addPanel/removePanel with non-build panels, #7693", function (assert) {
  const survey = new SurveyModel({
    pages: [
      { elements: [{ type: "text", name: "q1" }] },
      {
        elements: [
          {
            type: "paneldynamic",
            name: "panel",
            panelCount: 1,
            templateElements: [
              { name: "q2", type: "text" }
            ]
          }
        ]
      }
    ] });
  const dynamicPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(dynamicPanel.panelCount, 1, "panelCount #1");
  assert.notOk(dynamicPanel.getQuestionFromArray("q2", 0), "Panels are not created yet");
  dynamicPanel.addPanel();
  dynamicPanel.addPanel(1);
  assert.equal(dynamicPanel.panelCount, 3, "panelCount #2");
  dynamicPanel.removePanel(1);
  assert.equal(dynamicPanel.panelCount, 2, "panelCount #3");
  assert.equal(dynamicPanel.getQuestionFromArray("q2", 0).name, "q2", "Panels are created");
});
QUnit.test("panel dynamic & panel visibleIf & checkbox vs carry forward, #7693", function (assert) {
  const survey = new SurveyModel({
    "pages": [
      {
        "elements": [
          {
            "type": "paneldynamic",
            "name": "aboutMe",
            "valueName": "household",
            "templateElements": [
              {
                "type": "text",
                "name": "firstName"
              },
              {
                "type": "text",
                "name": "lastName"
              },
              {
                "type": "expression",
                "name": "fullName",
                "visible": false,
                "expression": "{panel.firstName} + ' ' + {panel.lastName}"
              }
            ],
            "panelCount": 2,
            "minPanelCount": 1,
            "templateVisibleIf": "{panelIndex} = 0"
          }
        ]
      },
      {
        "elements": [
          {
            "type": "paneldynamic",
            "name": "addChildren",
            "valueName": "household",
            "isRequired": true,
            "templateElements": [
              {
                "type": "text",
                "name": "childFirstName",
                "valueName": "firstName"
              },
              {
                "type": "text",
                "name": "childLastName",
                "valueName": "lastName"
              },
              {
                "type": "expression",
                "name": "childFullName",
                "visible": false,
                "valueName": "fullName",
                "expression": "{panel.firstName} + ' ' + {panel.lastName}"
              }
            ],
            "panelCount": 1,
            "minPanelCount": 1,
            "templateVisibleIf": "{panelIndex} > 0"
          }
        ]
      },
      {
        "elements": [
          {
            "type": "checkbox",
            "name": "addIncomeFor",
            "choicesFromQuestion": "addChildren",
            "choiceValuesFromQuestion": "fullName"
          }
        ]
      },
      {
        "elements": [
          {
            "type": "paneldynamic",
            "name": "householdIncome",
            "valueName": "household",
            "templateElements": [
              {
                "type": "text",
                "name": "question1"
              }
            ],
            "templateTitle": "{panel.fullName}",
            "panelsState": "collapsed",
            "templateVisibleIf": "{addIncomeFor} contains {panel.fullName}"
          }
        ]
      }
    ]
  });
  survey.data = {
    "household": [
      {
        "firstName": "first1",
        "fullName": "first1 last1",
        "lastName": "last1",
        "question1": "text1"
      },
      {
        "firstName": "first2",
        "fullName": "first2 last2",
        "lastName": "last2"
      },
      {
        "firstName": "first3",
        "fullName": "first3 last3",
        "lastName": "last3",
        "question1": "test3"
      }
    ],
    "addIncomeFor": [
      "first1 last1",
      "first3 last3"
    ]
  };
  survey.doComplete();
  assert.deepEqual(survey.data, {
    "household": [
      {
        "firstName": "first1",
        "lastName": "last1",
        "question1": "text1"
      },
      {
        "firstName": "first2",
        "lastName": "last2"
      },
      {
        "firstName": "first3",
        "lastName": "last3",
        "question1": "test3"
      }
    ]
  });
});

QUnit.test("paneldynamic: panelsState & valueName Bug#8653", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        "type": "checkbox",
        "name": "state_names",
        "title": "States",
        "valuePropertyName": "state_name",
        "choices": ["ACT", "NSW", "QLD"]
      },
      {
        "type": "paneldynamic",
        "name": "regions",
        "valueName": "state_names",
        "allowAddPanel": false,
        "allowRemovePanel": false,
        "visibleIf": "{state_names} notempty",
        "panelsState": "expanded",
        "templateTitle": "Regions for State {panel.state_name}",
        "templateElements": [
          {
            "type": "text",
            "name": "q1"
          }
        ]
      }
    ]
  });
  const checkbox = <QuestionCheckboxModel>survey.getQuestionByName("state_names");
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("regions");
  checkbox.selectAll();
  assert.equal(panel.visiblePanels.length, 3, "3 panels have been created");
  assert.equal(panel.visiblePanels[0].state, "expanded", "panels[0] state is expanded");
  assert.equal(panel.visiblePanels[1].state, "expanded", "panels[1] state is expanded");
  assert.equal(panel.visiblePanels[2].state, "expanded", "panels[2] state is expanded");
});
QUnit.test("paneldynamic: check renderedPanels", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
          { name: "q1", type: "text" },
        ]
      },
      { type: "text", name: "q4" }
    ]
  });
  const question = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  assert.equal(question.renderedPanels.length, 1);
  assert.deepEqual(question.renderedPanels, question.visiblePanels);
  question.addPanel(1);
  assert.equal(question.renderedPanels.length, 2);
  assert.deepEqual(question.renderedPanels, question.visiblePanels);
  question.addPanel(2);
  assert.equal(question.renderedPanels.length, 3);
  assert.deepEqual(question.renderedPanels, question.visiblePanels);
  question.removePanel(question.visiblePanels[1]);
  assert.equal(question.renderedPanels.length, 2);
  assert.deepEqual(question.renderedPanels, question.visiblePanels);
  question.removePanel(question.visiblePanels[0]);
  assert.equal(question.renderedPanels.length, 1);
  assert.deepEqual(question.renderedPanels, question.visiblePanels);
  question.addPanel(1);
  assert.equal(question.renderedPanels.length, 2);
  assert.deepEqual(question.renderedPanels, question.visiblePanels);
  question.renderMode = "tabs";
  assert.equal(question.renderedPanels.length, 1);
  assert.deepEqual(question.renderedPanels[0], question.visiblePanels[0]);
  question.currentIndex = 1;
  assert.equal(question.renderedPanels.length, 1);
  assert.deepEqual(question.renderedPanels[0], question.visiblePanels[1]);
  question.currentIndex = 0;
  assert.equal(question.renderedPanels.length, 1);
  assert.deepEqual(question.renderedPanels[0], question.visiblePanels[0]);
  question.addPanel(2);
  assert.equal(question.renderedPanels.length, 1);
  assert.deepEqual(question.renderedPanels[0], question.visiblePanels[2]);
  question.removePanel(question.visiblePanels[2]);
  assert.equal(question.renderedPanels.length, 1);
  assert.deepEqual(question.renderedPanels[0], question.visiblePanels[1]);
});

QUnit.test("paneldynamic: check panelsAnimation", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 1,
        templateElements: [
          { name: "q1", type: "text" },
        ]
      },
      { type: "text", name: "q4" }
    ]
  });
  const question = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  assert.ok(question["panelsAnimation"] instanceof AnimationGroup);
  assert.notOk(question["panelsAnimation"] instanceof AnimationTab);

  question.renderMode = "tabs";
  assert.notOk(question["panelsAnimation"] instanceof AnimationGroup);
  assert.ok(question["panelsAnimation"] instanceof AnimationTab);

  question.renderMode = "progressTop";
  assert.notOk(question["panelsAnimation"] instanceof AnimationGroup);
  assert.ok(question["panelsAnimation"] instanceof AnimationTab);

  question.renderMode = "list";
  assert.ok(question["panelsAnimation"] instanceof AnimationGroup);
  assert.notOk(question["panelsAnimation"] instanceof AnimationTab);
});

QUnit.test("paneldynamic: check panelsAnimation options", function (assert) {
  const survey = new SurveyModel({
    elements: [
      {
        type: "paneldynamic",
        name: "panel",
        panelCount: 2,
        templateElements: [
          { name: "q1", type: "text" },
        ]
      },
      { type: "text", name: "q4" }
    ]
  });
  survey.css = {
    paneldynamic: {
      panelWrapperEnter: "enter",
      panelWrapperLeave: "leave"
    }
  };
  const question = <QuestionPanelDynamicModel>survey.getAllQuestions()[0];
  const options = question["getPanelsAnimationOptions"]();
  const panelsContainer = document.createElement("div");
  const panelContainer2 = document.createElement("div");
  const panelContainer1 = document.createElement("div");
  panelsContainer.appendChild(panelContainer2);
  panelsContainer.appendChild(panelContainer1);
  document.body.appendChild(panelsContainer);
  let enterOptions = options.getEnterOptions(question.panels[0]);
  let leaveOptions = options.getLeaveOptions(question.panels[1]);
  assert.equal(enterOptions.cssClass, "enter");
  assert.equal(leaveOptions.cssClass, "leave");
  enterOptions.onBeforeRunAnimation && enterOptions.onBeforeRunAnimation(panelContainer1);
  assert.equal(panelContainer1.style.getPropertyValue("--animation-height-to"), "0px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(panelContainer1);
  assert.notOk(panelContainer1.style.getPropertyValue("--animation-height-to"));

  leaveOptions.onBeforeRunAnimation && leaveOptions.onBeforeRunAnimation(panelContainer2);
  assert.equal(panelContainer2.style.getPropertyValue("--animation-height-to"), "0px");
  leaveOptions.onAfterRunAnimation && leaveOptions.onAfterRunAnimation(panelContainer2);
  assert.notOk(panelContainer2.style.getPropertyValue("--animation-height-to"));

  question.renderMode = "progressTop";
  question.currentIndex = 0;
  question["_renderedPanels"] = [question.panels[0], question.panels[1]];
  panelContainer1.style.height = "20px";
  panelContainer2.style.height = "40px";

  enterOptions = options.getEnterOptions(question.panels[0]);
  leaveOptions = options.getLeaveOptions(question.panels[1]);
  assert.equal(enterOptions.cssClass, "enter sv-pd-animation-right");
  assert.equal(leaveOptions.cssClass, "leave sv-pd-animation-right");
  enterOptions.onBeforeRunAnimation && enterOptions.onBeforeRunAnimation(panelContainer1);
  leaveOptions.onBeforeRunAnimation && leaveOptions.onBeforeRunAnimation(panelContainer2);
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-from"), "40px");
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-to"), "20px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(panelContainer1);
  leaveOptions.onAfterRunAnimation && leaveOptions.onAfterRunAnimation(panelContainer2);
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-from"));
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-to"));

  question.currentIndex = 1;
  question["_renderedPanels"] = [question.panels[0], question.panels[1]];

  enterOptions = options.getEnterOptions(question.panels[0]);
  leaveOptions = options.getLeaveOptions(question.panels[1]);
  assert.equal(enterOptions.cssClass, "enter sv-pd-animation-left");
  assert.equal(leaveOptions.cssClass, "leave sv-pd-animation-left");
  enterOptions.onBeforeRunAnimation && enterOptions.onBeforeRunAnimation(panelContainer2);
  leaveOptions.onBeforeRunAnimation && leaveOptions.onBeforeRunAnimation(panelContainer1);
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-from"), "20px");
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-to"), "40px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(panelContainer2);
  leaveOptions.onAfterRunAnimation && leaveOptions.onAfterRunAnimation(panelContainer1);
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-from"));
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-to"));

  question["focusNewPanelCallback"] = () => {};
  enterOptions = options.getEnterOptions(question.panels[0]);
  leaveOptions = options.getLeaveOptions(question.panels[1]);
  assert.equal(enterOptions.cssClass, "enter sv-pd-animation-adding sv-pd-animation-left");
  assert.equal(leaveOptions.cssClass, "leave sv-pd-animation-adding sv-pd-animation-left");
  enterOptions.onBeforeRunAnimation && enterOptions.onBeforeRunAnimation(panelContainer2);
  leaveOptions.onBeforeRunAnimation && leaveOptions.onBeforeRunAnimation(panelContainer1);
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-from"), "20px");
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-to"), "40px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(panelContainer2);
  leaveOptions.onAfterRunAnimation && leaveOptions.onAfterRunAnimation(panelContainer1);
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-from"));
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-to"));

  const removedPanel = question.panels[1];
  question.removePanel(removedPanel);
  question["_renderedPanels"] = [question.panels[0], removedPanel];

  question["removedPanelIndex"] = 0;
  enterOptions = options.getEnterOptions(question.panels[0]);
  leaveOptions = options.getLeaveOptions(question.panels[1]);
  assert.equal(enterOptions.cssClass, "enter sv-pd-animation-removing sv-pd-animation-left");
  assert.equal(leaveOptions.cssClass, "leave sv-pd-animation-removing sv-pd-animation-left");
  enterOptions.onBeforeRunAnimation && enterOptions.onBeforeRunAnimation(panelContainer2);
  leaveOptions.onBeforeRunAnimation && leaveOptions.onBeforeRunAnimation(panelContainer1);
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-from"), "20px");
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-to"), "40px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(panelContainer2);
  leaveOptions.onAfterRunAnimation && leaveOptions.onAfterRunAnimation(panelContainer1);
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-from"));
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-to"));

  question["removedPanelIndex"] = 1;
  enterOptions = options.getEnterOptions(question.panels[0]);
  leaveOptions = options.getLeaveOptions(question.panels[1]);
  assert.equal(enterOptions.cssClass, "enter sv-pd-animation-removing sv-pd-animation-right");
  assert.equal(leaveOptions.cssClass, "leave sv-pd-animation-removing sv-pd-animation-right");
  enterOptions.onBeforeRunAnimation && enterOptions.onBeforeRunAnimation(panelContainer2);
  leaveOptions.onBeforeRunAnimation && leaveOptions.onBeforeRunAnimation(panelContainer1);
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-from"), "20px");
  assert.equal(panelsContainer.style.getPropertyValue("--animation-height-to"), "40px");
  enterOptions.onAfterRunAnimation && enterOptions.onAfterRunAnimation(panelContainer2);
  leaveOptions.onAfterRunAnimation && leaveOptions.onAfterRunAnimation(panelContainer1);
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-from"));
  assert.notOk(panelsContainer.style.getPropertyValue("--animation-height-to"));

  panelsContainer.remove();
});
QUnit.test("onQuestionVisibleChanged should be fired", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "text", name: "q1" },
      { type: "paneldynamic", name: "q2", panelCount: 1,
        templateElements: [{ type: "text", name: "q3", visibleIf: "{q1} = 1" }, { type: "text", name: "q4" }]
      }
    ]
  });
  const questionNames = new Array<string>();
  survey.onQuestionVisibleChanged.add((sender, options) => {
    questionNames.push(options.question.name + ":" + options.question.isVisible);
  });
  survey.setValue("q1", 1);
  survey.setValue("q1", 2);
  assert.deepEqual(questionNames, ["q3:true", "q3:false"], "visiblity logs");
});
QUnit.test("Always focus on error in duplicated value, Bug8228", function (assert) {
  let focusedQuestionId = "";
  var oldFunc = SurveyElement.FocusElement;
  SurveyElement.FocusElement = function (elId: string): boolean {
    focusedQuestionId = elId;
    return true;
  };
  const survey = new SurveyModel({
    "elements": [{
      "name": "q1",
      "type": "paneldynamic",
      "keyName": "q2",
      "templateElements": [
        {
          "name": "q2",
          "type": "text"
        }
      ]
    },
    ]
  });
  survey.data = { q1: [{ q2: 2 }, { q2: 2 }] };

  const res = survey.validate(false, false);
  assert.equal(res, false, "There is an error");
  assert.notOk(focusedQuestionId, "Do not focus");
  survey.validate(false, true);
  assert.ok(focusedQuestionId, "Focus on the question");

  SurveyElement.FocusElement = oldFunc;
});
QUnit.test("getFirstQuestionToFocus, Bug#8764", function (assert) {
  const survey = new SurveyModel({
    elements: [
      { type: "paneldynamic", name: "panel", panelCount: 1,
        templateElements: [{ type: "text", name: "q1" }, { type: "text", name: "q2", isRequired: true }]
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  panel.validate(true);
  assert.equal(panel.getFirstQuestionToFocus(false).name, "q1", "#1");
  assert.equal(panel.getFirstQuestionToFocus(true).name, "q2", "#2");
  panel.panelCount = 0;
  assert.equal(panel.getFirstQuestionToFocus(false).name, "panel", "#3");
  assert.notOk(panel.getFirstQuestionToFocus(true), "#4");
  panel.isRequired = true;
  panel.validate(true);
  assert.equal(panel.getFirstQuestionToFocus(true).name, "panel", "#5");
});
QUnit.test("defaultRowValue in dynamic panel, Bug#8819", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "templateElements": [
          {
            "type": "matrixdynamic",
            "name": "matrix1",
            "columns": [
              {
                "name": "col1",
                "cellType": "text"
              }
            ],
            "rowCount": 1,
            "minRowCount": 1,
            "defaultRowValue": {
              "col1": "abc"
            }
          }
        ],
        "minPanelCount": 1
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  assert.deepEqual(panel.value, [{ matrix1: [{ "col1": "abc" }] }], "#1");
  panel.addPanel();
  assert.deepEqual(panel.value, [{ matrix1: [{ "col1": "abc" }] }, { matrix1: [{ "col1": "abc" }] }], "#2");
  panel.panels[1].questions[0].addRow();
  assert.deepEqual(panel.value, [{ matrix1: [{ "col1": "abc" }] }, { matrix1: [{ "col1": "abc" }, { "col1": "abc" }] }], "#3");
});
QUnit.test("maxRowCount & footer buttons, Bug#8865", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "type": "paneldynamic",
        "name": "panel1",
        "templateElements": [
          {
            "type": "text",
            "name": "q1"
          }
        ]
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  const btnAdd = panel.footerToolbar.getActionById("sv-pd-add-btn");
  assert.equal(btnAdd.isVisible, true, "#1");
  panel.value = [{ q1: "abc" }];
  assert.equal(btnAdd.isVisible, true, "#2");
  panel.maxPanelCount = 1;
  assert.equal(btnAdd.isVisible, false, "#3");
  panel.maxPanelCount = 2;
  assert.equal(btnAdd.isVisible, true, "#4");
});
QUnit.test("A dynamic matrix cell value is reset when adding a new outer dynanic panel, Bug#8892", function (assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        type: "paneldynamic",
        name: "main",
        templateElements: [
          {
            type: "paneldynamic",
            name: "detail",
            templateElements: [
              {
                type: "matrixdynamic",
                name: "matrix",
                columns: [{ "name": "col1", "cellType": "text" }],
                rowCount: 1,
                minRowCount: 1
              }
            ]
          }
        ]
      }
    ]
  });
  const mainPanel = <QuestionPanelDynamicModel>survey.getQuestionByName("main");
  const panel1 = mainPanel.addPanel();
  const detailPanel1 = <QuestionPanelDynamicModel>panel1.getQuestionByName("detail");
  const matrix1 = detailPanel1.addPanel().getQuestionByName("matrix");
  matrix1.visibleRows[0].getQuestionByName("col1").value = "main1_detail1";
  const matrix2 = detailPanel1.addPanel().getQuestionByName("matrix");
  matrix2.visibleRows[0].getQuestionByName("col1").value = "main1_detail2";
  assert.deepEqual(mainPanel.value, [
    { detail: [{ matrix: [{ col1: "main1_detail1" }] }, { matrix: [{ col1: "main1_detail2" }] }] }
  ], "main panel value #1");
  const panel2 = mainPanel.addPanel();
  const detailPanel2 = <QuestionPanelDynamicModel>panel2.getQuestionByName("detail");
  const matrix3 = detailPanel2.addPanel().getQuestionByName("matrix");
  matrix3.visibleRows[0].getQuestionByName("col1").value = "main2_detail1";
  assert.deepEqual(mainPanel.value, [
    { detail: [{ matrix: [{ col1: "main1_detail1" }] }, { matrix: [{ col1: "main1_detail2" }] }] },
    { detail: [{ matrix: [{ col1: "main2_detail1" }] }] }
  ], "main panel value #2");
  assert.equal(matrix1.visibleRows[0].getQuestionByName("col1").value, "main1_detail1", "Last row value, matrix1");
  assert.equal(matrix2.visibleRows[0].getQuestionByName("col1").value, "main1_detail2", "Last row value, matrix2");
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
            type: "paneldynamic",
            name: "panel",
            templateElements: [{ type: "text", name: "question2", isRequired: true }],
            panelCount: 1
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
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel");
  assert.equal(panel.panels[0].getQuestionByName("question2").errors.length, 1, "has an error");
});
QUnit.test("default value for maxPanelCount, Bug#9000", function (assert) {
  assert.equal(new QuestionPanelDynamicModel("q1").maxPanelCount, 100, "default value");
  settings.panel.maxPanelCount = 300;
  assert.equal(new QuestionPanelDynamicModel("q1").maxPanelCount, 300, "updated default value");
  settings.panel.maxPanelCount = 100;
  assert.equal(new QuestionPanelDynamicModel("q1").maxPanelCount, 100, "default value again");
});
QUnit.test("Do not serialize renderMode & showRangeInProgress", function (assert) {
  const survey = new SurveyModel({
    elements: [{ type: "paneldynamic", name: "panel1", renderMode: "progressTop", showRangeInProgress: false }]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  assert.equal(panel.renderMode, "progressTop", "renderMode is set");
  assert.equal(panel.displayMode, "carousel", "displayMode is set");
  assert.equal(panel.showRangeInProgress, false, "showRangeInProgress is set");
  assert.equal(panel.showProgressBar, false, "showProgressBar is set");
  const json = panel.toJSON();
  assert.notOk(json.renderMode, "renderMode on json");
  assert.equal(json.displayMode, "carousel", "displayMode is json");
  assert.notOk(json.showRangeInProgress, "showRangeInProgress is json");
  assert.equal(json.showProgressBar, false, "showProgressBar is json");
});
QUnit.test("A Dynamic Panel question number is updated when adding a new panel Bug#9401", function (assert) {
  const survey = new SurveyModel({
    showQuestionNumbers: "on",
    elements: [
      { type: "text", name: "question1" },
      { type: "paneldynamic", name: "panel1",
        templateElements: [{ type: "text", name: "question3" }]
      }
    ]
  });
  const panel = <QuestionPanelDynamicModel>survey.getQuestionByName("panel1");
  assert.equal(panel.no, "2.", "no #1");
  panel.addPanel();
  assert.equal(panel.no, "2.", "no #2");
});
