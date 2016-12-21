{% if page.useangular %}
<h1>This feature is not supported yet</h1>

{% else %}

{% capture survey_setup %}
function onIsSurveyCompleted(success, result, response) {
    if(!success) return;
    if(result == 'completed') {
        alert('You have already run the survey!');
    } else {
        runSurvey();
    }
}
function runSurveyCheck() {
    var clientId = document.getElementById('clientId').value;
    new Survey.dxSurveyService().isCompleted('47e699f7-d523-4476-8fcd-be601c91d119', clientId, onIsSurveyCompleted);
}
{% if page.useknockout %}
function runSurvey() {
    var survey = new Survey.Model({
            surveyId: 'e7866476-e901-4ab7-9f38-574416387f73',
            surveyPostId: 'df2a04fb-ce9b-44a6-a6a7-6183ac555a68'
    }, "surveyContainer");
    survey.clientId = document.getElementById('clientId').value;
    survey.sendResultOnPageNext = document.getElementById('sendResultOnPageNext').checked;
    survey.onComplete.add(function (s) { 
        document.getElementById('surveyContainer').innerHTML = ""; 
        document.getElementById("clientIdContainer").style.display = "inline";
    });
    survey.onSendResult.add(function (survey) { 
        var text = "clientId:" + survey.clientId + ". The results are:" + JSON.stringify(survey.data)  + String.fromCharCode(13, 10);
        var memo = document.getElementById('sentResults');
        memo.value = memo.value + text;
    });
    document.getElementById("clientIdContainer").style.display = "none";
}

{% else %}
function runSurvey() {
    document.getElementById("clientIdContainer").style.display = "none";    
    survey.sendResultOnPageNext = document.getElementById('sendResultOnPageNext').checked;
    var clientId = document.getElementById('clientId').value;
    var surveyComplete = function (s) { 
        document.getElementById('surveyContainer').innerHTML = ""; 
        document.getElementById("clientIdContainer").style.display = "inline";
    };
    var surveySendResult = function (survey) { 
        var text = "clientId:" + survey.clientId + ". The results are:" + JSON.stringify(survey.data)  + String.fromCharCode(13, 10);
        var memo = document.getElementById('sentResults');
        memo.value = memo.value + text;
    };
    
{% if page.usereact %}
ReactDOM.render(<Survey.Survey model={survey} clientId={clientId} onComplete={surveyComplete} onSendResult={surveySendResult} />, document.getElementById("surveyElement"));
{% elsif page.usejquery %}
    $("#surveyElement").Survey({
        model: survey,
        clientId: clientId,
        onComplete: surveyComplete,
        onSendResult: surveySendResult
    });
{% endif %}
}

var survey = new Survey.Model({
        surveyId: 'e7866476-e901-4ab7-9f38-574416387f73',
        surveyPostId: 'df2a04fb-ce9b-44a6-a6a7-6183ac555a68'
}, "surveyContainer");
window.runSurveyCheck = runSurveyCheck;
{% endif %}

{% endcapture %}
{% endif %}
{% include live-example-code.html %}