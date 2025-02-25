import * as React from "react";
import { Base, ArrayChanges, SurveyModel, Helpers, PanelModel, LocalizableString, Question } from "survey-core";
import { ISurveyCreator } from "./reactquestion";
import { ReactElementFactory } from "./element-factory";
import { ReactSurveyElementsWrapper } from "./reactsurveymodel";

export class SurveyElementBase<P, S> extends React.Component<P, S> {
  public static renderLocString(
    locStr: LocalizableString,
    style: any = null,
    key?: string
  ): React.JSX.Element {
    return ReactElementFactory.Instance.createElement(locStr.renderAs, {
      locStr: locStr.renderAsData,
      style: style,
      key: key,
    });
  }
  public static renderQuestionDescription(question: Question | PanelModel): React.JSX.Element {
    var descriptionText = SurveyElementBase.renderLocString(question.locDescription);
    return <div style={question.hasDescription ? undefined : { display: "none" }} id={question.ariaDescriptionId} className={question.cssDescription}>{descriptionText}</div>;
  }
  private changedStatePropNameValue: string | undefined;
  constructor(props: any) {
    super(props);
  }
  componentDidMount() {
    this.makeBaseElementsReact();
  }
  componentWillUnmount() {
    this.unMakeBaseElementsReact();
    this.disableStateElementsRerenderEvent(this.getStateElements());
  }
  componentDidUpdate(prevProps: any, prevState: any) {
    const stateElements = this.getStateElements();
    this.disableStateElementsRerenderEvent((this.prevStateElements ?? []).filter(el => !stateElements.find(stateElement => stateElement == el)));
    this.unMakeBaseElementsReactive(this.prevStateElements ?? []);
    this.prevStateElements = [];
    this.makeBaseElementsReact();
    this.getStateElements().forEach((el) => {
      el.afterRerender();
    });
  }
  private _allowComponentUpdate = true;
  protected allowComponentUpdate() {
    this._allowComponentUpdate = true;
    this.forceUpdate();
  }
  protected denyComponentUpdate() {
    this._allowComponentUpdate = false;
  }
  private prevStateElements: Array<Base> = [];
  shouldComponentUpdate(nextProps: any, nextState: any): boolean {
    if (this._allowComponentUpdate) {
      this.prevStateElements = this.getStateElements();
    }
    return this._allowComponentUpdate;
  }
  render(): React.JSX.Element | null {
    if (!this.canRender()) {
      return null;
    }

    this.startEndRendering(1);
    var res = this.renderElement();
    this.startEndRendering(-1);

    if (!!res) {
      res = this.wrapElement(res);
    }

    this.changedStatePropNameValue = undefined;
    return res;
  }
  protected wrapElement(element: React.JSX.Element): React.JSX.Element {
    return element;
  }
  protected get isRendering(): boolean {
    var stateEls: Array<any> = this.getRenderedElements();
    for (let stateEl of stateEls) {
      if (stateEl.reactRendering > 0) return true;
    }
    return false;
  }
  protected getRenderedElements(): Base[] {
    return this.getStateElements();
  }
  private startEndRendering(val: number) {
    var stateEls: Array<any> = this.getRenderedElements();
    for (let stateEl of stateEls) {
      if (!stateEl.reactRendering) stateEl.reactRendering = 0;
      stateEl.reactRendering += val;
    }
  }
  protected canRender(): boolean {
    return true;
  }
  protected renderElement(): React.JSX.Element | null {
    return null;
  }
  protected get changedStatePropName(): string | undefined {
    return this.changedStatePropNameValue;
  }
  private makeBaseElementsReact() {
    var els = this.getStateElements();
    for (var i = 0; i < els.length; i++) {
      els[i].enableOnElementRerenderedEvent();
      this.makeBaseElementReact(els[i]);
    }
  }
  private unMakeBaseElementsReact() {
    var els = this.getStateElements();
    this.unMakeBaseElementsReactive(els);
  }
  private unMakeBaseElementsReactive(els: Array<Base>) {
    for (var i = 0; i < els.length; i++) {
      this.unMakeBaseElementReact(els[i]);
    }
  }
  protected disableStateElementsRerenderEvent(els: Array<Base>): void {
    els.forEach(el => {
      el.disableOnElementRerenderedEvent();
    });
  }
  protected getStateElements(): Array<Base> {
    var el = this.getStateElement();
    return !!el ? [el] : [];
  }
  protected getStateElement(): Base | null {
    return null;
  }
  protected get isDisplayMode(): boolean {
    const props: any = this.props;
    return props.isDisplayMode || false;
  }
  protected renderLocString(
    locStr: LocalizableString,
    style: any = null,
    key?: string
  ): React.JSX.Element {
    return SurveyElementBase.renderLocString(locStr, style, key);
  }
  private canMakeReact(stateElement: Base): boolean {
    return !!stateElement && !!stateElement.iteratePropertiesHash;
  }
  private propertyValueChangedHandler = (hash: any, key: string, val: any) => {
    if (hash[key] !== val) {
      hash[key] = val;
      if (!this.canUsePropInState(key)) return;
      if (this.isRendering) return;
      this.changedStatePropNameValue = key;
      this.setState((state: any) => {
        var newState: { [index: string]: any } = {};
        newState[key] = val;
        return newState as S;
      });
    }
  };
  protected isCurrentStateElement(stateElement: Base) {
    return !!stateElement && !!stateElement.setPropertyValueCoreHandler && stateElement.setPropertyValueCoreHandler === this.propertyValueChangedHandler;
  }
  private makeBaseElementReact(stateElement: Base) {
    if (!this.canMakeReact(stateElement)) return;
    stateElement.iteratePropertiesHash((hash, key) => {
      if (!this.canUsePropInState(key)) return;
      var val: any = hash[key];
      if (Array.isArray(val)) {
        var val: any = val;
        val["onArrayChanged"] = (arrayChanges: ArrayChanges) => {
          if (this.isRendering) return;
          this.changedStatePropNameValue = key;
          this.setState((state: any) => {
            var newState: { [index: string]: any } = {};
            newState[key] = val;
            return newState as S;
          });
        };
      }
    });
    stateElement.setPropertyValueCoreHandler = this.propertyValueChangedHandler;
  }
  protected canUsePropInState(key: string): boolean {
    return true;
  }
  private unMakeBaseElementReact(stateElement: Base) {
    if (!this.canMakeReact(stateElement)) return;
    if (!this.isCurrentStateElement(stateElement)) {
      // eslint-disable-next-line no-console
      console.warn("Looks like the component is bound to another survey element. It is not supported and can lead to issues.");
    }
    stateElement.setPropertyValueCoreHandler = undefined as any;
    stateElement.iteratePropertiesHash((hash, key) => {
      var val: any = hash[key];
      if (Array.isArray(val)) {
        var val: any = val;
        val["onArrayChanged"] = () => { };
      }
    });
  }
}

export class ReactSurveyElement extends SurveyElementBase<any, any> {
  constructor(props: any) {
    super(props);
  }
  protected get cssClasses(): any {
    return this.props.cssClasses;
  }
}

export class SurveyQuestionElementBase extends SurveyElementBase<any, any> {
  control: HTMLElement;
  content: HTMLElement;
  constructor(props: any) {
    super(props);
  }
  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate(prevProps, prevState);
    this.updateDomElement();
  }
  componentDidMount() {
    super.componentDidMount();
    this.updateDomElement();
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    if (!!this.questionBase) {
      const contentElement: HTMLElement = this.content || this.control;
      this.questionBase.beforeDestroyQuestionElement(contentElement);
      if (!!contentElement) {
        contentElement.removeAttribute("data-rendered");
      }
    }
  }
  protected updateDomElement() {
    const contentElement = this.content || this.control;
    if (!!contentElement) {
      if (contentElement.getAttribute("data-rendered") !== "r") {
        contentElement.setAttribute("data-rendered", "r");
        this.questionBase.afterRenderQuestionElement(contentElement);
      }
    }
  }
  protected get questionBase(): Question {
    return this.props.question;
  }
  protected getRenderedElements(): Base[] {
    return [this.questionBase];
  }
  protected get creator(): ISurveyCreator {
    return this.props.creator;
  }
  protected canRender(): boolean {
    return !!this.questionBase && !!this.creator;
  }
  public shouldComponentUpdate(nextProps: any, nextState: any): boolean {
    if (!super.shouldComponentUpdate(nextProps, nextState)) return false;

    return (
      !this.questionBase.customWidget ||
      !!this.questionBase.customWidgetData.isNeedRender ||
      !!this.questionBase.customWidget.widgetJson.isDefaultRender ||
      !!this.questionBase.customWidget.widgetJson.render
    );
  }
  protected get isDisplayMode(): boolean {
    const props: any = this.props;
    return (
      props.isDisplayMode ||
      (!!this.questionBase && this.questionBase.isInputReadOnly) || false
    );
  }
  protected wrapCell(
    cell: any,
    element: React.JSX.Element,
    reason: string
  ): React.JSX.Element {
    if (!reason) {
      return element;
    }
    const survey: SurveyModel = this.questionBase
      .survey as SurveyModel;
    let wrapper: React.JSX.Element | null = null;
    if (survey) {
      wrapper = ReactSurveyElementsWrapper.wrapMatrixCell(survey, element, cell, reason);
    }
    return wrapper ?? element;
  }
  public setControl(element: HTMLElement | null): void {
    if (!!element) {
      this.control = element;
    }
  }
  public setContent(element: HTMLElement | null): void {
    if (!!element) {
      this.content = element;
    }
  }
}

export class SurveyQuestionUncontrolledElement<
  T extends Question
> extends SurveyQuestionElementBase {
  constructor(props: any) {
    super(props);
    this.updateValueOnEvent = this.updateValueOnEvent.bind(this);
  }
  protected get question(): T {
    return this.questionBase as T;
  }
  updateValueOnEvent = (event: any) => {
    if (
      !Helpers.isTwoValueEquals(this.questionBase.value, event.target.value, false, true, false)
    ) {
      this.setValueCore(event.target.value);
    }
  };
  protected setValueCore(newValue: any) {
    this.questionBase.value = newValue;
  }
  protected getValueCore(): any {
    return this.questionBase.value;
  }
  protected updateDomElement() {
    if (!!this.control) {
      const control: any = this.control;
      const newValue = this.getValueCore();
      if (!Helpers.isTwoValueEquals(newValue, control.value, false, true, false)) {
        control.value = this.getValue(newValue);
      }
    }
    super.updateDomElement();
  }
  private getValue(val: any): any {
    if (Helpers.isValueEmpty(val)) return "";
    return val;
  }
}
