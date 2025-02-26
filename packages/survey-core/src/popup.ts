import { Base, EventBase } from "./base";
import { IAction } from "./actions/action";
import { property } from "./jsonobject";
import { VerticalPosition, HorizontalPosition, PositionMode } from "./utils/popup";
import { calculateIsTablet, IsTouch } from "./utils/devices";

type DisplayPopupMode = "modal-popup" | "modal-overlay" | "menu-overlay" | "menu-popup-overlay" | "menu-popup";
export interface IPopupOptionsBase {
  onHide?: () => void;
  onShow?: () => void;
  onCancel?: () => void;
  onDispose?: () => void;
  getTargetCallback?: (container: HTMLElement) => HTMLElement;
  getAreaCallback?: (container: HTMLElement) => HTMLElement;
  cssClass?: string;
  title?: string;
  verticalPosition?: VerticalPosition;
  horizontalPosition?: HorizontalPosition;
  showPointer?: boolean;
  isModal?: boolean;
  canShrink?: boolean;
  displayMode?: "popup" | "overlay";
}
export interface IDialogOptions extends IPopupOptionsBase {
  componentName: string;
  data: any;
  onApply: () => boolean;
  isFocusedContent?: boolean;
}

export class PopupModel<T = any> extends Base implements IPopupOptionsBase {
  public setWidthByTarget: boolean;
  public focusFirstInputSelector = "";
  public locale: string;
  public onCancel: () => void = () => { };
  public onApply: () => boolean = () => { return true; };
  public onHide: () => void = () => { };
  public onShow: () => void = () => { };
  public onDispose: () => void = () => { };
  public getTargetCallback?: (container: HTMLElement) => HTMLElement;
  public getAreaCallback?: (container: HTMLElement) => HTMLElement;

  @property() contentComponentName: string;
  @property() contentComponentData: T;
  @property({ defaultValue: "bottom" }) verticalPosition: VerticalPosition;
  @property({ defaultValue: "left" }) horizontalPosition: HorizontalPosition;
  @property({ defaultValue: true }) showPointer: boolean;
  @property({ defaultValue: false }) isModal: boolean;
  @property({ defaultValue: true }) canShrink: boolean;
  @property({ defaultValue: true }) isFocusedContent: boolean;
  @property({ defaultValue: true }) isFocusedContainer: boolean;
  @property({ defaultValue: "" }) cssClass: string;
  @property({ defaultValue: "" }) title: string;
  @property({ defaultValue: "auto" }) overlayDisplayMode: "auto" | "tablet-dropdown-overlay" | "dropdown-overlay" | "plain";
  @property({ defaultValue: "popup" }) displayMode: "popup" | "overlay";
  @property({ defaultValue: "flex" }) positionMode: PositionMode;

  public onVisibilityChanged: EventBase<PopupModel> = this.addEvent<PopupModel>();
  public onFooterActionsCreated: EventBase<Base> = this.addEvent<Base>();
  public onRecalculatePosition: EventBase<Base> = this.addEvent<Base>();

  private refreshInnerModel(): void {
    const innerModel = (this.contentComponentData as any)["model"];
    innerModel && innerModel.refresh && innerModel.refresh();
  }

  constructor(
    contentComponentName: string,
    contentComponentData: T,
    options?: IPopupOptionsBase
  ) {
    super();
    this.contentComponentName = contentComponentName;
    this.contentComponentData = contentComponentData;
    if (!!options) {
      for (var key in options) {
        (<any>this)[key] = (<any>options)[key];
      }
    }
  }
  public get isVisible(): boolean {
    return this.getPropertyValue("isVisible", false);
  }
  public set isVisible(value: boolean) {
    if (this.isVisible === value) {
      return;
    }
    this.setPropertyValue("isVisible", value);
    this.onVisibilityChanged.fire(this, { model: this, isVisible: value });
  }
  public toggleVisibility(): void {
    this.isVisible = !this.isVisible;
  }
  public show(): void {
    if (!this.isVisible)
      this.isVisible = true;
  }
  public hide(): void {
    if (this.isVisible)
      this.isVisible = false;
  }
  public recalculatePosition(isResetHeight: boolean): void {
    this.onRecalculatePosition.fire(this, { isResetHeight: isResetHeight });
  }
  public updateFooterActions(footerActions: Array<IAction>): Array<IAction> {
    const options = { actions: footerActions };
    this.onFooterActionsCreated.fire(this, options);
    return options.actions;
  }

  public getDisplayMode(): DisplayPopupMode {
    if (this.isModal) {
      return this.displayMode === "popup" ? "modal-popup" : "modal-overlay";
    } else {
      if (this.displayMode === "popup") {
        return "menu-popup";
      } else {
        let result: DisplayPopupMode;
        switch (this.overlayDisplayMode) {
          case "plain": {
            result = "menu-popup";
            break;
          }
          case "dropdown-overlay": {
            result = "menu-overlay";
            break;
          }
          case "tablet-dropdown-overlay": {
            result = "menu-popup-overlay";
            break;
          }
          case "auto": {
            if (!IsTouch) {
              result = "menu-popup"; // desktop
            } else if (calculateIsTablet()) {
              result = "menu-popup-overlay"; //tablet
            } else {
              result = "menu-overlay"; // phone
            }
            break;
          }
        }
        return result;
      }
    }
  }

  public updateDisplayMode(menuType: "dropdown" | "popup" | "overlay"): void {
    if(this.displayMode !== menuType) {
      this.setWidthByTarget = menuType === "dropdown";
    }
    switch (menuType) {
      case "dropdown": {
        this.displayMode = "popup";
        break;
      }
      case "popup": {
        this.displayMode = "overlay";
        this.overlayDisplayMode = "tablet-dropdown-overlay";
        break;
      }
      case "overlay": {
        this.displayMode = "overlay";
        this.overlayDisplayMode = "dropdown-overlay";
        break;
      }
    }
  }
  public onHiding(): void {
    this.refreshInnerModel();
    this.onHide();
  }
  public dispose(): void {
    super.dispose();
    this.onDispose();
  }
}
