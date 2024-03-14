import { Serializer, property } from "../jsonobject";
import { InputMaskNumeric } from "./mask_numeric";
import { IMaskedInputResult, ITextInputParams } from "./mask_utils";

export class InputMaskCurrency extends InputMaskNumeric {
  @property() prefix: string;
  @property() suffix: string;

  public getType(): string {
    return "currencymask";
  }

  private wrapText(str: string): string {
    const prefixValue = this.prefix || "";
    const suffixValue = this.suffix || "";
    let result = str;
    if(!result) return result;

    if(result.indexOf(prefixValue) === -1) {
      result = prefixValue + result;
    }
    if(result.indexOf(suffixValue) === -1) {
      result += suffixValue;
    }
    return result;
  }

  public unwrapInputArgs(args: ITextInputParams): void {
    let result = args.prevValue;
    if(!result) return;

    if(this.prefix && result.indexOf(this.prefix) !== -1) {
      result = result.slice(result.indexOf(this.prefix) + this.prefix.length);
      const preffixPadding = (this.prefix || "").length;

      args.selectionStart = Math.max((args.selectionStart - preffixPadding), 0);
      args.selectionEnd -= preffixPadding;
    }
    if(this.suffix && result.indexOf(this.suffix) !== -1) {
      result = result.slice(0, result.indexOf(this.suffix));
    }
    args.prevValue = result;
  }
  public processInput(args: ITextInputParams): IMaskedInputResult {
    this.unwrapInputArgs(args);
    const result = super.processInput(args);
    const preffixPadding = (this.prefix || "").length;
    if(!!result.value) {
      result.caretPosition += preffixPadding;
    }
    result.value = this.wrapText(result.value);
    return result;
  }

  public getMaskedValue(src: any): string {
    const result = super.getMaskedValue(src);
    return this.wrapText(result);
  }
}

Serializer.addClass(
  "currencymask",
  [
    { name: "prefix" },
    { name: "suffix" },
  ],
  () => {
    return new InputMaskCurrency();
  },
  "numericmask"
);
