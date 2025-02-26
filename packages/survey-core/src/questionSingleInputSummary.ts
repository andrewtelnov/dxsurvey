import { Action } from "./actions/action";
import { LocalizableString } from "./localizablestring";
import { Question } from "./question";

export class QuestionSingleInputSummaryItem {
  constructor(public locText: LocalizableString, public btnEdit: Action, public btnRemove: Action) {
  }
  public get showRemove(): boolean { return !!this.btnRemove; }
}

export class QuestionSingleInputSummary {
  constructor(public question: Question, public noEntry: LocalizableString) {
  }
  public items: Array<QuestionSingleInputSummaryItem> = [];
  public isEmpty(): boolean {
    return this.items.length == 0;
  }
  public dispose(): void {
    this.items.forEach((item) => {
      item.btnEdit?.dispose();
      item.btnRemove?.dispose();
    });
  }
}