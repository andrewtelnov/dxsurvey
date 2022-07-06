import { QuestionTextModel } from "../src/question_text";
import { QuestionCommentModel } from "../src/question_comment";
import { SurveyModel } from "../src/survey";
import { Serializer } from "../src/jsonobject";

QUnit.test("check dropdown disabled class", function(assert) {
  var json = {
    questions: [
      {
        name: "q1",
        type: "text",
      },
    ],
  };
  const survey = new SurveyModel(json);
  const question = <QuestionTextModel>survey.getAllQuestions()[0];
  question.cssClasses.controlDisabled = "sv_q_text_disabled";
  assert.ok(question.getControlClass().indexOf("sv_q_text_disabled") == -1);
  question.readOnly = true;
  assert.ok(question.getControlClass().indexOf("sv_q_text_disabled") != -1);
});
QUnit.test("Test renderedPlaceHolder", function(assert) {
  var json = {
    questions: [
      {
        type: "text",
        name: "q1",
      },
      {
        type: "comment",
        placeHolder: "comment_2",
        name: "q2",
      },
      {
        type: "text",
        placeHolder: "text_3",
        readOnly: true,
        name: "q3",
      },
    ],
  };
  const survey = new SurveyModel(json);
  const q1 = <QuestionTextModel>survey.getAllQuestions()[0];
  const q2 = <QuestionCommentModel>survey.getAllQuestions()[1];
  const q3 = <QuestionTextModel>survey.getAllQuestions()[2];
  assert.notOk(q1.renderedPlaceHolder, "q1, there is no placeHolder");
  assert.equal(q2.renderedPlaceHolder, "comment_2", "q2 has placeHolder");
  assert.notOk(q3.renderedPlaceHolder, "q3, question is readOnly");
  q2.readOnly = true;
  assert.notOk(q2.renderedPlaceHolder, "q2, question is readOnly");
  q3.readOnly = false;
  assert.equal(q3.renderedPlaceHolder, "text_3", "q3 is not readOnly any more");
  q1.placeHolder = "text_1";
  assert.equal(q1.renderedPlaceHolder, "text_1", "q1 has placeHolder now");
  q1.inputType = "range";
  assert.notOk(q1.renderedPlaceHolder, "q1 has inputType range");
  q1.inputType = "text";
  assert.equal(q1.renderedPlaceHolder, "text_1", "q1 has inputType text");
});
QUnit.test("Test renderedPlaceHolder on locale change", function(assert) {
  const json = {
    questions: [
      {
        type: "text",
        name: "q1",
        placeHolder: { en: "text_en", de: "text_de" }
      },
      {
        type: "comment",
        name: "q2",
        placeHolder: { en: "comment_en", de: "comment_de" }
      },
    ],
  };
  const survey = new SurveyModel(json);
  const q1 = <QuestionTextModel>survey.getAllQuestions()[0];
  const q2 = <QuestionCommentModel>survey.getAllQuestions()[1];
  assert.equal(q1.renderedPlaceHolder, "text_en", "text, locale en");
  assert.equal(q2.renderedPlaceHolder, "comment_en", "text, locale en");
  survey.locale = "de";
  assert.equal(q1.renderedPlaceHolder, "text_de", "text, locale de");
  assert.equal(q2.renderedPlaceHolder, "comment_de", "text, locale de");
  survey.locale = "";
});
QUnit.test("Test renderedPlaceHolder on locale change", function(assert) {
  const survey = new SurveyModel({
    "elements": [
      {
        "name": "q1",
        "type": "text",
        "placeHolder": {
          "default": "English",
          "fr": "French",
          "es": "Spanish"
        }
      }
    ],
    "locale": "es",
  });
  const q1 = <QuestionTextModel>survey.getAllQuestions()[0];
  assert.equal(q1.renderedPlaceHolder, "Spanish", "text, locale es");
});
QUnit.test("min/max onSettingValue property function", function(assert) {
  const q = new QuestionTextModel("q1");
  q.inputType = "date";
  q.min = "2000-10-10";
  q.max = "2000-09-09";
  assert.equal(q.max, "2000-10-10", "Correct the max date value");
  q.max = "2000-11-11";
  assert.equal(q.max, "2000-11-11", "Set the max date value directly");
  q.min = "2000-12-12";
  assert.equal(q.min, "2000-11-11", "Correct the min date value");
  q.min = "2000-10-10";
  assert.equal(q.min, "2000-10-10", "Set the min date value directly");
  q.max = "";
  q.min = "2020-10-10";
  assert.equal(q.min, "2020-10-10", "Set the min date value, max value is empty");

  q.inputType = "number";
  q.min = "10";
  assert.equal(q.min, "10", "Set the min number value, max value is empty");
  q.max = "9";
  assert.equal(q.max, "10", "Correct the max number value");
  q.max = "11";
  assert.equal(q.max, "11", "Set the max number value");
  q.min = "12";
  assert.equal(q.min, "11", "Correct the min number value");
  q.min = "9";
  assert.equal(q.min, "9", "Set the min number value");
  q.max = "10";
  assert.equal(q.max, "10", "Set the max number value, #2");
  q.min = <any>5;
  q.max = <any>7;
  assert.equal(q.max, 7, "Set the max number value as number, #3");

  q.inputType = "month";
  q.min = "2020-5";
  assert.equal(q.min, "2020-5", "Set the min month value");
  q.max = "2020-4";
  assert.equal(q.max, "2020-5", "Correct the max month value");
  q.max = "2020-6";
  assert.equal(q.max, "2020-6", "Set the max month value");
  q.min = "2020-7";
  assert.equal(q.min, "2020-6", "Correct the min month value");
  q.min = "2020-3";
  assert.equal(q.min, "2020-3", "Set the min month value, #2");

  q.inputType = "week";
  q.min = "2020-W5";
  assert.equal(q.min, "2020-W5", "Set the min week value");
  q.max = "2020-W4";
  assert.equal(q.max, "2020-W5", "Correct the max week value");
  q.max = "2020-W6";
  assert.equal(q.max, "2020-W6", "Set the max week value");
  q.min = "2020-W7";
  assert.equal(q.min, "2020-W6", "Correct the min week value");
  q.min = "2020-W3";
  assert.equal(q.min, "2020-W3", "Set the min week value, #2");

  q.inputType = "time";
  q.min = "10:10";
  assert.equal(q.min, "10:10", "Set the min time value");
  q.max = "09:10";
  assert.equal(q.max, "10:10", "Correct the max time value");
  q.max = "11:10";
  assert.equal(q.max, "11:10", "Set the max time value");
  q.min = "12:01";
  assert.equal(q.min, "11:10", "Correct the min time value");
  q.min = "10:15";
  assert.equal(q.min, "10:15", "Set the min time value, #2");
});