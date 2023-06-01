import { findScrollableParent, isShadowDOM } from "../utils/utils";
import { IsMobile, IsTouch } from "../utils/devices";
import { settings, ISurveyEnvironment } from "../settings";
import { IDragDropEngine } from "./engine";

// WebKit requires cancelable `touchmove` events to be added as early as possible
// see https://bugs.webkit.org/show_bug.cgi?id=184250
if(typeof window !== "undefined") {
  window.addEventListener(
    "touchmove",
    (event) => {
      if (!DragDropDOMAdapter.PreventScrolling) {
        return;
      }

      // Prevent scrolling
      event.preventDefault();
    },
    { passive: false }
  );
}

export interface IDragDropDOMAdapter {
  startDrag(event: PointerEvent, draggedElement: any, parentElement: any, draggedElementNode: HTMLElement, preventSaveTargetNode: boolean): void;
  draggedElementShortcut: HTMLElement;
}

export class DragDropDOMAdapter implements IDragDropDOMAdapter {
  public static PreventScrolling = false;

  private timeoutID: any;
  private startX: number;
  private startY: number;
  private currentX: number;
  private currentY: number;
  // save event.target node from the frameworks update. See  https://stackoverflow.com/questions/33298828/touch-move-event-dont-fire-after-touch-start-target-is-removed
  private savedTargetNode: any;
  private scrollIntervalId: number = null;

  constructor(private dd: IDragDropEngine, private longTap?: boolean) {
  }
  private stopLongTapIfMoveEnough = (pointerMoveEvent: PointerEvent) => {
    pointerMoveEvent.preventDefault();
    this.currentX = pointerMoveEvent.pageX;
    this.currentY = pointerMoveEvent.pageY;
    if (this.isMicroMovement) return;
    document.body.style.setProperty("touch-action", "");
    document.body.style.setProperty("user-select", "");
    document.body.style.setProperty("-webkit-user-select", "");
    this.stopLongTap();
  };
  // see https://stackoverflow.com/questions/6042202/how-to-distinguish-mouse-click-and-drag
  private get isMicroMovement() {
    const delta = 5;
    const diffX = Math.abs(this.currentX - this.startX);
    const diffY = Math.abs(this.currentY - this.startY);
    return diffX < delta && diffY < delta;
  }
  private stopLongTap = (e?: any) => {
    clearTimeout(this.timeoutID);
    this.timeoutID = null;
    document.removeEventListener("pointerup", this.stopLongTap);
    document.removeEventListener("pointermove", this.stopLongTapIfMoveEnough);
  };
  private startLongTapProcessing(
    event: PointerEvent,
    draggedElement: any,
    parentElement?: any,
    draggedElementNode?: HTMLElement,
    preventSaveTargetNode: boolean = false
  ): void {
    this.startX = event.pageX;
    this.startY = event.pageY;
    document.body.style.setProperty("touch-action", "none", "important");
    document.body.style.setProperty("user-select", "none", "important");
    document.body.style.setProperty("-webkit-user-select", "none", "important");

    this.timeoutID = setTimeout(() => {
      this.doStartDrag(
        event,
        draggedElement,
        parentElement,
        draggedElementNode
      );
      if (!preventSaveTargetNode) {
        this.savedTargetNode = event.target;
        this.savedTargetNode.style.cssText =
            `
          position: absolute;
          height: 1px!important;
          width: 1px!important;
          overflow: hidden;
          clip: rect(1px 1px 1px 1px);
          clip: rect(1px, 1px, 1px, 1px);
        `;
        settings.environment.rootElement.appendChild(this.savedTargetNode);
      }

      this.stopLongTap();
    }, this.longTap? 500: 0);

    document.addEventListener("pointerup", this.stopLongTap);
    document.addEventListener("pointermove", this.stopLongTapIfMoveEnough);
  }
  private handlePointerCancel = (event: PointerEvent) => {
    this.clear();
  };
  private handleEscapeButton = (event: KeyboardEvent) => {
    if (event.keyCode == 27) {
      this.clear();
    }
  };
  private onContextMenu = (event:any) => {
    event.preventDefault();
    event.stopPropagation();
  }
  private moveShortcutElement(event: PointerEvent) {
    this.doScroll(event.clientY, event.clientX);

    const shortcutHeight = this.draggedElementShortcut.offsetHeight;
    const shortcutWidth = this.draggedElementShortcut.offsetWidth;
    let shortcutXOffset = this.draggedElementShortcut.shortcutXOffset || shortcutWidth / 2;
    let shortcutYOffset = this.draggedElementShortcut.shortcutYOffset || shortcutHeight / 2;

    // TODO this is hot fix for RTL support. Probably we need better global strategy for it. https://github.com/surveyjs/survey-library/issues/4554
    if (document.querySelectorAll("[dir='rtl']").length !== 0) {
      shortcutXOffset = shortcutWidth / 2;
      shortcutYOffset = shortcutHeight / 2;
    }

    const documentBottom = (isShadowDOM(settings.environment.root) ? settings.environment.root.host : settings.environment.root.documentElement).clientHeight;
    const documentRight = (isShadowDOM(settings.environment.root) ? settings.environment.root.host : settings.environment.root.documentElement).clientWidth;
    const shortcutBottomCoordinate = this.getShortcutBottomCoordinate(event.clientY, shortcutHeight, shortcutYOffset);
    const shortcutRightCoordinate = this.getShortcutRightCoordinate(event.clientX, shortcutWidth, shortcutXOffset);

    if (shortcutRightCoordinate >= documentRight) {
      this.draggedElementShortcut.style.left =
        event.pageX -
        event.clientX +
        documentRight -
        shortcutWidth +
        "px";
      this.draggedElementShortcut.style.top =
        event.pageY - shortcutYOffset + "px";
      return;
    }

    if (event.clientX - shortcutXOffset <= 0) {
      this.draggedElementShortcut.style.left =
        event.pageX - event.clientX + "px";
      this.draggedElementShortcut.style.top =
        event.pageY - shortcutYOffset + "px";
      return;
    }

    if (shortcutBottomCoordinate >= documentBottom) {
      this.draggedElementShortcut.style.left =
        event.pageX - shortcutXOffset + "px";
      this.draggedElementShortcut.style.top =
        event.pageY -
        event.clientY +
        documentBottom -
        shortcutHeight +
        "px";
      return;
    }

    if (event.clientY - shortcutYOffset <= 0) {
      this.draggedElementShortcut.style.left =
        event.pageX - shortcutXOffset + "px";
      this.draggedElementShortcut.style.top =
        event.pageY - event.clientY + "px";
      return;
    }

    this.draggedElementShortcut.style.left =
      event.pageX - shortcutXOffset + "px";
    this.draggedElementShortcut.style.top =
      event.pageY - shortcutYOffset + "px";
  }
  private getShortcutBottomCoordinate(currentY: number, shortcutHeight: number, shortcutYOffset: number):number {
    return currentY + shortcutHeight - shortcutYOffset;
  }
  private getShortcutRightCoordinate(currentX: number, shortcutWidth: number, shortcutXOffset: number):number {
    return currentX + shortcutWidth - shortcutXOffset;
  }
  private doScroll(clientY: number, clientX: number) {
    cancelAnimationFrame(this.scrollIntervalId);
    const startScrollBoundary = 50;

    this.draggedElementShortcut.hidden = true;
    let dragOverNode = <HTMLElement>document.elementFromPoint(clientX, clientY);
    this.draggedElementShortcut.hidden = false;

    let scrollableParentNode = findScrollableParent(dragOverNode);

    let top: number;
    let bottom: number;
    let left: number;
    let right: number;

    if (scrollableParentNode.tagName === "HTML") {
      top = 0;
      bottom = document.documentElement.clientHeight;
      left = 0;
      right = document.documentElement.clientWidth;
    } else {
      top = scrollableParentNode.getBoundingClientRect().top;
      bottom = scrollableParentNode.getBoundingClientRect().bottom;
      left = scrollableParentNode.getBoundingClientRect().left;
      right = scrollableParentNode.getBoundingClientRect().right;
    }

    const repeat = () => {
      if (clientY - top <= startScrollBoundary) {
        scrollableParentNode.scrollTop -= 15;
      } else if (bottom - clientY <= startScrollBoundary) {
        scrollableParentNode.scrollTop += 15;
      } else if (right - clientX <= startScrollBoundary) {
        scrollableParentNode.scrollLeft += 15;
      } else if (clientX - left <= startScrollBoundary) {
        scrollableParentNode.scrollLeft -= 15;
      }
      this.scrollIntervalId = requestAnimationFrame(repeat);
    };
    this.scrollIntervalId = requestAnimationFrame(repeat);
  }
  private dragOver = (event: PointerEvent) => {
    this.moveShortcutElement(event);
    this.draggedElementShortcut.style.cursor = "grabbing";
    this.dd.dragOver(event);
  };
  private clear = () => {
    cancelAnimationFrame(this.scrollIntervalId);

    document.removeEventListener("pointermove", this.dragOver);
    document.removeEventListener("pointercancel", this.handlePointerCancel);
    document.removeEventListener("keydown", this.handleEscapeButton);
    document.removeEventListener("pointerup", this.drop);
    this.draggedElementShortcut.removeEventListener("pointerup", this.drop);
    if (IsTouch) {
      this.draggedElementShortcut.removeEventListener("contextmenu", this.onContextMenu);
    }
    settings.environment.rootElement.removeChild(this.draggedElementShortcut);

    this.dd.clear();
    this.draggedElementShortcut = null;
    this.scrollIntervalId = null;

    if (IsTouch) {
      this.savedTargetNode && settings.environment.rootElement.removeChild(this.savedTargetNode);
      DragDropDOMAdapter.PreventScrolling = false;
    }
    document.body.style.setProperty("touch-action", "");
    document.body.style.setProperty("user-select", "");
    document.body.style.setProperty("-webkit-user-select", "");
  };
  private drop = () => {
    this.dd.drop();
    this.clear();
  };
  private doStartDrag(
    event: PointerEvent,
    draggedElement: any,
    parentElement?: any,
    draggedElementNode?: HTMLElement
  ): void {
    if (IsTouch) {
      DragDropDOMAdapter.PreventScrolling = true;
    }
    if (event.which === 3) return; //right mouse btn

    this.dd.dragInit(event, draggedElement, parentElement, draggedElementNode);

    document.body.append(this.draggedElementShortcut);
    this.moveShortcutElement(event);

    document.addEventListener("pointermove", this.dragOver);
    document.addEventListener("pointercancel", this.handlePointerCancel);
    document.addEventListener("keydown", this.handleEscapeButton);
    document.addEventListener("pointerup", this.drop);
    if (!IsTouch) {
      this.draggedElementShortcut.addEventListener("pointerup", this.drop);
    } else {
      this.draggedElementShortcut.addEventListener("contextmenu", this.onContextMenu);
    }
  }

  public draggedElementShortcut: any = null;

  public startDrag(event: PointerEvent, draggedElement: any, parentElement?: any, draggedElementNode?: HTMLElement, preventSaveTargetNode: boolean = false): void {
    if (IsTouch) {
      this.startLongTapProcessing(
        event,
        draggedElement,
        parentElement,
        draggedElementNode,
        preventSaveTargetNode
      );
      return;
    }
    this.doStartDrag(event, draggedElement, parentElement, draggedElementNode);
  }
}
