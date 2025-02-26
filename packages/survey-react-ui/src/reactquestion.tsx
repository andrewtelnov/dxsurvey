import * as React from "react";
import {
  Base,
  SurveyElement,
  SurveyError,
  Question,
  QuestionMatrixDropdownRenderedCell,
  SurveyModel
} from "survey-core";
import { ReactSurveyElementsWrapper } from "./reactsurveymodel";
import { ReactElementFactory } from "./element-factory";
import { SurveyElementBase, ReactSurveyElement } from "./reactquestion_element";
import { SurveyQuestionCommentItem } from "./reactquestion_comment";
import { SurveyCustomWidget } from "./custom-widget";
import { SurveyElementHeader } from "./element-header";
import { SurveyQuestionSigleInputSummary } from "./reactquestion_singleinputsummary";
import { SurveyBreadcrumbs } from "./components/breadcrumbs/breadcrumbs";
import { SurveyAction } from "./components/action-bar/action-bar-item";

export interface ISurveyCreator {
  createQuestionElement(question: Question): React.JSX.Element | null;
  renderError(key: string, error: SurveyError, cssClasses: any, element?: any): React.JSX.Element;
  questionTitleLocation(): string;
  questionErrorLocation(): string;
}

export class SurveyQuestion extends SurveyElementBase<any, any> {
  private isNeedFocus = false;
  public static renderQuestionBody(
    creator: ISurveyCreator,
    question: Question
  ): React.JSX.Element | any {
    // if (!question.isVisible) return null;
    var customWidget = question.customWidget;
    if (!customWidget) {
      return creator.createQuestionElement(question);
    }
    return <SurveyCustomWidget creator={creator} question={question} />;
  }
  private rootRef: React.RefObject<HTMLDivElement>;
  constructor(props: any) {
    super(props);
    this.rootRef = React.createRef();
  }
  protected getStateElement(): Base {
    return this.question;
  }
  protected get question(): Question {
    return this.props.element;
  }
  private get creator(): ISurveyCreator {
    return this.props.creator;
  }
  componentDidMount() {
    super.componentDidMount();
    if (!!this.question) {
      this.question["react"] = this;
    }
    this.doAfterRender();
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    if (!!this.question) {
      this.question["react"] = null;
    }
    const el = this.rootRef.current;
    if (!!el) {
      el.removeAttribute("data-rendered");
    }
  }
  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate(prevProps, prevState);
    this.doAfterRender();
  }
  private doAfterRender() {
    if (this.isNeedFocus) {
      if (!this.question.isCollapsed) {
        this.question.clickTitleFunction();
      }
      this.isNeedFocus = false;
    }
    if (this.question) {
      var el = this.rootRef.current;
      if (el && el.getAttribute("data-rendered") !== "r") {
        el.setAttribute("data-rendered", "r");
        if (this.question.afterRender) {
          this.question.afterRender(el);
        }
      }
    }
  }
  protected canRender(): boolean {
    return (
      super.canRender() &&
      !!this.question &&
      !!this.creator
    );
  }

  protected renderQuestionContent(): React.JSX.Element {
    let question = this.question;
    var contentStyle = {
      display: this.question.renderedIsExpanded ? "" : "none",
    };
    var cssClasses = question.cssClasses;
    var questionRender = this.renderQuestion();
    var errorsTop = this.question.showErrorOnTop
      ? this.renderErrors(cssClasses, "top")
      : null;
    var errorsBottom = this.question.showErrorOnBottom
      ? this.renderErrors(cssClasses, "bottom")
      : null;
    var comment =
      question && question.hasComment ? this.renderComment(cssClasses) : null;
    var descriptionUnderInput = question.hasDescriptionUnderInput
      ? this.renderDescription()
      : null;
    return (
      <div
        className={question.cssContent || undefined}
        style={contentStyle}
        role="presentation"
      >
        {errorsTop}
        {questionRender}
        {comment}
        {errorsBottom}
        {descriptionUnderInput}
      </div>
    );
  }
  protected renderElement(): React.JSX.Element {
    var question = this.question;
    var cssClasses = question.cssClasses;
    var header = this.renderHeader(question);
    var headerTop = question.hasTitleOnLeftTop ? header : null;
    var headerBottom = question.hasTitleOnBottom ? header : null;

    const errorsAboveQuestion = this.question.showErrorsAboveQuestion
      ? this.renderErrors(cssClasses, "")
      : null;

    const errorsBelowQuestion = this.question.showErrorsBelowQuestion
      ? this.renderErrors(cssClasses, "")
      : null;

    const rootStyle = question.getRootStyle();
    const singleBreadcrumbs = question.singleInputHasActions ? this.renderSingleInputBreadcrumbs(question, cssClasses) : undefined;
    const singleSummary = question.singleInputSummary ? this.renderSingleInputSummary(question, cssClasses) : undefined;
    const singleInput = singleSummary || (question.singleInputQuestion ? this.renderSingleInputQuestion(question, cssClasses) : undefined);
    const questionContent = singleInput || this.wrapQuestionContent(this.renderQuestionContent());

    return (
      <>
        <div
          ref={this.rootRef}
          id={question.id}
          className={question.getRootCss()}
          style={rootStyle}
          role={question.ariaRole}
          aria-required={this.question.ariaRequired}
          aria-invalid={this.question.ariaInvalid}
          aria-labelledby={question.ariaLabelledBy}
          aria-describedby={question.ariaDescribedBy}
          aria-expanded={question.ariaExpanded}
          data-name={question.name}
        >
          {singleBreadcrumbs}
          {errorsAboveQuestion}
          {headerTop}
          {questionContent}
          {headerBottom}
          {errorsBelowQuestion}
        </div>
      </>
    );
  }
  private renderSingleInputQuestion(question: Question, cssClasses: any): React.JSX.Element {
    const singleQuestion = question.singleInputQuestion;
    const key = singleQuestion.id;
    return <SurveyQuestion key={key} element={singleQuestion} creator={this.creator} css={cssClasses} />;

  }
  protected renderSingleInputBreadcrumbs(question: Question, cssClasses: any): React.JSX.Element {
    return <SurveyBreadcrumbs items={question.singleInputActions} css={cssClasses} />;
  }
  protected renderSingleInputSummary(question: Question, cssClasses: any): React.JSX.Element {
    return <SurveyQuestionSigleInputSummary summary={question.singleInputSummary} creator={this.creator} css={cssClasses} />;
  }
  protected wrapElement(element: React.JSX.Element): React.JSX.Element {
    const survey: SurveyModel = this.question.survey as SurveyModel;
    let wrapper: React.JSX.Element | null = null;
    if (survey) {
      wrapper = ReactSurveyElementsWrapper.wrapElement(survey, element, this.question);
    }
    return wrapper ?? element;
  }
  protected wrapQuestionContent(element: React.JSX.Element): React.JSX.Element {
    const survey: SurveyModel = this.question.survey as SurveyModel;
    let wrapper: React.JSX.Element | null = null;
    if (survey) {
      wrapper = ReactSurveyElementsWrapper.wrapQuestionContent(survey, element, this.question);
    }
    return wrapper ?? element;
  }
  protected renderQuestion(): React.JSX.Element {
    return SurveyQuestion.renderQuestionBody(this.creator, this.question);
  }
  protected renderDescription(): React.JSX.Element {
    return SurveyElementBase.renderQuestionDescription(this.question);
  }
  protected renderComment(cssClasses: any): React.JSX.Element {
    const commentText = SurveyElementBase.renderLocString(
      this.question.locCommentText
    );
    return (
      <div className={this.question.getCommentAreaCss()}>
        <div>{commentText}</div>
        <SurveyQuestionCommentItem
          question={this.question}
          cssClasses={cssClasses}
          otherCss={cssClasses.other}
          isDisplayMode={this.question.isInputReadOnly}
        />
      </div>
    );
  }
  protected renderHeader(question: Question): React.JSX.Element {
    if(question.singleInputHideHeader) return null;
    return <SurveyElementHeader element={question}></SurveyElementHeader>;
  }
  protected renderErrors(cssClasses: any, location: string): React.JSX.Element {
    return (
      <SurveyElementErrors
        element={this.question}
        cssClasses={cssClasses}
        creator={this.creator}
        location={location}
        id={this.question.id + "_errors"}
      />
    );
  }
}

ReactElementFactory.Instance.registerElement("question", (props) => {
  return React.createElement(SurveyQuestion, props);
});

export class SurveyElementErrors extends ReactSurveyElement {
  constructor(props: any) {
    super(props);
    this.state = this.getState();
  }
  protected get id(): string {
    return this.props.element.id + "_errors";
  }
  protected get element(): SurveyElement {
    return this.props.element;
  }
  private get creator(): ISurveyCreator {
    return this.props.creator;
  }
  protected get location(): string {
    return this.props.location;
  }
  private getState(prevState: any = null) {
    return !prevState ? { error: 0 } : { error: prevState.error + 1 };
  }
  protected canRender(): boolean {
    return !!this.element && this.element.hasVisibleErrors;
  }
  componentWillUnmount() {
  }
  protected renderElement(): React.JSX.Element {
    const errors: Array<React.JSX.Element> = [];
    for (let i = 0; i < this.element.errors.length; i++) {
      const key: string = "error" + i;
      errors.push(
        this.creator.renderError(key, this.element.errors[i], this.cssClasses, this.element)
      );
    }

    return (
      <div
        role="alert"
        aria-live="polite"
        className={this.element.cssError}
        id={this.id}
      >
        {errors}
      </div>
    );
  }
}

export abstract class SurveyQuestionAndErrorsWrapped extends ReactSurveyElement {
  [index: string]: any;
  constructor(props: any) {
    super(props);
  }
  protected getStateElement(): Base {
    return this.question;
  }
  protected get question(): Question {
    return this.getQuestion();
  }
  protected get creator(): ISurveyCreator {
    return this.props.creator;
  }
  protected getQuestion(): Question {
    return this.props.question;
  }
  protected get itemCss(): string {
    return this.props.itemCss;
  }
  componentDidMount() {
    super.componentDidMount();
    this.doAfterRender();
  }
  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate(prevProps, prevState);
    this.doAfterRender();
  }
  protected doAfterRender() { }
  protected canRender(): boolean {
    return !!this.question;
  }
  protected renderContent(): React.JSX.Element {
    var renderedQuestion = this.renderQuestion();
    return (
      <>
        {renderedQuestion}
      </>
    );
  }
  protected abstract renderElement(): React.JSX.Element;
  protected getShowErrors(): boolean {
    return this.question.isVisible;
  }
  protected renderQuestion(): React.JSX.Element {
    return SurveyQuestion.renderQuestionBody(this.creator, this.question);
  }
}

export class SurveyQuestionAndErrorsCell extends SurveyQuestionAndErrorsWrapped {
  [index: string]: any;
  protected cellRef: React.RefObject<HTMLTableCellElement>;
  constructor(props: any) {
    super(props);
    this.cellRef = React.createRef();
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    if (this.question) {
      var el = this.cellRef.current;
      if (!!el) {
        el.removeAttribute("data-rendered");
      }
    }
  }
  protected renderCellContent(): React.JSX.Element {
    return (
      <div className={this.props.cell.cellQuestionWrapperClassName}>
        {this.renderQuestion()}
      </div>
    );
  }
  protected renderElement(): React.JSX.Element {
    var style = this.getCellStyle();
    const cell = this.props.cell;
    const focusIn = () => { cell.focusIn(); };
    return (
      <td
        ref={this.cellRef}
        className={this.itemCss}
        colSpan={cell.colSpans}
        title={cell.getTitle()}
        style={style}
        onFocus={focusIn}
      >
        {this.wrapCell(this.props.cell, this.renderCellContent())}
      </td>
    );
  }
  protected getCellStyle(): any {
    return null;
  }
  protected getHeaderText(): string {
    return "";
  }
  protected wrapCell(
    cell: QuestionMatrixDropdownRenderedCell,
    element: React.JSX.Element
  ): React.JSX.Element {
    if (!cell) {
      return element;
    }
    const survey: SurveyModel = this.question.survey as SurveyModel;
    let wrapper: React.JSX.Element | null = null;
    if (survey) {
      wrapper = ReactSurveyElementsWrapper.wrapMatrixCell(survey, element, cell, this.props.reason);
    }
    return wrapper ?? element;
  }
}

export class SurveyQuestionErrorCell extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      changed: 0
    };
    if (this.question) {
      this.registerCallback(this.question);
    }
  }
  private get question(): Question {
    return this.props.question;
  }
  private update() {
    this.setState({ changed: this.state.changed + 1 });
  }
  protected getQuestionPropertiesToTrack(): string[] {
    return ["errors"];
  }
  private registerCallback(question: Question) {
    question.registerFunctionOnPropertiesValueChanged(this.getQuestionPropertiesToTrack(), () => {
      this.update();
    }, "__reactSubscription");
  }
  private unRegisterCallback(question: Question) {
    question.unRegisterFunctionOnPropertiesValueChanged(this.getQuestionPropertiesToTrack(), "__reactSubscription");
  }
  componentDidUpdate(prevProps: Readonly<any>): void {
    if (prevProps.question && prevProps.question !== this.question) {
      this.unRegisterCallback(prevProps.cell);
    }
    if (this.question) {
      this.registerCallback(this.question);
    }
  }
  componentWillUnmount(): void {
    if (this.question) {
      this.unRegisterCallback(this.question);
    }
  }
  render(): React.JSX.Element {
    return <SurveyElementErrors element={this.question} creator={this.props.creator} cssClasses={this.question.cssClasses}></SurveyElementErrors>;
  }
}
