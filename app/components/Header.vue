<template>
  <div class="h-[3.5rem] flex flex-row flex-nowrap justify-start items-center border-b border-solid border-(--p-content-border-color)">
    <div id="header-start" class="h-full flex-initial flex flex-row justify-center items-center">
      <img class="cursor-pointer w-[2.25rem] ml-[0.5rem] mr-[0.5rem]" src="/Logo-object-empty.png" alt="IM logo" v-on:click="toLandingPage" />
    </div>
    <div id="header-content" class="h-full flex-grow-1 flex-shrink-1 flex-auto flex flex-row justify-center items-center">
      <slot name="content" />
    </div>
    <div id="header-end" class="h-full flex-grow-0 flex-shrink-1 flex-auto flex flex-row items-center justify-self-end justify-end gap-[0.25rem]">
      <Popover ref="themesMenu" id="themesMenu" @mouseleave="themesMenu.hide()" scrollable>
        <div class="theme-container">
          <h2>Primary</h2>
          <div class="color-picker">
            <Button
              v-for="(color, index) in themeOptions.primaryColours"
              rounded
              class="round-button border-none"
              :class="selectedPrimaryColor === color && 'selected-primary'"
              :style="'background-color:var(--p-' + color + '-500)'"
              v-tooltip="color"
              @click="
                () => {
                  selectedPrimaryColor = color;
                  changePrimaryColor(color);
                }
              "
              v-bind:key="index"
            />
          </div>
          <h2>Surface</h2>
          <div class="color-picker">
            <Button
              v-for="(color, index) in themeOptions.surfaceColours"
              rounded
              class="round-button border-none"
              :class="selectedSurfaceColor === color && 'selected-surface'"
              :style="'background-color:var(--p-' + color + '-500)'"
              v-tooltip="color"
              @click="
                () => {
                  selectedSurfaceColor = color;
                  changeSurfaceColor(color);
                }
              "
              v-bind:key="index"
            />
          </div>
          <h2>Presets</h2>
          <div class="flex flex-row flex-wrap">
            <SelectButton v-model="preset" :options="themeOptions.presets" :allowEmpty="false" />
          </div>
          <h2>Dark mode</h2>
          <ToggleSwitch v-model="darkMode" />
        </div>
      </Popover>
      <Button
        v-tooltip.bottom="'Apps'"
        icon="fa-regular fa-grid-2"
        class="p-button-rounded p-button-text p-button-plain p-button-lg p-button-icon-only topbar-end-button"
        @click="openAppsOverlay"
        data-testid="apps-button"
      />
      <Popover ref="appsOP" class="app-overlay-panel" id="apps-menu">
        <div class="flex flex-row flex-wrap justify-start gap-2">
          <template v-for="(item, index) in appItems" v-bind:key="index">
            <Shortcut :label="item.label" :icon="item.icon" :command="item.command" :color="item.color" :size="item.size" :visible="item.visible" />
          </template>
        </div>
      </Popover>
      <Button
        v-tooltip.left="'Account'"
        v-if="!isLoggedIn"
        icon="fa-duotone fa-user"
        class="p-button-rounded p-button-text p-button-plain p-button-lg p-button-icon-only topbar-end-button"
        @click="openUserMenu"
        aria-haspopup="true"
        aria-controls="overlay_menu"
        data-testid="account-menu"
      />
      <Button
        id="account-button"
        v-tooltip.left="'Account'"
        v-if="currentUser && isLoggedIn"
        class="p-button-rounded p-button-text p-button-plain p-button-lg p-button-icon-only topbar-end-button"
        @click="openUserMenu"
        aria-haspopup="true"
        aria-controls="overlay_menu"
        data-testid="account-menu-logged-in"
      >
        <img class="avatar-icon" alt="avatar icon" :src="currentUser.avatar" style="min-width: 1.75rem" />
      </Button>
      <TieredMenu ref="userMenu" id="account-menu" :model="getItems()" :popup="true">
        <template #item="{ item, props }">
          <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
            <a v-ripple :href="href" v-bind="props.action" @click="navigate" style="color: var(--p-text-color)">
              <span :class="item.icon" />
              <span class="ml-2">{{ item.label }}</span>
            </a>
          </router-link>
          <a v-else-if="item.url" v-ripple :href="item.url" :target="item.target" v-bind="props.action" style="color: var(--p-text-color)">
            <span :class="item.icon" />
            <span class="ml-2">{{ item.label }}</span>
          </a>
          <div v-else v-ripple @mouseenter="toggleThemesMenu($event, item.key)" :target="item.target" v-bind="props.action" style="color: var(--p-text-color)">
            <span :class="item.icon" />
            <span class="ml-2">{{ item.label }} </span>
            <span v-if="item.key === currentFontSize" class="theme-icon p-menuitem-icon fa-regular fa-check" />
          </div>
        </template>
      </TieredMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from "@endeavour/vue-library";
import { useChangeFontSize, useChangeThemeOptions } from "@endeavour/vue-library/composables";
import { presets, primaryColors, surfaceColors } from "@endeavour/vue-library/constants";
import { FontSize, PrimeVueColors, PrimeVuePresetThemes } from "@endeavour/vue-library/enums";

import type { MenuItem } from "primevue/menuitem";

const userStore = useUserStore();
const { changeFontSize } = useChangeFontSize();
const { changeDarkMode, changePreset, changePrimaryColor, changeSurfaceColor } = useChangeThemeOptions();

const currentUser = computed(() => userStore.currentUser);
const isLoggedIn = computed(() => userStore.isLoggedIn);
const currentFontSize = computed(() => userStore.currentFontSize);
const currentPreset = computed(() => userStore.currentPreset);
const currentPrimaryColor = computed(() => userStore.currentPrimaryColor);
const currentSurfaceColor = computed(() => userStore.currentSurfaceColor);
const userDarkMode = computed(() => userStore.darkMode);

const loginItems: Ref<MenuItem[]> = ref([]);
const accountItems: Ref<MenuItem[]> = ref([]);
const appItems: Ref<{ icon: string; command?: () => void; url?: string; label: string; color: string; size: number; visible?: boolean }[]> = ref([]);

const themeOptions: Ref<{ primaryColours: PrimeVueColors[]; surfaceColours: PrimeVueColors[]; presets: PrimeVuePresetThemes[] }> = ref({
  presets: presets,
  primaryColours: primaryColors,
  surfaceColours: surfaceColors
});
const preset: Ref<PrimeVuePresetThemes> = ref(themeOptions.value.presets[0]!);
const darkMode: Ref<boolean> = ref(false);
const selectedPrimaryColor: Ref<PrimeVueColors> = ref(themeOptions.value.primaryColours[0]!);
const selectedSurfaceColor: Ref<PrimeVueColors> = ref(themeOptions.value.surfaceColours[0]!);

const userMenu = ref();
const themesMenu = ref();
const fontSizeMenu = ref();
const appsOP = ref();

watch(preset, async newValue => {
  await changePreset(newValue);
});

watch(darkMode, async newValue => {
  await changeDarkMode(newValue);
});

onMounted(() => {
  darkMode.value = userDarkMode.value;
  if (currentPreset.value) preset.value = currentPreset.value;
  if (currentPrimaryColor.value) selectedPrimaryColor.value = currentPrimaryColor.value;
  if (currentSurfaceColor.value) selectedSurfaceColor.value = currentSurfaceColor.value;
  setUserMenuItems();
  setAppMenuItems();
});

async function toLandingPage() {
  return navigateTo("/");
}

function getItems(): MenuItem[] {
  if (isLoggedIn.value) return accountItems.value;
  else return loginItems.value;
}

function openUserMenu(event: MouseEvent) {
  userMenu.value.toggle(event);
}

function openAppsOverlay(event: MouseEvent) {
  appsOP.value.toggle(event);
}

function setUserMenuItems(): void {
  loginItems.value = [
    {
      label: "Login",
      icon: "fa-solid fa-fw fa-user",
      command: async () => {
        await globalThis.uiGuard.login();
      }
    },
    { separator: true },
    {
      label: "Display settings",
      icon: "fa-solid fa-fw fa-gear",
      items: [
        {
          key: "fontSize",
          label: "Change font size",
          icon: "fa-duotone fa-text-size",
          items: getFontSizes()
        },
        {
          key: "themes",
          label: "Change theme",
          icon: "fa-regular fa-palette"
        }
      ]
    }
  ];
  accountItems.value = [
    {
      label: "My Account",
      icon: "fa-solid fa-fw fa-cog",
      command: async () => {
        await globalThis.uiGuard.profile();
      }
    },
    {
      label: "Logout",
      icon: "fa-solid fa-fw fa-arrow-right-from-bracket",
      command: async () => {
        await globalThis.uiGuard.logout();
      }
    },
    { separator: true },
    {
      label: "Display settings",
      icon: "fa-solid fa-fw fa-gear",
      items: [
        {
          key: "fontSize",
          label: "Change font size",
          icon: "fa-duotone fa-text-size",
          items: getFontSizes()
        },
        {
          key: "themes",
          label: "Change theme",
          icon: "fa-regular fa-palette"
        }
      ]
    }
  ];
}

function toggleThemesMenu(event: MouseEvent, key: string | undefined) {
  if (key) {
    switch (key) {
      case "themes":
        if (fontSizeMenu.value && fontSizeMenu.value.visible) fontSizeMenu.value.hide();
        else themesMenu.value.show(event);
        break;
      case "fontSize":
        if (themesMenu.value.visible) themesMenu.value.hide();
        break;
    }
  }
}

function getFontSizes(): MenuItem[] {
  return [
    {
      key: "12px",
      label: "Small",
      icon: "fa-regular fa-a fa-xs",
      command: async () => {
        await changeFontSize(FontSize.SMALL);
      }
    },
    {
      key: "14px",
      label: "Medium",
      icon: "fa-regular fa-a fa-sm",
      command: async () => {
        await changeFontSize(FontSize.MEDIUM);
      }
    },
    {
      key: "16px",
      label: "Large",
      icon: "fa-regular fa-a",
      command: async () => {
        await changeFontSize(FontSize.LARGE);
      }
    },
    {
      key: "18px",
      label: "XLarge",
      icon: "fa-regular fa-a",
      command: async () => {
        await changeFontSize(FontSize.XL);
      }
    }
  ];
}

function setAppMenuItems() {
  appItems.value = [
    {
      label: "Directory",
      icon: "fa-duotone fa-folder-open",
      command: () => {
        navigateTo("https://im.endhealth.co.uk/#/", { external: true });
      },
      color: "var(--p-blue-500)",
      size: 2
    }
  ];
}
</script>

<style scoped>
.im-logo {
  cursor: pointer;
  margin: 0 0.5rem;
  width: 2.25rem;
}

.font-size-row {
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  gap: 0.5rem;
  min-height: 30px;
  cursor: pointer;
}

.theme-icon {
  margin-left: 1rem;
  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: center;
  padding: 0.125rem 0;
}

.header-end-button:hover {
  background-color: var(--p-text-color) !important;
  color: var(--p-content-background) !important;
}

.app-overlay-panel {
  z-index: 1;
}

#themes-menu {
  overflow: auto;
}

.theme-container {
  display: flex;
  flex-flow: column nowrap;
  width: 18rem;
}

.color-picker {
  display: flex;
  flex-flow: row wrap;
  gap: 0.25rem;
}

.round-button {
  height: 2rem;
  width: 2rem;
}

.filter-text {
  font-size: 0.8em;
}
</style>
