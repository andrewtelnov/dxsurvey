import * as React from "react";
import { QuestionSingleInputSummary, QuestionSingleInputSummaryItem } from "survey-core";
import { ReactSurveyElement } from "./reactquestion_element";
import { ReactElementFactory } from "./element-factory";

export class SurveyQuestionSigleInputSummary extends ReactSurveyElement {
  constructor(props: any) {
    super(props);
  }
  protected get summary(): QuestionSingleInputSummary {
    return this.props.summary as QuestionSingleInputSummary;
  }
  protected renderElement(): React.JSX.Element {
    if (!this.summary) return null;
    return this.summary.items.length > 0 ? this.renderItems() : this.renderNoItems();
  }
  private renderItems(): React.JSX.Element {
    return (
      <div>
        {this.summary.items.map((item, index) => this.renderItem(item, index))}
      </div>
    );
  }
  private renderNoItems(): React.JSX.Element {
    return <div>
      {this.renderLocString(this.summary.noEntry)}
      <button onClick={() => this.summary.bntAdd.action()}>{this.renderLocString(this.summary.bntAdd.locTitle)}</button>
    </div>;
  }
  private renderItem(item: QuestionSingleInputSummaryItem, index: number): React.JSX.Element {
    return <div key={index}>
      {this.renderLocString(item.locText)}
      <button onClick={() => item.btnEdit.action()}>{this.renderLocString(item.btnEdit.locTitle)}</button>
      <button onClick={() => item.btnRemove.action()}>{this.renderLocString(item.btnRemove.locTitle)}</button>
    </div>;
  }
}

ReactElementFactory.Instance.registerElement("sv-singleinput-summary", (props) => {
  return React.createElement(SurveyQuestionSigleInputSummary, props);
});
