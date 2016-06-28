﻿/// <reference path="../survey.ts" />
/// <reference path="../question.ts" />
/// <reference path="../surveyStrings.ts" />
/// <reference path="../../typings/react/react.d.ts" />
/// <reference path="reactQuestioncomment.tsx" />

module Survey {
    export interface IReactSurveyCreator {
        createQuestionElement(question: QuestionBase): JSX.Element;
        renderError(key: string, errorText: string): JSX.Element;
    }
}

class ReactSurveyQuestion extends React.Component<any, any> {
    private questionBase: Survey.QuestionBase;
    protected question: Survey.Question;
    private creator: Survey.IReactSurveyCreator;
    protected css: any;
    constructor(props: any) {
        super(props);
        this.setQuestion(props.question);
        this.creator = props.creator;
        this.css = props.css;
    }
    componentWillReceiveProps(nextProps: any) {
        this.creator = nextProps.creator;
        this.css = nextProps.css;
        this.setQuestion(nextProps.question);
    }
    private setQuestion(question) {
        this.questionBase = question;
        this.question = question instanceof Survey.Question ? question : null;
        if (this.question) {
            var self = this;
            this.question.errorsChangedCallback = function () {
                self.state.error = self.state.error + 1;
                self.setState(self.state);
            }
        }
        var value = this.question ? this.question.value : null;
        this.state = { visible: this.questionBase.visible, value: value, error: 0 };
    }
    render(): JSX.Element {
        if (!this.questionBase || !this.creator) return null;
        this.questionBase["react"] = this; //TODO
        if (!this.questionBase.visible) return null;
        var className = "ReactSurveyQuestion" + this.questionBase.getType();
        var questionRender = this.creator.createQuestionElement(this.questionBase);
        var title = this.questionBase.hasTitle ? this.renderTitle() : null;
        var comment = (this.question && this.question.hasComment) ? this.renderComment() : null;
        var errors = (this.question && this.question.errors.length > 0) ? this.renderErrors() : null;
        var className = this.css.question.root + " " + this.question.rootCss;
        return (
            <div id={this.questionBase.id} className={className}>
                {title}
                {errors}
                {questionRender}
                {comment}
            </div>
        );
    }
    protected renderTitle(): JSX.Element {
        var titleText = this.question.fullTitle;
        return (<h5 className={this.css.question.title}>{titleText}</h5>);
    }
    protected renderComment(): JSX.Element {
        var otherText = Survey.surveyLocalization.getString("otherItemText");
        return (<div>
                <div>{otherText}</div>
                <div className={this.css.question.comment}>
                <ReactSurveyQuestionCommentItem  question={this.question}/>
                </div>
            </div>);
    }
    protected renderErrors(): JSX.Element {
        var errors = [];
        for (var i = 0; i < this.question.errors.length; i++) {
            var errorText = this.question.errors[i].getText();
            var key = "error" + i;
            errors.push(this.creator.renderError(key, errorText));
        }
        return (<div className={this.css.error.root}>{errors}</div>);
    }
}