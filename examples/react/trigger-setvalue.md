---
layout: example
usereact: true
title: SetValue Trigger - on changing the question, change values of other questions.
---
{% capture survey_setup %}
var survey = new Survey.ReactSurveyModel({% include surveys/trigger-setvalue.json %});
ReactDOM.render(<Survey.Survey model={survey} />, document.getElementById("surveyElement"));
{% endcapture %}
{% include live-example-code.html %}
