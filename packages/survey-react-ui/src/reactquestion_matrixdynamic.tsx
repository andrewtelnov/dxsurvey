import * as React from "react";
import { ReactQuestionFactory } from "./reactquestion_factory";
import { SurveyQuestionMatrixDropdownBase } from "./reactquestion_matrixdropdownbase";
import { Question, QuestionMatrixDynamicModel } from "survey-core";
import { ReactElementFactory } from "./element-factory";
import { ReactSurveyElement } from "./reactquestion_element";

export class SurveyQuestionMatrixDynamic extends SurveyQuestionMatrixDropdownBase {
  constructor(props: any) {
    super(props);
    this.handleOnRowAddClick = this.handleOnRowAddClick.bind(this);
  }
  protected get matrix(): QuestionMatrixDynamicModel {
    return this.questionBase as QuestionMatrixDynamicModel;
  }
  handleOnRowAddClick(event: any) {
    this.matrix.addRowUI();
  }
  protected renderElement(): React.JSX.Element {
    var cssClasses = this.question.cssClasses;
    var showTable = this.question.renderedTable.showTable;
    var mainDiv = showTable
      ? this.renderTableDiv()
      : this.renderNoRowsContent(cssClasses);
    return (
      <div>
        {this.renderAddRowButtonOnTop(cssClasses)}
        {mainDiv}
        {this.renderAddRowButtonOnBottom(cssClasses)}
      </div>
    );
  }
  protected renderAddRowButtonOnTop(cssClasses: any): React.JSX.Element | null {
    if (!this.matrix.renderedTable.showAddRowOnTop) return null;
    return this.renderAddRowButton(cssClasses);
  }
  protected renderAddRowButtonOnBottom(cssClasses: any): React.JSX.Element | null {
    if (!this.matrix.renderedTable.showAddRowOnBottom) return null;
    return this.renderAddRowButton(cssClasses);
  }
  protected renderNoRowsContent(cssClasses: any): React.JSX.Element {
    return ReactElementFactory.Instance.createElement("sv-placeholder-matrixdynamic", { cssClasses: cssClasses, question: this.matrix });
  }
  protected renderAddRowButton(
    cssClasses: any,
    isEmptySection: boolean = false
  ): React.JSX.Element {
    return ReactElementFactory.Instance.createElement("sv-matrixdynamic-add-btn", {
      question: this.question, cssClasses, isEmptySection
    });
  }
}

ReactQuestionFactory.Instance.registerQuestion("matrixdynamic", (props) => {
  return React.createElement(SurveyQuestionMatrixDynamic, props);
});

export class SurveyQuestionMatrixDynamicAddButton extends ReactSurveyElement {
  constructor(props: any) {
    super(props);
    this.handleOnRowAddClick = this.handleOnRowAddClick.bind(this);
  }
  protected get matrix(): QuestionMatrixDynamicModel {
    return this.props.question as QuestionMatrixDynamicModel;
  }
  handleOnRowAddClick(event: any) {
    this.matrix.addRowUI();
  }
  protected renderElement(): React.JSX.Element {
    const addRowText: React.JSX.Element = this.renderLocString(this.matrix.locAddRowText);
    const addButton = (<button
      className={this.matrix.getAddRowButtonCss(this.props.isEmptySection)}
      type="button"
      disabled={this.matrix.isInputReadOnly}
      onClick={
        this.matrix.isDesignMode ? undefined : this.handleOnRowAddClick
      }
    >
      {addRowText}
      <span className={this.props.cssClasses.iconAdd} />
    </button>);
    return (
      this.props.isEmptySection ? addButton : <div className={this.props.cssClasses.footer}>{addButton}</div>
    );
  }
}

export class SurveyQuestionMatrixDynamicPlaceholder extends ReactSurveyElement {
  constructor(props: any) {
    super(props);
  }
  protected renderElement(): React.JSX.Element {
    const cssClasses = this.props.cssClasses;
    const matrix = this.props.question;
    const showAddButton = matrix.renderedTable.showAddRow;
    const text: React.JSX.Element = this.renderLocString(matrix.locNoRowsText);
    const textDiv: React.JSX.Element = <div className={cssClasses.noRowsText}>{text}</div>;
    const btn: React.JSX.Element | undefined = showAddButton ? this.renderAddRowButton(cssClasses, matrix) : undefined;
    return (
      <div className={cssClasses.noRowsSection}>
        {textDiv}
        {btn}
      </div>
    );
  }
  protected renderAddRowButton(cssClasses: any, question: Question): React.JSX.Element {
    return ReactElementFactory.Instance.createElement("sv-matrixdynamic-add-btn", {
      question: question, cssClasses: cssClasses, isEmptySection: true });
  }
}

ReactElementFactory.Instance.registerElement("sv-matrixdynamic-add-btn",
  (props) => { return React.createElement(SurveyQuestionMatrixDynamicAddButton, props); });

ReactElementFactory.Instance.registerElement("sv-placeholder-matrixdynamic",
  (props) => { return React.createElement(SurveyQuestionMatrixDynamicPlaceholder, props); });