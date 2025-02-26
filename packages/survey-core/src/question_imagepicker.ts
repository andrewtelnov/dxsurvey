import { property, Serializer } from "./jsonobject";
import { QuestionFactory } from "./questionfactory";
import { QuestionCheckboxBase, QuestionSelectBase } from "./question_baseselect";
import { ItemValue } from "./itemvalue";
import { Helpers } from "./helpers";
import { ILocalizableOwner, LocalizableString } from "./localizablestring";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { settings } from "./settings";
import { classesToSelector } from "./utils/utils";
import { DomDocumentHelper } from "./global_variables_utils";

export class ImageItemValue extends ItemValue implements ILocalizableOwner {

  @property({ defaultValue: false }) private videoNotLoaded: boolean;
  @property({ defaultValue: false }) private imageNotLoaded: boolean;

  constructor(
    value: any,
    text: string = null,
    protected typeName = "imageitemvalue"
  ) {
    super(value, text, typeName);
    this.createLocalizableString("imageLink", this, false);
  }
  public getType(): string {
    return !!this.typeName ? this.typeName : "itemvalue";
  }
  /**
   * The image or video link property.
   */
  public get imageLink(): string {
    return this.getLocalizableStringText("imageLink");
  }
  public set imageLink(val: string) {
    this.setLocalizableStringText("imageLink", val);
    this.imageNotLoaded = false;
    this.videoNotLoaded = false;
  }
  private aspectRatio: number;

  get locImageLink(): LocalizableString {
    return this.getLocalizableString("imageLink");
  }
  getLocale(): string {
    return !!this.locOwner ? this.locOwner.getLocale() : "";
  }
  getMarkdownHtml(text: string, name: string): string {
    return !!this.locOwner ? this.locOwner.getMarkdownHtml(text, name) : undefined;
  }
  getRenderer(name: string): string {
    return !!this.locOwner ? this.locOwner.getRenderer(name) : null;
  }
  getRendererContext(locStr: LocalizableString): any {
    return !!this.locOwner ? this.locOwner.getRendererContext(locStr) : locStr;
  }
  getProcessedText(text: string): string {
    return !!this.locOwner ? this.locOwner.getProcessedText(text) : text;
  }

  public onErrorHandler(): void {
    this.contentNotLoaded = true;
  }

  public set contentNotLoaded(val: boolean) {
    if (this.locOwner instanceof QuestionImagePickerModel && this.locOwner.contentMode == "video") {
      this.videoNotLoaded = val;
    } else {
      this.imageNotLoaded = val;
    }
  }
  public get contentNotLoaded(): boolean {
    return this.locOwner instanceof QuestionImagePickerModel && this.locOwner.contentMode == "video" ? this.videoNotLoaded : this.imageNotLoaded;
  }

}

/**
  * A class that describes the Image Picker question type.
 *
 * [View Demo](https://surveyjs.io/form-library/examples/image-picker-question/ (linkStyle))
 */
export class QuestionImagePickerModel extends QuestionCheckboxBase {
  constructor(name: string) {
    super(name);
    this.colCount = 0;
    this.registerPropertyChangedHandlers(["minImageWidth", "maxImageWidth", "minImageHeight", "maxImageHeight", "visibleChoices", "colCount", "isResponsiveValue"], () => {
      if (!!this._width) {
        this.processResponsiveness(0, this._width);
      }
    });
    this.registerPropertyChangedHandlers(["imageWidth", "imageHeight"], () => {
      this.calcIsResponsive();
    });
    this.calcIsResponsive();
  }
  public getType(): string {
    return "imagepicker";
  }
  supportAutoAdvance(): boolean {
    return !this.multiSelect;
  }
  public get hasSingleInput(): boolean {
    return false;
  }
  protected getItemValueType() {
    return "imageitemvalue";
  }
  public get isCompositeQuestion(): boolean {
    return true;
  }
  protected get itemFlowDirection() {
    return "row";
  }
  public supportOther(): boolean { return false; }
  public supportNone(): boolean { return false; }
  public supportRefuse(): boolean { return false; }
  public supportDontKnow(): boolean { return false; }
  public isAnswerCorrect(): boolean {
    if (!this.multiSelect) return super.isAnswerCorrect();
    return Helpers.isArrayContainsEqual(this.value, this.correctAnswer);
  }
  /**
   * Specifies whether users can select multiple images or videos.
   *
   * Default value: `false`
   */
  public get multiSelect(): boolean {
    return this.getPropertyValue("multiSelect");
  }
  public set multiSelect(newValue: boolean) {
    this.setPropertyValue("multiSelect", newValue);
  }
  public isItemSelected(item: ItemValue): boolean {
    var val = this.value;
    const imageItemValue = item as ImageItemValue;
    if (this.isValueEmpty(val)) return false;
    if (!imageItemValue.imageLink || imageItemValue.contentNotLoaded) return false;
    if (!this.multiSelect) return this.isTwoValueEquals(val, item.value);
    if (!Array.isArray(val)) return false;
    for (var i = 0; i < val.length; i++) {
      if (this.isTwoValueEquals(val[i], item.value)) return true;
    }
    return false;
  }
  public getItemEnabled(item: ItemValue): boolean {
    const imageItemValue = item as ImageItemValue;
    if (!imageItemValue.imageLink || imageItemValue.contentNotLoaded) return false;
    return super.getItemEnabled(item);
  }
  public clearIncorrectValues() {
    if (this.multiSelect) {
      var val = this.value;
      if (!val) return;
      if (!Array.isArray(val) || val.length == 0) {
        this.clearValue(true);
        return;
      }
      var newValue = [];
      for (var i = 0; i < val.length; i++) {
        if (!this.hasUnknownValue(val[i], true)) {
          newValue.push(val[i]);
        }
      }
      if (newValue.length == val.length) return;
      if (newValue.length == 0) {
        this.clearValue(true);
      } else {
        this.value = newValue;
      }
    } else {
      super.clearIncorrectValues();
    }
  }
  protected getDisplayValueCore(keysAsText: boolean, value: any): any {
    if (!this.multiSelect && !Array.isArray(value)) return super.getDisplayValueCore(keysAsText, value);
    return this.getDisplayArrayValue(keysAsText, value);
  }

  /**
   * Specifies whether to display labels under images or videos. Labels text are taken from the `text` property of each object in the `choices` array.
   * @see choices
   */
  public get showLabel(): boolean {
    return this.getPropertyValue("showLabel");
  }
  public set showLabel(newValue: boolean) {
    this.setPropertyValue("showLabel", newValue);
  }
  endLoadingFromJson() {
    super.endLoadingFromJson();
    if (!this.isDesignMode && this.multiSelect) {
      this.createNewArray("renderedValue");
      this.createNewArray("value");
    }
    this.calcIsResponsive();
  }
  protected getValueCore() {
    var value = super.getValueCore();
    if (value !== undefined) {
      return value;
    }
    if (this.multiSelect) {
      return [];
    }
    return value;
  }
  private convertValToArrayForMultSelect(val: any): any {
    if (!this.multiSelect) return val;
    if (this.isValueEmpty(val) || Array.isArray(val)) return val;
    return [val];
  }
  protected renderedValueFromDataCore(val: any): any {
    return this.convertValToArrayForMultSelect(val);
  }
  protected rendredValueToDataCore(val: any): any {
    return this.convertValToArrayForMultSelect(val);
  }
  /**
   * Specifies the height of containers for images or videos. Accepts positive numbers and CSS values.
   *
   * Default value: `auto`
   *
   * This property allows you to specify the exact image height. If you do not set it, the height will be calculated automatically based on the [`minImageHeight`](#minImageHeight) and [`maxImageHeight`](#maxImageHeight) values and available screen height.
   *
   * Use the [`imageFit`](#imageFit) property to specify how to fit the images or videos into their containers.
   * @see imageWidth
   */
  public get imageHeight() {
    return this.getPropertyValue("imageHeight");
  }
  public set imageHeight(val: number) {
    this.setPropertyValue("imageHeight", val);
  }
  public get imageScale() {
    return this.survey ? (this.survey as any)["widthScale"] / 100 : 1;
  }
  @property({}) private responsiveImageHeight: number;
  public get renderedImageHeight(): number {
    const height = this.isResponsive ? Math.floor(this.responsiveImageHeight) : this.imageHeight * this.imageScale;
    return (height ? height : 150 * this.imageScale);
  }
  /**
   * Specifies the width of containers for images or videos. Accepts positive numbers and CSS values.
   *
   * Default value: `auto`
   *
   * This property allows you to specify the exact image width. If you do not set it, the width will be calculated automatically based on the [`minImageWidth`](#minImageWidth) and [`maxImageWidth`](#maxImageWidth) values and available screen width.
   *
   * Use the [`imageFit`](#imageFit) property to specify how to fit the images or videos into their containers.
   * @see imageHeight
   */
  public get imageWidth() {
    return this.getPropertyValue("imageWidth");
  }
  public set imageWidth(val: number) {
    this.setPropertyValue("imageWidth", val);
  }

  @property({}) private responsiveImageWidth: number;
  public get renderedImageWidth(): number {
    const width = this.isResponsive ? Math.floor(this.responsiveImageWidth) : this.imageWidth * this.imageScale;
    return (width ? width : 200 * this.imageScale);
  }
  /**
   * Specifies how to resize images or videos to fit them into their containers.
   *
   * Refer to the [`object-fit`](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit) CSS property description for information on accepted values.
   * @see imageHeight
   * @see imageWidth
   */
  public get imageFit(): string {
    return this.getPropertyValue("imageFit");
  }
  public set imageFit(val: string) {
    this.setPropertyValue("imageFit", val);
  }
  /**
   * Specifies the type of content that choice items display.
   *
   * Possible values:
   *
   * - `"image"` (default) - Images in one of the following formats: JPEG, GIF, PNG, APNG, SVG, BMP, ICO.
   * - `"video"` - Videos in one of the following formats: MP4, MOV, WMV, FLV, AVI, MKV.
   */
  public get contentMode(): string {
    return this.getPropertyValue("contentMode");
  }
  public set contentMode(val: string) {
    this.setPropertyValue("contentMode", val);
    if (val === "video") {
      this.showLabel = true;
    }
  }
  protected convertDefaultValue(val: any): any {
    return val;
  }
  public get inputType() {
    return this.multiSelect ? "checkbox" : "radio";
  }

  protected isBuiltInChoice(item: ItemValue): boolean {
    return false;
  }
  protected addToVisibleChoices(items: Array<ItemValue>, isAddAll: boolean): void {
    this.addNewItemToVisibleChoices(items, isAddAll);
  }
  public getSelectBaseRootCss(): string {
    const isResponsive = this.isResponsive;
    return new CssClassBuilder()
      .append(super.getSelectBaseRootCss())
      .append("sd-imagepicker--responvive", isResponsive)
      .append("sd-imagepicker--static", !isResponsive)
      .append(this.cssClasses.rootColumn, this.getCurrentColCount() == 1)
      .toString();
  }

  //responsive mode
  @property({}) private isResponsiveValue = false;
  /**
   * Specifies a maximum width for image or video containers. Accepts positive numbers and CSS values.
   *
   * Default value: 3000
   *
   * The `minImageWidth`, `maxImageWidth`, `minImageHeight`, and `maxImageHeight` properties specify boundary values for container sizes. The resulting sizes are selected depending on the available screen space. If you want to specify the exact width and height, use the [`imageWidth`](#imageWidth) and [`imageHeight`](#imageHeight) properties.
   */
  @property({}) public maxImageWidth: number;
  /**
   * Specifies a minimum width for image or video containers. Accepts positive numbers and CSS values.
   *
   * Default value: 200
   *
   * The `minImageWidth`, `maxImageWidth`, `minImageHeight`, and `maxImageHeight` properties specify boundary values for container sizes. The resulting sizes are selected depending on the available screen space. If you want to specify the exact width and height, use the [`imageWidth`](#imageWidth) and [`imageHeight`](#imageHeight) properties.
   */
  @property({}) public minImageWidth: number;
  /**
   * Specifies a maximum height for image or video containers. Accepts positive numbers and CSS values.
   *
   * Default value: 3000
   *
   * The `minImageWidth`, `maxImageWidth`, `minImageHeight`, and `maxImageHeight` properties specify boundary values for container sizes. The resulting sizes are selected depending on the available screen space. If you want to specify the exact width and height, use the [`imageWidth`](#imageWidth) and [`imageHeight`](#imageHeight) properties.
   */
  @property({}) public maxImageHeight: number;
  /**
   * Specifies a minimum height for image or video containers. Accepts positive numbers and CSS values.
   *
   * Default value: 133
   *
   * The `minImageWidth`, `maxImageWidth`, `minImageHeight`, and `maxImageHeight` properties specify boundary values for container sizes. The resulting sizes are selected depending on the available screen space. If you want to specify the exact width and height, use the [`imageWidth`](#imageWidth) and [`imageHeight`](#imageHeight) properties.
   */
  @property({}) public minImageHeight: number;

  private get isResponsive() {
    return this.isResponsiveValue && this.isDefaultV2Theme;
  }
  private get exactSizesAreEmpty(): boolean {
    return !(["imageHeight", "imageWidth"].some(propName => this[propName] !== undefined && this[propName] !== null));
  }
  private calcIsResponsive() {
    this.isResponsiveValue = this.exactSizesAreEmpty;
  }

  protected getObservedElementSelector(): string {
    return classesToSelector(this.cssClasses.root);
  }
  protected supportResponsiveness(): boolean {
    return true;
  }
  protected needResponsiveness() {
    return this.supportResponsiveness() && this.isDefaultV2Theme;
  }
  public needResponsiveWidth() {
    return this.colCount > 2;
  }

  private _width: number;

  public onContentLoaded = (item: ImageItemValue, event: any) => {
    item.contentNotLoaded = false;
    const content: any = event.target;
    if (this.contentMode == "video") {
      item["aspectRatio"] = content.videoWidth / content.videoHeight;
    } else {
      item["aspectRatio"] = content.naturalWidth / content.naturalHeight;
    }
    this._width && this.processResponsiveness(0, this._width);
  }

  @property({}) private responsiveColCount: number;

  protected getCurrentColCount(): number {
    if (this.responsiveColCount === undefined || this.colCount === 0) {
      return this.colCount;
    }
    return this.responsiveColCount;
  }
  @property() gridColCount: number = undefined;
  getContainerStyle() {
    if(!this.isResponsive) return {};
    return {
      gridAutoFlow: !this.gridColCount ? "column" : null,
      gridTemplateColumns: this.gridColCount ? `repeat(${this.gridColCount}, 1fr)`: null
    };
  }

  protected processResponsiveness(_: number, availableWidth: number): boolean {
    this._width = availableWidth = Math.floor(availableWidth);
    const calcAvailableColumnsCount = (availableWidth: number, minWidth: number, gap: number): number => {
      let itemsInRow = Math.floor(availableWidth / (minWidth + gap));
      if ((itemsInRow + 1) * (minWidth + gap) - gap <= availableWidth) itemsInRow++;
      return itemsInRow;
    };
    if (this.isResponsive) {
      const itemsCount = this.choices.length + (this.isDesignMode ? 1 : 0);
      const gap = (this.gapBetweenItems || 0) * this.imageScale;
      const minWidth = this.minImageWidth * this.imageScale;
      const maxWidth = this.maxImageWidth * this.imageScale;
      const maxHeight = this.maxImageHeight * this.imageScale;
      const minHeight = this.minImageHeight * this.imageScale;
      let colCount = this.colCount;
      let width: number;
      const availableColumnsCount: number = calcAvailableColumnsCount(availableWidth, minWidth, gap);
      if (colCount === 0) {
        if ((gap + minWidth) * itemsCount - gap > availableWidth) {
          width = Math.floor((availableWidth - gap * (availableColumnsCount - 1)) / availableColumnsCount);
        } else {
          width = Math.floor(((availableWidth - gap * (itemsCount - 1)) / itemsCount));
        }
        this.gridColCount = Math.max(Math.min(itemsCount, availableColumnsCount), 1);

      } else {
        if (availableColumnsCount < colCount) {
          this.responsiveColCount = Math.max(availableColumnsCount, 1);
          colCount = this.responsiveColCount;
        } else {
          this.responsiveColCount = colCount;
        }
        this.gridColCount = this.responsiveColCount;
        width = Math.floor((availableWidth - gap * (colCount - 1)) / colCount);
      }
      width = Math.max(minWidth, Math.min(width, maxWidth));
      let height: number = Number.MIN_VALUE;
      this.choices.forEach((item: ImageItemValue) => {
        const tempHeight = width / item["aspectRatio"];
        height = tempHeight > height ? tempHeight : height;
      });
      if (height > maxHeight) {
        height = maxHeight;
      } else if (height < minHeight) {
        height = minHeight;
      }
      const oldResponsiveImageWidth = this.responsiveImageWidth;
      const oldResponsiveImageHeight = this.responsiveImageHeight;
      this.responsiveImageWidth = width;
      this.responsiveImageHeight = height;
      return oldResponsiveImageWidth !== this.responsiveImageWidth || oldResponsiveImageHeight !== this.responsiveImageHeight;
    }
    return false;
  }

  public triggerResponsiveness(hard: boolean = true): void {
    if (hard && this.reCalcGapBetweenItemsCallback) {
      this.reCalcGapBetweenItemsCallback();
    }
    super.triggerResponsiveness(hard);
  }

  private gapBetweenItems: number;
  private reCalcGapBetweenItemsCallback: () => void;
  public afterRender(el: HTMLElement): void {
    super.afterRender(el);
    const selector = this.getObservedElementSelector();
    const observedElement = el && selector ? el.querySelector(selector) : undefined;
    if (!!observedElement) {
      this.reCalcGapBetweenItemsCallback = () => {
        this.gapBetweenItems = Math.ceil(Number.parseFloat(DomDocumentHelper.getComputedStyle(observedElement).gap)) || 16;
      };
      this.reCalcGapBetweenItemsCallback();
    }
  }
}
Serializer.addClass(
  "imageitemvalue",
  [{ name: "imageLink:file", serializationProperty: "locImageLink" }],
  (value: any) => new ImageItemValue(value),
  "itemvalue"
);
Serializer.addClass(
  "responsiveImageSize",
  [],
  undefined,
  "number"
);
Serializer.addClass(
  "imagepicker",
  [
    { name: "showOtherItem", visible: false },
    { name: "otherText", visible: false },
    { name: "showNoneItem", visible: false },
    { name: "showRefuseItem", visible: false },
    { name: "showDontKnowItem", visible: false },
    { name: "noneText", visible: false },
    { name: "optionsCaption", visible: false },
    { name: "otherErrorText", visible: false },
    { name: "storeOthersAsComment", visible: false },
    {
      name: "contentMode",
      default: "image",
      choices: ["image", "video"],
    },
    {
      name: "imageFit",
      default: "contain",
      choices: ["none", "contain", "cover", "fill"],
    },
    { name: "imageHeight:number", minValue: 0 },
    { name: "imageWidth:number", minValue: 0 },
    { name: "minImageWidth:responsiveImageSize", default: 200, minValue: 0 },
    { name: "minImageHeight:responsiveImageSize", default: 133, minValue: 0 },
    { name: "maxImageWidth:responsiveImageSize", default: 3000, minValue: 0 },
    { name: "maxImageHeight:responsiveImageSize", default: 3000, minValue: 0 },

  ],
  function () {
    return new QuestionImagePickerModel("");
  },
  "checkboxbase"
);
Serializer.addProperty("imagepicker", {
  name: "showLabel:boolean",
  default: false,
});
Serializer.addProperty("imagepicker", {
  name: "colCount:number",
  default: 0,
  choices: [0, 1, 2, 3, 4, 5],
});
Serializer.addProperty("imagepicker", {
  name: "multiSelect:boolean",
  default: false,
});
Serializer.addProperty("imagepicker", {
  name: "choices:imageitemvalue[]",
});

QuestionFactory.Instance.registerQuestion("imagepicker", (name) => {
  var q = new QuestionImagePickerModel(name);
  //q.choices = QuestionFactory.DefaultChoices;
  return q;
});
