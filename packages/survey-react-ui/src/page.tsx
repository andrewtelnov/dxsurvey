import * as React from "react";
import { PageModel, PanelModelBase } from "survey-core";
import { SurveyElementBase } from "./reactquestion_element";
import { SurveyPanelBase } from "./panel-base";
import { TitleElement } from "./components/title/title-element";
import { SurveyElementErrors } from "./reactquestion";

export class SurveyPage extends SurveyPanelBase {
  constructor(props: any) {
    super(props);
  }
  protected getPanelBase(): PanelModelBase {
    return this.props.page;
  }
  public get page(): PageModel {
    return this.panelBase as PageModel;
  }

  protected renderElement(): React.JSX.Element {
    var title = this.renderTitle();
    var description = this.renderDescription();
    var rows = this.renderRows(this.panelBase.cssClasses);
    const errors = (
      <SurveyElementErrors
        element={this.panelBase}
        cssClasses={this.panelBase.cssClasses}
        creator={this.creator}
      />
    );
    return (
      <div ref={this.rootRef} className={this.page.cssRoot}>
        {title}
        {description}
        {errors}
        {rows}
      </div >
    );
  }
  protected renderTitle(): React.JSX.Element {
    return <TitleElement element={this.page}></TitleElement>;
  }
  protected renderDescription(): React.JSX.Element | null {
    if (!this.page._showDescription) return null;
    var text = SurveyElementBase.renderLocString(this.page.locDescription);
    return (
      <div className={this.panelBase.cssClasses.page.description}>{text}</div>
    );
  }
}
