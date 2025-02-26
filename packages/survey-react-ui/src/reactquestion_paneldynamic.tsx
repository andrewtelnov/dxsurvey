import * as React from "react";
import { SurveyQuestionElementBase } from "./reactquestion_element";
import { SurveyModel, Question, QuestionPanelDynamicModel } from "survey-core";
import { SurveyPanel } from "./panel";
import { ReactQuestionFactory } from "./reactquestion_factory";
import { SurveyActionBar } from "./components/action-bar/action-bar";
import { SurveyQuestionPanelDynamicNextButton } from "./components/paneldynamic-actions/paneldynamic-next-btn";
import { SurveyQuestionPanelDynamicPrevButton } from "./components/paneldynamic-actions/paneldynamic-prev-btn";
import { SurveyQuestionPanelDynamicProgressText } from "./components/paneldynamic-actions/paneldynamic-progress-text";
import { ReactElementFactory } from "./element-factory";
import { ReactSurveyElement } from "./reactquestion_element";

export class SurveyQuestionPanelDynamic extends SurveyQuestionElementBase {
  constructor(props: any) {
    super(props);
  }
  protected get question(): QuestionPanelDynamicModel {
    return this.questionBase as QuestionPanelDynamicModel;
  }
  componentDidMount() {
    super.componentDidMount();
    this.setState({ panelCounter: 0 });
    const self: SurveyQuestionPanelDynamic = this;
    this.question.panelCountChangedCallback = function () {
      self.updateQuestionRendering();
    };
    this.question.currentIndexChangedCallback = function () {
      self.updateQuestionRendering();
    };
    this.question.renderModeChangedCallback = function () {
      self.updateQuestionRendering();
    };
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    this.question.panelCountChangedCallback = () => { };
    this.question.currentIndexChangedCallback = () => { };
    this.question.renderModeChangedCallback = () => { };
  }
  private updateQuestionRendering() {
    this.setState({
      panelCounter: this.state ? this.state.panelCounter + 1 : 1,
    });
  }
  protected renderElement(): React.JSX.Element {
    const panels: Array<React.JSX.Element> = [];
    const cssClasses = this.question.cssClasses;
    this.question.renderedPanels.forEach((panel, index) => {
      panels.push(<SurveyQuestionPanelDynamicItem
        key={panel.id}
        element={panel}
        question={this.question}
        index={index}
        cssClasses={cssClasses}
        isDisplayMode={this.isDisplayMode}
        creator={this.creator}
      />);
    });
    const btnAdd: React.JSX.Element | null = this.question.isRenderModeList && this.question["showLegacyNavigation"]
      ? this.renderAddRowButton()
      : null;
    const navTop: React.JSX.Element | null = this.question.isProgressTopShowing
      ? this.renderNavigator()
      : null;
    const navBottom: React.JSX.Element | null = this.question.isProgressBottomShowing
      ? this.renderNavigator()
      : null;

    const navV2 = this.renderNavigatorV2();
    const noEntriesPlaceholder = this.renderPlaceholder(cssClasses);
    return (
      <div className={cssClasses.root}>
        {this.question.hasTabbedMenu ? <div className={this.question.getTabsContainerCss()}><SurveyActionBar model={this.question.tabbedMenu}></SurveyActionBar></div> : null }
        {noEntriesPlaceholder}
        {navTop}
        <div className={cssClasses.panelsContainer}>
          {panels}
        </div>
        {navBottom}
        {btnAdd}
        {navV2}
      </div>
    );
  }
  protected renderNavigator(): React.JSX.Element | null {
    if (!this.question["showLegacyNavigation"]) {
      if (this.question.isRangeShowing && this.question.isProgressTopShowing) {
        return this.renderRange();
      } else {
        return null;
      }
    }
    const range: React.JSX.Element | null = this.question.isRangeShowing ? this.renderRange() : null;
    const btnPrev: React.JSX.Element = this.rendrerPrevButton();
    const btnNext: React.JSX.Element = this.rendrerNextButton();
    const btnAdd: React.JSX.Element | null = this.renderAddRowButton();
    const progressClass: string = this.question.isProgressTopShowing
      ? this.question.cssClasses.progressTop
      : this.question.cssClasses.progressBottom;
    return (
      <div className={progressClass}>
        <div style={{ clear: "both" }}>
          <div className={this.question.cssClasses.progressContainer}>
            {btnPrev}
            {range}
            {btnNext}
          </div>
          {btnAdd}
          {this.renderProgressText()}
        </div>
      </div>
    );
  }
  private renderProgressText(): React.JSX.Element {
    return (
      <SurveyQuestionPanelDynamicProgressText data={{ question: this.question }}></SurveyQuestionPanelDynamicProgressText>
    );
  }

  protected rendrerPrevButton() {
    return (
      <SurveyQuestionPanelDynamicPrevButton data={{ question: this.question }}></SurveyQuestionPanelDynamicPrevButton>
    );
  }
  protected rendrerNextButton() {
    return (
      <SurveyQuestionPanelDynamicNextButton data={{ question: this.question }}></SurveyQuestionPanelDynamicNextButton>
    );
  }

  protected renderRange(): React.JSX.Element {
    return (
      <div className={this.question.cssClasses.progress}>
        <div
          className={this.question.cssClasses.progressBar}
          style={{ width: this.question.progress }}
          role="progressbar"
        />
      </div>
    );
  }
  protected renderAddRowButton(): React.JSX.Element | null {
    return ReactElementFactory.Instance.createElement("sv-paneldynamic-add-btn", {
      data: { question: this.question }
    });
  }
  protected renderNavigatorV2(): React.JSX.Element | null {
    if (!this.question.showNavigation) return null;
    const range: React.JSX.Element | null = this.question.isRangeShowing && this.question.isProgressBottomShowing ? this.renderRange() : null;
    return (<div className={this.question.cssClasses.footer}>
      <hr className={this.question.cssClasses.separator} />
      {range}
      {this.question.footerToolbar.visibleActions.length ? (<div className={this.question.cssClasses.footerButtonsContainer}>
        <SurveyActionBar model={this.question.footerToolbar}></SurveyActionBar>
      </div>) : null}
    </div>);
  }
  protected renderPlaceholder(cssClasses: any): React.JSX.Element | null {
    if (this.question.getShowNoEntriesPlaceholder())
      return ReactElementFactory.Instance.createElement("sv-placeholder-paneldynamic", { cssClasses: cssClasses, question: this.question });
    return null;
  }
}

export class SurveyQuestionPanelDynamicItem extends SurveyPanel {
  private get question(): QuestionPanelDynamicModel {
    return this.props.question;
  }
  private get index(): number {
    return this.props.index;
  }
  protected getSurvey(): SurveyModel | null {
    return !!this.question ? (this.question.survey as SurveyModel) : null;
  }
  protected getCss(): any {
    const survey = this.getSurvey();
    return !!survey ? survey.getCss() : {};
  }
  public render() {
    const panel = super.render();
    const removeButton = this.renderButton();
    const separator: React.JSX.Element | null = this.question.showSeparator(this.index) ?
      (<hr className={this.question.cssClasses.separator} />) : null;
    return (
      <>
        <div className={this.question.getPanelWrapperCss(this.panel)}>
          {panel}
          {removeButton}
        </div>
        {separator}
      </>
    );
  }
  protected renderButton(): React.JSX.Element | null {
    if (!this.question.canRenderRemovePanelOnRight(this.panel)) return null;
    return ReactElementFactory.Instance.createElement("sv-paneldynamic-remove-btn", {
      data: { question: this.question, panel: this.panel }
    });
  }
}

ReactQuestionFactory.Instance.registerQuestion("paneldynamic", props => {
  return React.createElement(SurveyQuestionPanelDynamic, props);
});

export class SurveyQuestionPanelDynamicPlaceholder extends ReactSurveyElement {
  constructor(props: any) {
    super(props);
  }
  protected renderElement(): React.JSX.Element {
    const cssClasses = this.props.cssClasses;
    const question = this.props.question;
    return (
      <div className={cssClasses.noEntriesPlaceholder}>
        <span>{this.renderLocString(question.locNoEntriesText)}</span>
        {this.renderAddRowButton(question)}
      </div>
    );
  }
  protected renderAddRowButton(question: Question): React.JSX.Element {
    return ReactElementFactory.Instance.createElement("sv-paneldynamic-add-btn", {
      data: { question: question }
    });
  }
}

ReactElementFactory.Instance.registerElement("sv-placeholder-paneldynamic",
  (props) => { return React.createElement(SurveyQuestionPanelDynamicPlaceholder, props); });