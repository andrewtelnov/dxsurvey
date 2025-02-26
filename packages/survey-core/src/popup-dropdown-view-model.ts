import { property } from "./jsonobject";
import { PopupUtils, IPosition, Rect } from "./utils/popup";
import { CssClassBuilder } from "./utils/cssClassBuilder";
import { PopupModel } from "./popup";
import { PopupBaseViewModel } from "./popup-view-model";
import { IsTouch } from "./utils/devices";
import { settings } from "./settings";
import { SurveyModel } from "./survey";
import { DomDocumentHelper, DomWindowHelper } from "./global_variables_utils";
import { IAction } from "./actions/action";

export class PopupDropdownViewModel extends PopupBaseViewModel {
  static readonly tabletSizeBreakpoint = 600;
  private scrollEventCallBack = (event: any) => {
    if (this.isOverlay && IsTouch) {
      event.stopPropagation();
      event.preventDefault();
      return;
    }
    this.hidePopup();
  }
  private resizeEventCallback = () => {
    if(!DomWindowHelper.isAvailable()) return;

    const visualViewport = DomWindowHelper.getVisualViewport();
    const documentElement = DomDocumentHelper.getDocumentElement();
    if(!!documentElement && !!visualViewport) {
      documentElement.style.setProperty("--sv-popup-overlay-height", `${visualViewport.height * visualViewport.scale}px`);
    }
  }
  private resizeWindowCallback = () => {
    if(!this.isOverlay) {
      this.updatePosition(true, SurveyModel.platform === "vue" || SurveyModel.platform === "vue3" || SurveyModel.platform == "react" || SurveyModel.platform == "js-ui");
    }
  };
  private clientY: number = 0;

  private touchStartEventCallback = (event: any) => {
    this.clientY = event.touches[0].clientY;
  }
  private touchMoveEventCallback = (event: any) => {
    this.preventScrollOuside(event, this.clientY - event.changedTouches[0].clientY);
  }

  protected createFooterActionBar(): void {
    super.createFooterActionBar();

    this.footerToolbar.updateCallback = (isResetInitialized: boolean) => {
      this.footerToolbarValue.actions.forEach(action => action.cssClasses = {
        item: "sd-action sv-menu-popup__button"
      });
    };

    this.footerToolbar.containerCss = "sv-footer-action-bar";
    let footerActions = [
      <IAction>{
        id: "cancel",
        visibleIndex: 10,
        title: this.cancelButtonText,
        innerCss: "sv-popup__button--cancel",
        action: () => { this.cancel(); }
      }
    ];

    footerActions = this.model.updateFooterActions(footerActions);
    this.footerToolbarValue.setItems(footerActions);
  }

  protected getAvailableAreaRect(): Rect {
    const areaElement: HTMLElement = this.model.getAreaCallback ? this.model.getAreaCallback(this.container) : undefined;
    if (areaElement) {
      const areaRect = areaElement.getBoundingClientRect();
      return new Rect(areaRect.x, areaRect.y, areaRect.width, areaRect.height);
    }
    return new Rect(0, 0, DomWindowHelper.getInnerWidth(), DomWindowHelper.getInnerHeight());
  }
  protected getTargetElementRect(): Rect {
    const componentRoot = this.container;
    let targetElement: HTMLElement = this.model.getTargetCallback ? this.model.getTargetCallback(componentRoot) : undefined;

    if (!!componentRoot && !!componentRoot.parentElement && !this.isModal && !targetElement) {
      targetElement = componentRoot.parentElement;
    }
    if (!targetElement) return null;
    const rect = targetElement.getBoundingClientRect();
    const areaRect = this.getAvailableAreaRect();
    return new Rect(rect.left - areaRect.left, rect.top - areaRect.top, rect.width, rect.height);
  }

  private _updatePosition() {
    const targetElementRect = this.getTargetElementRect();
    if (!targetElementRect) return;
    const area = this.getAvailableAreaRect();
    const popupContainer = <HTMLElement>this.container?.querySelector(this.containerSelector);
    if (!popupContainer) return;
    const fixedPopupContainer = <HTMLElement>this.container?.querySelector(this.fixedPopupContainer) as HTMLElement;
    const scrollContent = <HTMLElement>popupContainer.querySelector(this.scrollingContentSelector);
    const popupComputedStyle = DomDocumentHelper.getComputedStyle(popupContainer);
    const marginLeft = (parseFloat(popupComputedStyle.marginLeft) || 0);
    const marginRight = (parseFloat(popupComputedStyle.marginRight) || 0);
    const marginTop = (parseFloat(popupComputedStyle.marginTop) || 0);
    const marginBottom = (parseFloat(popupComputedStyle.marginBottom) || 0);
    let height = popupContainer.offsetHeight - scrollContent.offsetHeight + scrollContent.scrollHeight;
    const width = popupContainer.getBoundingClientRect().width;
    this.model.setWidthByTarget && (this.minWidth = targetElementRect.width + "px");
    let verticalPosition = this.model.verticalPosition;

    let actualHorizontalPosition = this.getActualHorizontalPosition();

    if (DomWindowHelper.isAvailable()) {
      const heightValues = [height, DomWindowHelper.getInnerHeight() * 0.9, DomWindowHelper.getVisualViewport()?.height];
      height = Math.ceil(Math.min(...heightValues.filter((each) => typeof each === "number")));
      verticalPosition = PopupUtils.updateVerticalPosition(
        targetElementRect,
        height,
        this.model.horizontalPosition,
        this.model.verticalPosition,
        area.height
      );

      actualHorizontalPosition = PopupUtils.updateHorizontalPosition(
        targetElementRect,
        width,
        actualHorizontalPosition,
        area.width
      );
    }
    this.popupDirection = PopupUtils.calculatePopupDirection(
      verticalPosition,
      actualHorizontalPosition
    );
    const pos = PopupUtils.calculatePosition(
      targetElementRect,
      height,
      width + marginLeft + marginRight,
      verticalPosition,
      actualHorizontalPosition,
      this.model.positionMode
    );

    if (DomWindowHelper.isAvailable()) {
      const newVerticalDimensions = PopupUtils.getCorrectedVerticalDimensions(
        pos.top,
        height,
        area.height,
        verticalPosition,
        this.model.canShrink,
        { top: marginTop, bottom: marginBottom }
      );
      if (!!newVerticalDimensions) {
        this.height = newVerticalDimensions.height + "px";
        pos.top = newVerticalDimensions.top;
      }

      if (this.model.setWidthByTarget) {
        this.width = targetElementRect.width + "px";
        pos.left = targetElementRect.left;
      } else {
        const newHorizontalDimensions = PopupUtils.updateHorizontalDimensions(
          pos.left,
          width,
          DomWindowHelper.getInnerWidth(),
          actualHorizontalPosition,
          this.model.positionMode,
          { left: marginLeft, right: marginRight }
        );
        if (!!newHorizontalDimensions) {
          this.width = newHorizontalDimensions.width ? newHorizontalDimensions.width + "px" : undefined;
          pos.left = newHorizontalDimensions.left;
        }
      }
    }
    if (!!fixedPopupContainer) {
      const rect = fixedPopupContainer.getBoundingClientRect();
      pos.top -= rect.top;
      pos.left -= rect.left;
    }

    pos.left += area.left;
    pos.top += area.top;

    this.left = pos.left + "px";
    this.top = pos.top + "px";

    if (this.showHeader) {
      this.pointerTarget = PopupUtils.calculatePointerTarget(
        targetElementRect,
        pos.top,
        pos.left,
        verticalPosition,
        actualHorizontalPosition,
        marginLeft,
        marginRight
      );
      this.pointerTarget.top += "px";
      this.pointerTarget.left += "px";
    }
  }

  protected getActualHorizontalPosition(): "left" | "center" | "right" {
    let actualHorizontalPosition = this.model.horizontalPosition;
    if (DomDocumentHelper.isAvailable()) {
      let isRtl = DomDocumentHelper.getComputedStyle(DomDocumentHelper.getBody()).direction == "rtl";
      if (isRtl) {
        if (this.model.horizontalPosition === "left") {
          actualHorizontalPosition = "right";
        } else if (this.model.horizontalPosition === "right") {
          actualHorizontalPosition = "left";
        }
      }
    }
    return actualHorizontalPosition;
  }
  protected getStyleClass(): CssClassBuilder {
    // const overlayMode = this.model.overlayDisplayMode;
    const displayMode = this.model.getDisplayMode();
    return super.getStyleClass()
      .append("sv-popup--menu")
      .append("sv-popup--menu-overlay", displayMode === "menu-overlay" || displayMode === "menu-popup-overlay")
      .append("sv-popup--menu-phone", displayMode === "menu-overlay")
      .append("sv-popup--menu-tablet", displayMode === "menu-popup-overlay")
      .append("sv-popup--dropdown", displayMode === "menu-popup")
      .append("sv-popup--show-pointer", displayMode === "menu-popup" && this.showHeader)
      .append(`sv-popup--${this.popupDirection}`, displayMode === "menu-popup" && (this.showHeader || this.popupDirection == "top" || this.popupDirection == "bottom"));

    // .append("sv-popup--dropdown", !this.isOverlay)
    // .append("sv-popup--dropdown-overlay", this.isOverlay && overlayMode !== "plain")
    // .append("sv-popup--menu-tablet", this.isOverlay && (overlayMode == "tablet-dropdown-overlay" || (overlayMode == "auto" && this.isTablet)))
    // .append("sv-popup--show-pointer", !this.isOverlay && this.showHeader)
    // .append(`sv-popup--${this.popupDirection}`, !this.isOverlay && (this.showHeader || this.popupDirection == "top" || this.popupDirection == "bottom"));
  }
  protected getShowHeader(): boolean {
    return this.model.showPointer && !this.isOverlay;
  }
  protected getPopupHeaderTemplate(): string {
    return "popup-pointer";
  }

  @property({ defaultValue: "left" }) popupDirection: string;
  @property({ defaultValue: { left: "0px", top: "0px" } }) pointerTarget: IPosition;

  private recalculatePositionHandler: (_: any, options: { isResetHeight: boolean }) => void;

  constructor(model: PopupModel) {
    super(model);
    this.model.onRecalculatePosition.add(this.recalculatePositionHandler);
  }
  public setComponentElement(componentRoot: HTMLElement): void {
    super.setComponentElement(componentRoot);
  }
  public resetComponentElement() {
    super.resetComponentElement();
  }
  public updateOnShowing(): void {
    const { root } = settings.environment;
    this.prevActiveElement = <HTMLElement>root.activeElement;

    if (this.isOverlay) {
      this.resetDimensionsAndPositionStyleProperties();
    } else {
      this.updatePosition(true, false);
    }

    this.switchFocus();
    DomWindowHelper.addEventListener("resize", this.resizeWindowCallback);
    if (this.shouldCreateResizeCallback) {
      DomWindowHelper.getVisualViewport().addEventListener("resize", this.resizeEventCallback);
      if (this.container) {
        this.container.addEventListener("touchstart", this.touchStartEventCallback);
        this.container.addEventListener("touchmove", this.touchMoveEventCallback);
      }
      this.resizeEventCallback();
    }
    DomWindowHelper.addEventListener("scroll", this.scrollEventCallBack);
    this._isPositionSetValue = true;
  }
  private get shouldCreateResizeCallback(): boolean {
    return !!DomWindowHelper.getVisualViewport() && this.isOverlay && IsTouch;
  }

  public updatePosition(isResetHeight: boolean, isDelayUpdating = true): void {
    if (isResetHeight) {
      this.height = "auto";
    }

    if (isDelayUpdating) {
      setTimeout(() => {
        this._updatePosition();
      }, 1);
    } else {
      this._updatePosition();
    }
  }

  public updateOnHiding(): void {
    super.updateOnHiding();
    DomWindowHelper.removeEventListener("resize", this.resizeWindowCallback);
    if (this.shouldCreateResizeCallback) {
      DomWindowHelper.getVisualViewport().removeEventListener("resize", this.resizeEventCallback);
      if (this.container) {
        this.container.removeEventListener("touchstart", this.touchStartEventCallback);
        this.container.removeEventListener("touchmove", this.touchMoveEventCallback);
      }
    }
    DomWindowHelper.removeEventListener("scroll", this.scrollEventCallBack);

    if (!this.isDisposed) {
      this.top = undefined;
      this.left = undefined;
      this.height = undefined;
      this.width = undefined;
      this.minWidth = undefined;
    }
  }

  protected onModelChanging(newModel: PopupModel) {
    if (!!this.model) {
      this.model.onRecalculatePosition.remove(this.recalculatePositionHandler);
    }
    if (!this.recalculatePositionHandler) {
      this.recalculatePositionHandler = (_: any, options: { isResetHeight: boolean }) => {
        if (!this.isOverlay) {
          this.updatePosition(options.isResetHeight);
        }
      };
    }
    super.onModelChanging(newModel);
    newModel.onRecalculatePosition.add(this.recalculatePositionHandler);
  }

  public dispose(): void {
    super.dispose();
    this.updateOnHiding();
    if (!!this.model) {
      this.model.onRecalculatePosition.remove(this.recalculatePositionHandler);
      this.recalculatePositionHandler = undefined;
    }
    this.resetComponentElement();
  }
}