import * as React from "react";
import { ReactSurveyElement, SurveyElementBase, SurveyQuestionElementBase } from "./reactquestion_element";
import { QuestionImagePickerModel, ImageItemValue, SurveyModel, ItemValue } from "survey-core";
import { ReactQuestionFactory } from "./reactquestion_factory";
import { ReactSurveyElementsWrapper } from "./reactsurveymodel";
import { SvgIcon } from "./components/svg-icon/svg-icon";

export class SurveyQuestionImagePicker extends SurveyQuestionElementBase {
  constructor(props: any) {
    super(props);
  }
  protected get question(): QuestionImagePickerModel {
    return this.questionBase as QuestionImagePickerModel;
  }
  protected renderElement(): React.JSX.Element {
    var cssClasses = this.question.cssClasses;
    return (
      <fieldset className={this.question.getSelectBaseRootCss()} style={this.question.getContainerStyle()}>
        <legend className="sv-hidden">{this.question.locTitle.renderedHtml}</legend>
        {this.question.hasColumns ? this.getColumns(cssClasses) : this.getItems(cssClasses)}
      </fieldset>
    );
  }

  protected getColumns(cssClasses: any) {
    return this.question.columns.map((column: Array<ItemValue>, ci: number) => {
      var items = column.map((item: any, ii: number) =>
        this.renderItem(
          "item" + ii,
          item,
          cssClasses
        )
      );
      return (
        <div key={"column" + ci + this.question.getItemsColumnKey(column)} className={this.question.getColumnClass()} role="presentation">
          {items}
        </div>
      );
    });
  }

  protected getItems(cssClasses: any): Array<any> {
    var items: Array<React.JSX.Element> = [];
    for (var i = 0; i < this.question.visibleChoices.length; i++) {
      var item = this.question.visibleChoices[i];
      var key = "item" + i;
      items.push(this.renderItem(key, item as ImageItemValue, cssClasses));
    }
    return items;
  }
  protected get textStyle(): any {
    return { marginLeft: "3px", display: "inline", position: "static" };
  }
  protected renderItem(
    key: string,
    item: ImageItemValue,
    cssClasses: any
  ): React.JSX.Element {
    const renderedItem = <SurveyQuestionImagePickerItem key={key} question={this.question} item={item} cssClasses={cssClasses}></SurveyQuestionImagePickerItem>;
    const survey = this.question.survey as SurveyModel;
    let wrappedItem: React.JSX.Element | null = null;
    if (!!survey) {
      wrappedItem = ReactSurveyElementsWrapper.wrapItemValue(survey, renderedItem, this.question, item);
    }
    return wrappedItem ?? renderedItem;
  }
}
export class SurveyQuestionImagePickerItem extends ReactSurveyElement {
  constructor(props: any) {
    super(props);
    this.handleOnChange = this.handleOnChange.bind(this);
  }
  protected getStateElement() {
    return this.item;
  }
  componentDidMount() {
    super.componentDidMount();
    this.reactOnStrChanged();
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    this.item.locImageLink.onChanged = function () { };
  }
  componentDidUpdate(prevProps: any, prevState: any) {
    super.componentDidUpdate(prevProps, prevState);
    this.reactOnStrChanged();
  }
  private reactOnStrChanged() {
    this.item.locImageLink.onChanged = () => {
      this.setState({ locImageLinkchanged: !!this.state && this.state.locImageLink ? this.state.locImageLink + 1 : 1 });
    };
  }
  protected get cssClasses() {
    return this.props.cssClasses;
  }

  protected get item() {
    return this.props.item;
  }

  protected get question() {
    return this.props.question;
  }

  handleOnChange(event: any) {
    if (this.question.isReadOnlyAttr) return;
    if (this.question.multiSelect) {
      if (event.target.checked) {
        this.question.value = this.question.value.concat(event.target.value);
      } else {
        var currValue = this.question.value;
        currValue.splice(this.question.value.indexOf(event.target.value), 1);
        this.question.value = currValue;
      }
    } else {
      this.question.value = event.target.value;
    }
    this.setState({ value: this.question.value });
  }

  protected renderElement(): React.JSX.Element {
    const item = this.item;
    const question = this.question;
    const cssClasses = this.cssClasses;
    var isChecked = question.isItemSelected(item);
    var itemClass = question.getItemClass(item);
    var text: React.JSX.Element | null = null;
    if (question.showLabel) {
      text = (
        <span
          className={question.cssClasses.itemText}
        >
          {item.text ? SurveyElementBase.renderLocString(item.locText) : item.value}
        </span>
      );
    }

    var style: any = { objectFit: this.question.imageFit };

    var control: React.JSX.Element | null = null;
    if (item.locImageLink.renderedHtml && this.question.contentMode === "image") {
      control = (
        <img
          className={cssClasses.image}
          src={item.locImageLink.renderedHtml}
          width={this.question.renderedImageWidth}
          height={this.question.renderedImageHeight}
          alt={item.locText.renderedHtml}
          style={style}
          onLoad={(event: any) => { this.question["onContentLoaded"](item, event.nativeEvent); }}
          onError={(event: any) => { item.onErrorHandler(item, event.nativeEvent); }}
        />
      );
    }
    if (item.locImageLink.renderedHtml && this.question.contentMode === "video") {
      control = (
        <video controls
          className={cssClasses.image}
          src={item.locImageLink.renderedHtml}
          width={this.question.renderedImageWidth}
          height={this.question.renderedImageHeight}
          style={style}
          onLoadedMetadata={(event: any) => { this.question["onContentLoaded"](item, event.nativeEvent); }}
          onError={(event: any) => { item.onErrorHandler(item, event.nativeEvent); }}
        ></video>
      );
    }
    if (!item.locImageLink.renderedHtml || item.contentNotLoaded) {
      let style: any = {
        width: this.question.renderedImageWidth,
        height: this.question.renderedImageHeight,
        objectFit: this.question.imageFit
      };
      control = (
        <div
          className={cssClasses.itemNoImage}
          style={style}
        >
          {
            cssClasses.itemNoImageSvgIcon ?
              <SvgIcon
                className={cssClasses.itemNoImageSvgIcon}
                iconName={this.question.cssClasses.itemNoImageSvgIconId}
                size={48}
              ></SvgIcon> :
              null
          }
        </div>
      );
    }

    const renderedItem = (
      <div className={itemClass}>
        <label className={cssClasses.label}>
          <input
            className={cssClasses.itemControl}
            id={this.question.getItemId(item)}
            type={this.question.inputType}
            name={this.question.questionName}
            checked={isChecked}
            value={item.value}
            disabled={!this.question.getItemEnabled(item)}
            readOnly={this.question.isReadOnlyAttr}
            onChange={this.handleOnChange}
            aria-required={this.question.ariaRequired}
            aria-label={item.locText.renderedHtml}
            aria-invalid={this.question.ariaInvalid}
            aria-errormessage={this.question.ariaErrormessage}
          />
          <div className={this.question.cssClasses.itemDecorator}>
            <div className={this.question.cssClasses.imageContainer}>
              {!!this.question.cssClasses.checkedItemDecorator ?
                <span className={this.question.cssClasses.checkedItemDecorator} aria-hidden="true">
                  {!!this.question.cssClasses.checkedItemSvgIconId ? <SvgIcon size={"auto"} className={this.question.cssClasses.checkedItemSvgIcon} iconName={this.question.cssClasses.checkedItemSvgIconId}></SvgIcon> : null}
                </span> : null}
              {control}
            </div>
            {text}
          </div>
        </label>
      </div>
    );
    return renderedItem;
  }
}

ReactQuestionFactory.Instance.registerQuestion("imagepicker", (props) => {
  return React.createElement(SurveyQuestionImagePicker, props);
});
