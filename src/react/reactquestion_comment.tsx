import * as React from "react";
import { ReactSurveyElement, SurveyQuestionUncontrolledElement } from "./reactquestion_element";
import { QuestionCommentModel } from "survey-core";
import { ReactQuestionFactory } from "./reactquestion_factory";
import { CharacterCounterComponent } from "./components/character-counter";

export class SurveyQuestionComment extends SurveyQuestionUncontrolledElement<QuestionCommentModel> {
  constructor(props: any) {
    super(props);
  }
  protected renderElement(): JSX.Element {
    var onBlur: ((e: any) => void) | undefined = !this.question.isInputTextUpdate ? this.updateValueOnEvent : undefined;
    var onInput = (event: any) => {
      if (this.question.isInputTextUpdate) {
        this.updateValueOnEvent(event);
      } else {
        this.question.updateElement();
      }

      const newValue = event.target.value;
      this.question.updateRemainingCharacterCounter(newValue);
    };
    const placeholder = this.question.renderedPlaceholder;
    if (this.question.isReadOnlyRenderDiv()) {
      return <div>{this.question.value}</div>;
    }
    const counter = !!this.question.getMaxLength() ? (<CharacterCounterComponent counter={this.question.characterCounter} remainingCharacterCounter={this.question.cssClasses.remainingCharacterCounter}></CharacterCounterComponent>) : null;
    return (
      <>
        <textarea
          id={this.question.inputId}
          className={this.question.className}
          disabled={this.question.isInputReadOnly}
          readOnly={this.question.isInputReadOnly}
          ref={(textarea) => (this.setControl(textarea))}
          maxLength={this.question.getMaxLength()}
          placeholder={placeholder}
          onBlur={onBlur}
          onInput={onInput}
          onKeyDown={(event) => { this.question.onKeyDown(event); }}
          cols={this.question.cols}
          rows={this.question.rows}
          aria-required={this.question.a11y_input_ariaRequired}
          aria-label={this.question.a11y_input_ariaLabel}
          aria-labelledby={this.question.a11y_input_ariaLabelledBy}
          aria-invalid={this.question.a11y_input_ariaInvalid}
          aria-describedby={this.question.a11y_input_ariaDescribedBy}
          style={{ resize: this.question.resizeStyle }}
        />
        {counter}
      </>
    );
  }
}

export class SurveyQuestionCommentItem extends ReactSurveyElement {
  protected canRender(): boolean {
    return !!this.props.question;
  }
  protected onCommentChange(event: any): void {
    this.props.question.onCommentChange(event);
  }
  protected onCommentInput(event: any): void {
    this.props.question.onCommentInput(event);
  }
  protected onCommentCompositionUpdate(event: any): void {
    this.props.question.onCompositionUpdateComment(event);
  }
  protected getComment(): string {
    return this.props.question.comment;
  }
  protected getId(): string {
    return this.props.question.commentId;
  }
  protected getPlaceholder(): string {
    return this.props.question.renderedCommentPlaceholder;
  }
  protected renderElement(): JSX.Element {
    let question = this.props.question;
    let className = this.props.otherCss || this.cssClasses.comment;
    let handleOnChange = (event: any) => {
      this.setState({ comment: event.target.value });
      this.onCommentChange(event);
    };
    const questionComment = this.getComment();
    let stateComment: string = !!this.state ? this.state.comment : undefined;
    if (stateComment !== undefined && stateComment.trim() !== questionComment) {
      stateComment = questionComment;
    }
    let comment = stateComment !== undefined ? stateComment : questionComment || "";

    if (question.isReadOnlyRenderDiv()) {
      return <div>{comment}</div>;
    }
    return (
      <textarea
        id={this.getId()}
        className={className}
        value={comment}
        disabled={this.isDisplayMode}
        maxLength={question.getOthersMaxLength()}
        placeholder={this.getPlaceholder()}
        onChange={handleOnChange}
        onBlur={(e) => { this.onCommentChange(e); handleOnChange(e); }}
        onInput={(e) => this.onCommentInput(e)}
        onCompositionUpdate={(e) => this.onCommentCompositionUpdate(e)}
        aria-required={question.isRequired || question.a11y_input_ariaRequired}
        aria-label={question.ariaLabel || question.a11y_input_ariaLabel}
        style={{ resize: question.resizeStyle }}
      />
    );
  }
}
export class SurveyQuestionOtherValueItem extends SurveyQuestionCommentItem {
  protected onCommentChange(event: any): void {
    this.props.question.onOtherValueChange(event);
  }
  protected onCommentInput(event: any): void {
    this.props.question.onOtherValueInput(event);
  }
  protected onCommentCompositionUpdate(event: any): void {
    this.props.question.onCompositionUpdateOtherValue(event);
  }
  protected getComment(): string {
    return this.props.question.otherValue;
  }
  protected getId(): string {
    return this.props.question.otherId;
  }
  protected getPlaceholder(): string {
    return this.props.question.otherPlaceholder;
  }
}

ReactQuestionFactory.Instance.registerQuestion("comment", (props) => {
  return React.createElement(SurveyQuestionComment, props);
});
