<template>
  <div
    :class="vueSurvey.getRootCss()"
    :style="vueSurvey.themeVariables"
    :lang="vueSurvey.locale || 'en'"
    :dir="vueSurvey.localeDir"
    ref="root"
  >
    <SvComponent
      :is="'sv-svg-bundle'"
      v-if="vueSurvey.needRenderIcons"
    ></SvComponent>
    <div :class="vueSurvey.wrapperFormCss">
      <SvComponent :is="'survey-popup-modal'" />
      <div
        v-if="vueSurvey.renderBackgroundImage"
        :class="css.rootBackgroundImage"
        :style="vueSurvey.backgroundImageStyle"
      ></div>
      <form onsubmit="return false;">
        <div v-if="!vueSurvey.hasLogo" class="sv_custom_header"></div>
        <div :class="css.container">
          <SvComponent
            :is="'survey-header'"
            v-if="vueSurvey.headerView === 'basic'"
            :survey="vueSurvey"
          />
          <SvComponent
            :is="'sv-components-container'"
            :survey="vueSurvey"
            :container="'header'"
            :needRenderWrapper="false"
          ></SvComponent>
          <template v-if="vueSurvey.isShowingPage">
            <div :class="vueSurvey.bodyContainerCss">
              <SvComponent
                :is="'sv-components-container'"
                :survey="vueSurvey"
                :container="'left'"
                :needRenderWrapper="true"
              ></SvComponent>
              <div
                class="sv-components-column sv-components-column--expandable"
              >
                <SvComponent
                  :is="'sv-components-container'"
                  :survey="vueSurvey"
                  :container="'center'"
                  :needRenderWrapper="true"
                ></SvComponent>
                <div
                  :class="vueSurvey.bodyCss"
                  :style="{ maxWidth: vueSurvey.renderedWidth }"
                  :id="pageId"
                >
                  <SvComponent
                    :is="'sv-components-container'"
                    :survey="vueSurvey"
                    :container="'contentTop'"
                    :needRenderWrapper="true"
                  ></SvComponent>
                  <SvComponent
                    :is="'survey-page'"
                    :key="pageKey"
                    :survey="vueSurvey"
                    :page="vueSurvey.activePage"
                    :css="css"
                  />
                  <SvComponent
                    :is="'sv-components-container'"
                    :survey="vueSurvey"
                    :container="'contentBottom'"
                    :needRenderWrapper="true"
                  ></SvComponent>
                  <SvComponent
                    :is="'sv-brand-info'"
                    v-if="vueSurvey.showBrandInfo"
                  ></SvComponent>
                </div>
              </div>
              <SvComponent
                :is="'sv-components-container'"
                :survey="vueSurvey"
                :container="'right'"
                :needRenderWrapper="true"
              ></SvComponent>
            </div>
          </template>
          <div v-if="hasCompletedPage">
            <div
              v-html="getProcessedCompletedHtml()"
              :class="vueSurvey.completedCss"
            ></div>
            <SvComponent
              :is="'sv-components-container'"
              :survey="vueSurvey"
              :container="'completePage'"
              :needRenderWrapper="true"
            ></SvComponent>
          </div>
          <SvComponent
            :is="'sv-components-container'"
            :survey="vueSurvey"
            :container="'footer'"
            :needRenderWrapper="false"
          ></SvComponent>
          <div
            v-if="vueSurvey.state === 'completedbefore'"
            :class="vueSurvey.completedBeforeCss"
            v-html="vueSurvey.processedCompletedBeforeHtml"
          ></div>
          <div
            v-if="vueSurvey.state === 'loading'"
            :class="vueSurvey.loadingBodyCss"
            v-html="vueSurvey.processedLoadingHtml"
          ></div>
          <div v-if="vueSurvey.state === 'empty'" :class="css.bodyEmpty">
            {{ vueSurvey.emptySurveyText }}
          </div>
        </div>
      </form>
      <SvComponent
        :is="'sv-notifier'"
        :model="vueSurvey.notifier"
      ></SvComponent>
    </div>
  </div>
</template>

<script lang="ts">
import { addIconsToThemeSet, SvgRegistry } from "survey-core";
import { icons as iconsV1 } from "survey-core/icons/iconsV1";
import { icons as iconsV2 } from "survey-core/icons/iconsV2";
addIconsToThemeSet("v1", iconsV1);
addIconsToThemeSet("v2", iconsV2);
SvgRegistry.registerIcons(iconsV2);
</script>

<script lang="ts" setup>
import SvComponent from "@/SvComponent.vue";
import { settings, type SurveyModel } from "survey-core";
import {
  toRaw,
  ref,
  computed,
  getCurrentInstance,
  onMounted,
  onUnmounted,
} from "vue";
import { useBase } from "./base";
const props = defineProps<
  | {
      model: SurveyModel;
      survey?: SurveyModel;
    }
  | {
      model?: SurveyModel;
      survey: SurveyModel;
    }
>();
const root = ref<HTMLElement>();
const processedCompletedHtmlValue = ref("");
const updater = ref(1);
const vueSurvey = computed((): SurveyModel => {
  const survey = props.survey ? props.survey : props.model;
  return toRaw(survey) as SurveyModel;
});
const pageId = computed(() => {
  return vueSurvey.value.activePage ? vueSurvey.value.activePage.id : "";
});
const getActivePageId = () => {
  const id = pageId.value;
  return !!vueSurvey.value && id + updater.value.toString();
};
const hasCompletedPage = computed(
  () =>
    vueSurvey.value.showCompletedPage && vueSurvey.value.state === "completed"
);
const css = computed(() => vueSurvey.value.css);
const pageKey = computed(() => "page" + getActivePageId());

const getProcessedCompletedHtml = () => {
  if (!hasCompletedPage.value) return "";
  if (!processedCompletedHtmlValue.value) {
    processedCompletedHtmlValue.value = vueSurvey.value.processedCompletedHtml;
  }
  return processedCompletedHtmlValue.value;
};

const setupSurvey = (model: SurveyModel) => {
  if (!model) return;
  var el = root.value;
  if (el) model.afterRenderSurvey(el);
  model.renderCallback = () => {
    updater.value++;
    getCurrentInstance()?.proxy?.$forceUpdate();
  };
  model.startTimerFromUI();
};

useBase(
  () => vueSurvey.value,
  (newValue: SurveyModel, oldValue?: SurveyModel) => {
    if (newValue && oldValue) {
      setupSurvey(newValue);
    }
  },
  (model: SurveyModel) => {
    model.stopTimer();
    model.renderCallback = undefined as any;
  }
);

onMounted(() => {
  setupSurvey(vueSurvey.value);
});

onUnmounted(() => {
  vueSurvey.value.stopTimer();
  vueSurvey.value.beforeDestroySurveyElement();
  vueSurvey.value.renderCallback = undefined as any;
});
</script>
