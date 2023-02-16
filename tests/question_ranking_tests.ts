import { QuestionCheckboxModel } from "../src/question_checkbox";
import { QuestionRankingModel } from "../src/question_ranking";
import { SurveyModel } from "../src/survey";
import {settings as Settings} from "../src/settings";
import { Serializer } from "../src/jsonobject";

export default QUnit.module("question ranking");

QUnit.test("Ranking: Base ", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q1",
        choices: ["a", "b", "c"],
      },
    ],
  });
  var rankingQuestion = <QuestionRankingModel>survey.getQuestionByName("q1");

  assert.deepEqual(
    rankingQuestion.rankingChoices.map((c)=>c.value),
    ["a", "b", "c"],
    "rankingChoices returns visibleChoices if empty value"
  );

  rankingQuestion.value = ["c", "b", "a"];
  assert.deepEqual(
    rankingQuestion.rankingChoices.map((c)=>c.value),
    ["c", "b", "a"],
    "rankingChoices returns visibleChoices if empty value"
  );
});

QUnit.test("Ranking: predefined Survey data", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q1",
        choices: ["a", "b", "c"],
      },
    ],
  });
  survey.data = { q1: ["b", "a", "c"] };
  var q1 = <QuestionRankingModel>survey.getQuestionByName("q1");
  assert.deepEqual(q1.value, ["b", "a", "c"]);
  assert.deepEqual(q1.isEmpty(), false);
  assert.deepEqual(
    q1.rankingChoices.map(item => item.value),
    ["b", "a", "c"]
  );

  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q1",
        choices: [
          {
            value: "1",
            text: "a",
          },
          {
            value: "2",
            text: "b",
          },
          {
            value: "3",
            text: "c",
          },
        ],
      },
    ],
  });
  survey.data = { q1: ["3", "2", "1"] };
  var q1 = <QuestionRankingModel>survey.getQuestionByName("q1");
  assert.deepEqual(q1.value, ["3", "2", "1"]);
  assert.deepEqual(q1.isEmpty(), false);
  assert.deepEqual(
    q1.rankingChoices.map(item => item.text),
    ["c", "b", "a"]
  );
  assert.deepEqual(
    q1.rankingChoices.map(item => item.value),
    ["3", "2", "1"]
  );
});

QUnit.test("Ranking: check removing other from visibleChoices", function(
  assert
) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q1",
        choices: ["a", "b", "c"],
        hasOther: true,
      },
    ],
  });
  var rankingQuestion = <QuestionRankingModel>survey.getQuestionByName("q1");
  assert.deepEqual(rankingQuestion.rankingChoices.length, 3);
});

QUnit.test("Ranking: Carry Forward", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5] },
      {
        type: "ranking",
        name: "q2",
        choicesFromQuestion: "q1",
        choicesFromQuestionMode: "selected",
      },
    ],
  });
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  var q2 = <QuestionRankingModel>survey.getQuestionByName("q2");

  assert.deepEqual(q2.rankingChoices, []);
  assert.deepEqual(q2.isEmpty(), true);

  q1.value = [2, 3];
  q2.value = q2.rankingChoices.map(choice => choice.text); //imitate user's drag drop from the ui
  assert.deepEqual(q2.isEmpty(), false);
  assert.deepEqual(survey.data, {
    q1: [2, 3],
    q2: [2, 3],
  });

  // ranking question with only one choice doesn't make sense
  q1.value = ["2"];
  assert.deepEqual(q2.isEmpty(), true);
  assert.deepEqual(survey.data, {
    q1: [2],
  });

  q1.value = [];
  assert.deepEqual(q2.isEmpty(), true);
  assert.deepEqual(
    q2.rankingChoices.map(item => item.text),
    []
  );

  q1.value = [2, 3];
  q2.value = q2.rankingChoices.map(choice => choice.text); //imitate user's drag drop from the ui
  assert.deepEqual(q2.isEmpty(), false);
  assert.deepEqual(survey.data, {
    q1: [2, 3],
    q2: [2, 3],
  });
});
QUnit.test("Ranking: Carry Forward and hasOther", function(assert) {
  var survey = new SurveyModel({
    elements: [
      { type: "checkbox", name: "q1", choices: [1, 2, 3, 4, 5], hasOther: true },
      {
        type: "ranking",
        name: "q2",
        choicesFromQuestion: "q1",
        choicesFromQuestionMode: "selected",
      },
    ],
  });
  var q1 = <QuestionCheckboxModel>survey.getQuestionByName("q1");
  var q2 = <QuestionRankingModel>survey.getQuestionByName("q2");

  assert.deepEqual(q2.rankingChoices, []);
  assert.deepEqual(q2.isEmpty(), true);

  q1.value = [2, 3, "other"];
  assert.equal(q2.visibleChoices.length, 2, "2, 3 other is empty");
  q1.comment = "someText";
  assert.equal(q2.visibleChoices.length, 3, "2, 3 and other");
  assert.equal(q2.visibleChoices[2].value, "other", "other value");
  assert.equal(q2.visibleChoices[2].text, "someText", "other text");
});
QUnit.test("Ranking: CorrectAnswer, Bug#3720", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q1",
        choices: ["a", "b"],
        correctAnswer: ["b", "a"]
      },
    ],
  });
  var q = <QuestionRankingModel>survey.getQuestionByName("q1");
  q.value = ["a", "b"];
  assert.equal(q.isAnswerCorrect(), false, "Answer is not correct");
  q.value = ["b", "a"];
  assert.equal(q.isAnswerCorrect(), true, "Answer is correct");
});

QUnit.test("Ranking: ReadOnlyMode ", function(assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q",
        choices: ["a", "b", "c"],
      },
    ],
  });

  var q = <QuestionRankingModel>survey.getQuestionByName("q");
  assert.equal(q["allowStartDrag"], true);
  survey.mode = "display";
  assert.equal(q["allowStartDrag"], false);
});

QUnit.test("Ranking: design mode", function (assert) {
  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q",
        choices: ["a", "b", "c"],
      },
    ],
  });

  var upCalled = 0, downCalled = 0, preventDefaultCalled = 0;
  var q = <QuestionRankingModel>survey.getQuestionByName("q");
  q["handleArrowUp"] = () => { upCalled++; };
  q["handleArrowDown"] = () => { downCalled++; };
  function preventDefault() { preventDefaultCalled++ };

  q.handleKeydown(<any>{ key: "ArrowUp", preventDefault: preventDefault }, q.choices[1]);
  assert.equal(upCalled, 1);
  assert.equal(downCalled, 0);
  assert.equal(preventDefaultCalled, 1);

  q.handleKeydown(<any>{ key: "ArrowDown", preventDefault: preventDefault }, q.choices[1]);
  assert.equal(upCalled, 1);
  assert.equal(downCalled, 1);
  assert.equal(preventDefaultCalled, 2);

  survey["_isDesignMode"] = true;
  q.handleKeydown(<any>{ key: "ArrowUp", preventDefault: preventDefault }, q.choices[1]);
  q.handleKeydown(<any>{ key: "ArrowDown", preventDefault: preventDefault }, q.choices[1]);
  assert.equal(upCalled, 1);
  assert.equal(downCalled, 1);
  assert.equal(preventDefaultCalled, 2);
});

QUnit.test("Ranking: rankingDragHandleArea Setting ", function(assert) {
  let result;
  let dragStartTargetNode;
  

  var survey = new SurveyModel({
    elements: [
      {
        type: "ranking",
        name: "q1",
        choices: ["a", "b", "c"],
      },
    ],
  });
  var rankingQuestion = <QuestionRankingModel>survey.getQuestionByName("q1");
  const iconHoverClass = rankingQuestion.cssClasses.itemIconHoverMod;


  Settings.rankingDragHandleArea = "icon"; // 1
  dragStartTargetNode = document.createElement("div");
  result = rankingQuestion["isDragStartNodeValid"](dragStartTargetNode);
  assert.equal(result, false);

  dragStartTargetNode.classList.add(iconHoverClass);
  result = rankingQuestion["isDragStartNodeValid"](dragStartTargetNode);
  assert.equal(result, true);
  

  Settings.rankingDragHandleArea = "entireItem"; // 2
  result = rankingQuestion["isDragStartNodeValid"](dragStartTargetNode);
  assert.equal(result, true);

  dragStartTargetNode.classList.remove(iconHoverClass);
  result = rankingQuestion["isDragStartNodeValid"](dragStartTargetNode);
  assert.equal(result, true);


  Settings.rankingDragHandleArea = "some"; // 3
  result = rankingQuestion["isDragStartNodeValid"](dragStartTargetNode);
  assert.equal(result, true);
});

QUnit.test("Ranking: separateSpecialChoices ", function (assert) {
  const prop = "separateSpecialChoices";
  assert.ok(Serializer.findProperty("checkbox", prop).visible, "checkbox separateSpecialChoices is visible");
  assert.notOk(Serializer.findProperty("ranking", prop).visible, "ranking separateSpecialChoices is invisible")
});