import { Base } from "./base";
import { HorizontalAlignment, VerticalAlignment } from "./base-interfaces";
import { Serializer, property } from "./jsonobject";
import { SurveyModel } from "./survey";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { wrapUrlForBackgroundImage } from "./utils/utils";

export class CoverCell {
  static CLASSNAME = "sv-cover__cell";
  private calcRow(positionY: VerticalAlignment): any {
    return positionY === "top" ? 1 : (positionY === "middle" ? 2 : 3);
  }
  private calcColumn(positionX: HorizontalAlignment): any {
    return positionX === "left" ? 1 : (positionX === "center" ? 2 : 3);
  }
  private calcAlignItems(positionX: HorizontalAlignment) {
    return positionX === "left" ? "flex-start" : (positionX === "center" ? "center" : "flex-end");
  }
  private calcAlignText(positionX: HorizontalAlignment) {
    return positionX === "left" ? "start" : (positionX === "center" ? "center" : "end");
  }
  private calcJustifyContent(positionY: VerticalAlignment) {
    return positionY === "top" ? "flex-start" : (positionY === "middle" ? "center" : "flex-end");
  }

  constructor(private cover: Cover, private positionX: HorizontalAlignment, private positionY: VerticalAlignment) {
  }
  get survey(): SurveyModel {
    return this.cover.survey;
  }
  get css(): string {
    const result = `${CoverCell.CLASSNAME} ${CoverCell.CLASSNAME}--${this.positionX} ${CoverCell.CLASSNAME}--${this.positionY}`;
    return result;
  }
  get style(): any {
    const result: any = {};
    result["gridColumn"] = this.calcColumn(this.positionX);
    result["gridRow"] = this.calcRow(this.positionY);
    return result;
  }
  get contentStyle(): any {
    const result: any = {};
    result["textAlign"] = this.calcAlignText(this.positionX);
    result["alignItems"] = this.calcAlignItems(this.positionX);
    result["justifyContent"] = this.calcJustifyContent(this.positionY);
    return result;
  }
  get showLogo(): boolean {
    return this.survey.hasLogo && this.positionX === this.cover.logoPositionX && this.positionY === this.cover.logoPositionY;
  }
  get showTitle(): boolean {
    return this.survey.hasTitle && this.positionX === this.cover.titlePositionX && this.positionY === this.cover.titlePositionY;
  }
  get showDescription(): boolean {
    return this.survey.renderedHasDescription && this.positionX === this.cover.descriptionPositionX && this.positionY === this.cover.descriptionPositionY;
  }
  get textWidth(): string {
    if (!this.cover.textWidth) {
      return "";
    }
    return "" + this.cover.textWidth + "px";
  }
}

export class Cover extends Base {
  private calcBackgroundSize(backgroundImageFit: "cover" | "fill" | "contain" | "tile"): string {
    if (backgroundImageFit === "fill") {
      return "100% 100%";
    }
    if (backgroundImageFit === "tile") {
      return "contain";
    }
    return backgroundImageFit;
  }

  constructor() {
    super();
    this.renderBackgroundImage = wrapUrlForBackgroundImage(this.backgroundImage);
    ["top", "middle", "bottom"].forEach((positionY: VerticalAlignment) =>
      ["left", "center", "right"].forEach((positionX: HorizontalAlignment) => this.cells.push(new CoverCell(this, positionX, positionY)))
    );
  }

  public getType(): string {
    return "cover";
  }
  public survey: SurveyModel;
  public cells: CoverCell[] = [];
  @property() public height: number;
  @property() public areaWidth: "survey" | "container";
  @property() public textWidth: number;
  @property() public invertText: boolean;
  @property() public glowText: boolean;
  @property() public overlap: boolean;
  @property() public backgroundColor: string;
  @property({
    onSet: (newVal: string, target: Cover) => {
      target.renderBackgroundImage = wrapUrlForBackgroundImage(newVal);
    }
  }) public backgroundImage: string;
  @property() public renderBackgroundImage: string;
  @property() public backgroundImageFit: "cover" | "fill" | "contain" | "tile";
  @property() public backgroundImageOpacity: number;
  @property() public logoPositionX: HorizontalAlignment;
  @property() public logoPositionY: VerticalAlignment;
  @property() public titlePositionX: HorizontalAlignment;
  @property() public titlePositionY: VerticalAlignment;
  @property() public descriptionPositionX: HorizontalAlignment;
  @property() public descriptionPositionY: VerticalAlignment;
  @property() logoStyle: { gridColumn: number, gridRow: number };
  @property() titleStyle: { gridColumn: number, gridRow: number };
  @property() descriptionStyle: { gridColumn: number, gridRow: number };

  public get renderedHeight(): string {
    return this.height ? this.height + "px" : undefined;
  }
  public get renderedTextWidth(): string {
    return this.textWidth ? this.textWidth + "px" : undefined;
  }

  public get coverClasses(): string {
    return new CssClassBuilder()
      .append("sv-cover")
      .append("sv-conver__without-background", !this.backgroundColor && !this.backgroundImage)
      .toString();
  }
  public get contentClasses(): string {
    return new CssClassBuilder()
      .append("sv-conver__content")
      .append("sv-conver__content--static", this.areaWidth === "survey" && this.survey.calculateWidthMode() === "static")
      .append("sv-conver__content--responsive", this.areaWidth === "container" || this.survey.calculateWidthMode() === "responsive")
      .toString();
  }

  public get backgroundImageClasses(): string {
    return new CssClassBuilder()
      .append("sv-cover__background-image")
      .append("sv-cover__background-image--contain", this.backgroundImageFit === "contain")
      .append("sv-cover__background-image--tile", this.backgroundImageFit === "tile")
      .toString();
  }
  public get backgroundImageStyle() {
    if (!this.backgroundImage) return null;
    return {
      opacity: this.backgroundImageOpacity,
      backgroundImage: this.renderBackgroundImage,
      backgroundSize: this.calcBackgroundSize(this.backgroundImageFit),
    };
  }
}

Serializer.addClass(
  "cover",
  [
    { name: "height:number", minValue: 0, default: 256 },
    { name: "areaWidth", default: "survey" },
    { name: "textWidth:number", minValue: 0, default: 512 },
    { name: "invertText:boolean" },
    { name: "glowText:boolean" },
    { name: "overlap:boolean" },
    { name: "backgroundColor" },
    { name: "backgroundImage" },
    { name: "backgroundImageOpacity:number", minValue: 0, maxValue: 1, default: 1 },
    { name: "backgroundImageFit", default: "cover", choices: ["cover", "fill", "contain"] },
    { name: "logoPositionX", default: "right" },
    { name: "logoPositionY", default: "top" },
    { name: "titlePositionX", default: "left" },
    { name: "titlePositionY", default: "bottom" },
    { name: "descriptionPositionX", default: "left" },
    { name: "descriptionPositionY", default: "bottom" }

  ],
  function () {
    return new Cover();
  },
);