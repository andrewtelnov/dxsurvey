{% if page.usereact %}
{% capture survey_setup %}
var survey = new Survey.Model({% include surveys/survey-data.json %});
var data = {name:"John Doe", email: "johndoe@nobody.com", car:["Ford"]};
var surveyValueChanged = function (sender, options) {
    var el = document.getElementById(options.name);
    if(el) {
        el.value = options.value;
    }
};
ReactDOM.render(<Survey.Survey model={survey} data={data} onValueChanged={surveyValueChanged} />, document.getElementById("surveyElement"));
{% endcapture %}

{% include live-example-code.html %}
{% elsif page.useknockout%}
{% capture survey_setup %}
var survey = new Survey.Model({% include surveys/survey-data.json %});
survey.data = {name:"John Doe", email: "johndoe@nobody.com", car:["Ford"]};
survey.onValueChanged.add(function (sender, options) {
    var el = document.getElementById(options.name);
    if(el) {
        el.value = options.value;
    }
});

{% endcapture %}

{% include live-example-code.html %}
{% elsif page.useangular%}
{% capture survey_setup %}
var survey = new Survey.Model({% include surveys/survey-data.json %});
var data = {name:"John Doe", email: "johndoe@nobody.com", car:["Ford"]};
var surveyValueChanged = function (sender, options) {
    var el = document.getElementById(options.name);
    if(el) {
        el.value = options.value;
    }
};
function onAngularComponentInit() {
    Survey.SurveyNG.render("surveyElement", {
        model:survey,
        data: data,
        onValueChanged: surveyValueChanged
    });
}
{% include examplesetups/angular-example-component.md %}
{% endcapture %}

{% include live-example-code.html %}
{% elsif page.usejquery%}
{% capture survey_setup %}
var survey = new Survey.Model({% include surveys/survey-data.json %});
var data = {name:"John Doe", email: "johndoe@nobody.com", car:["Ford"]};
var surveyValueChanged = function (sender, options) {
    var el = document.getElementById(options.name);
    if(el) {
        el.value = options.value;
    }
};
$("#surveyElement").Survey({
    model: survey,
    data: data,
    onValueChanged: surveyValueChanged
});
{% endcapture %}

{% include live-example-code.html %}
{% endif %}