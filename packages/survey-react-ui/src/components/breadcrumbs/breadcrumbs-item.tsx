import * as React from "react";
import * as ReactDOM from "react-dom";
import { Base, Action } from "survey-core";
import { ReactElementFactory } from "../../element-factory";
import { SurveyElementBase } from "../../reactquestion_element";
import { attachKey2click } from "../../reactSurvey";
import { SvgIcon } from "../svg-icon/svg-icon";
import { SurveyAction } from "../action-bar/action-bar-item";

interface IActionBarItemProps {
  item: Action;
}

export class SurveyBreadcrumbsItem extends SurveyAction {
}

ReactElementFactory.Instance.registerElement("sv-breadcrumbs-item", (props) => {
  return React.createElement(SurveyBreadcrumbsItem, props);
});
