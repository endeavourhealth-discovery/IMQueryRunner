<template>
  <div
    class="h-[3.5rem] flex flex-row flex-nowrap justify-start items-center border-b border-solid border-(--p-content-border-color)"
  >
    <div
      id="header-start"
      class="h-full flex-initial flex flex-row justify-center items-center"
    >
      <img
        class="cursor-pointer w-[2.25rem] ml-[0.5rem] mr-[0.5rem]"
        src="/Logo-object-empty.png"
        alt="IM logo"
        v-on:click="toLandingPage"
      />
    </div>
    <div
      id="header-content"
      class="h-full flex-grow-1 flex-shrink-1 flex-auto flex flex-row justify-center items-center"
    >
      <slot name="content" />
    </div>
    <div
      id="header-end"
      class="h-full flex-grow-0 flex-shrink-1 flex-auto flex flex-row items-center justify-self-end justify-end gap-[0.25rem]"
    >
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
        v-if="user && isLoggedIn"
        class="p-button-rounded p-button-text p-button-plain p-button-lg p-button-icon-only topbar-end-button"
        @click="openUserMenu"
        aria-haspopup="true"
        aria-controls="overlay_menu"
        data-testid="account-menu-logged-in"
      >
        <img
          class="avatar-icon"
          alt="avatar icon"
          :src="user.avatar"
          style="min-width: 1.75rem"
        />
      </Button>
      <TieredMenu
        ref="userMenu"
        id="account-menu"
        :model="getItems()"
        :popup="true"
      >
        <template #item="{ item, props }">
          <div>
            <span :class="item.icon" />
            <span
              class="ml-2 cursor-pointer"
              @mouseenter="toggleThemesMenu($event, item.key)"
              >{{ item.label }}</span
            >
          </div>
        </template>
      </TieredMenu>
      <Popover
        ref="themesMenu"
        id="themes-menu"
        @mouseleave="themesMenu.hide()"
        scrollable
      >
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
            <SelectButton
              v-model="preset"
              :options="themeOptions.presets"
              :allowEmpty="false"
            />
          </div>
          <h2>Dark mode</h2>
          <ToggleSwitch v-model="darkMode" />
        </div>
      </Popover>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem";
import { useUser } from "~/composables/useUser";
import { AuthService } from "~/services";
import useChangeScale from "@/composables/useChangeScale";
import { PrimeVueColors, PrimeVuePresetThemes } from "~~/enums";

const { user, isLoggedIn } = useUser();
const router = useRouter();
const route = useRoute();
const confirm = useConfirm();
const toast = useToast();
const userStore = useUser();
const { changeScale } = useChangeScale();
const { changeDarkMode, changePreset, changePrimaryColor, changeSurfaceColor } =
  useChangeThemeOptions();

const loginItems: Ref<MenuItem[]> = ref([]);
const accountItems: Ref<MenuItem[]> = ref([]);
const themeOptions: Ref<{
  primaryColours: PrimeVueColors[];
  surfaceColours: PrimeVueColors[];
  presets: PrimeVuePresetThemes[];
}> = ref({
  primaryColours: [
    PrimeVueColors.EMERALD,
    PrimeVueColors.GREEN,
    PrimeVueColors.LIME,
    PrimeVueColors.RED,
    PrimeVueColors.ORANGE,
    PrimeVueColors.AMBER,
    PrimeVueColors.YELLOW,
    PrimeVueColors.TEAL,
    PrimeVueColors.CYAN,
    PrimeVueColors.SKY,
    PrimeVueColors.BLUE,
    PrimeVueColors.INDIGO,
    PrimeVueColors.VIOLET,
    PrimeVueColors.PURPLE,
    PrimeVueColors.FUCHSIA,
    PrimeVueColors.PINK,
    PrimeVueColors.ROSE,
  ],
  surfaceColours: [
    PrimeVueColors.SLATE,
    PrimeVueColors.GRAY,
    PrimeVueColors.ZINC,
    PrimeVueColors.NEUTRAL,
    PrimeVueColors.STONE,
  ],
  presets: [
    PrimeVuePresetThemes.AURA,
    PrimeVuePresetThemes.LARA,
    PrimeVuePresetThemes.NORA,
    PrimeVuePresetThemes.MATERIAL,
  ],
});
const preset = ref(themeOptions.value.presets[0]);
const darkMode = ref(false);
const selectedPrimaryColor = ref(themeOptions.value.primaryColours[0]);
const selectedSurfaceColor = ref(themeOptions.value.surfaceColours[0]);

watch(preset, async (newValue) => {
  if (newValue) await changePreset(newValue);
});

watch(darkMode, async (newValue) => {
  await changeDarkMode(newValue);
});

const userMenu = ref();
const themesMenu = ref();

onMounted(() => {
  setUserMenuItems();
});

async function toLandingPage() {
  return await navigateTo("/");
}

function getItems(): MenuItem[] {
  if (isLoggedIn.value) return accountItems.value;
  else return loginItems.value;
}

function openUserMenu(event: MouseEvent) {
  userMenu.value.toggle(event);
}

function setUserMenuItems(): void {
  loginItems.value = [
    {
      label: "Login",
      icon: "fa-solid fa-fw fa-user",
      command: async () => await toLogin(),
    },
    {
      label: "Register",
      icon: "fa-solid fa-fw fa-user",
      command: async () => await toRegister(),
    },
  ];
  accountItems.value = [
    {
      label: "Logout",
      icon: "fa-solid fa-fw fa-arrow-right-from-bracket",
      command: async () => await confirmLogout(),
    },
    {
      separator: true,
    },
    {
      label: "Display settings",
      icon: "fa-solid fa-fw fa-gear",
      items: [
        {
          key: "scale",
          label: "Change scale",
          icon: "fa-duotone fa-text-size",
          items: getScales(),
        },
        {
          key: "themes",
          label: "Change theme",
          icon: "fa-regular fa-palette",
        },
      ],
    },
  ];
}

async function toLogin() {
  const reqUrl = useRequestURL();
  userStore.clearUserCookie();
  const loginUrl = await AuthService.getLoginUrl(reqUrl.origin, route.path);
  await navigateTo(loginUrl.data.value, { external: true });
}

async function toRegister() {
  const reqUrl = useRequestURL();
  userStore.clearUserCookie();
  const registerUrl = await AuthService.getRegisterUrl(
    reqUrl.origin,
    route.path
  );
  await navigateTo(registerUrl.data.value, { external: true });
}

async function confirmLogout() {
  toast.add({ severity: "success", summary: "Success" });
  confirm.require({
    message: "Are you sure you want to logout?",
    header: "Logout",
    acceptProps: {
      label: "Logout",
    },
    rejectProps: {
      label: "Cancel",
      severity: "secondary",
      outlined: true,
    },
    accept: async () => {
      await AuthService.logout();
      location.reload();
    },
  });
}

function getScales(): MenuItem[] {
  return [
    {
      key: "12px",
      label: "Small",
      icon: "fa-regular fa-a fa-xs",
      command: async () => await changeScale("12px"),
    },
    {
      key: "14px",
      label: "Medium",
      icon: "fa-regular fa-a fa-sm",
      command: async () => await changeScale("14px"),
    },
    {
      key: "16px",
      label: "Large",
      icon: "fa-regular fa-a",
      command: async () => await changeScale("16px"),
    },
    {
      key: "18px",
      label: "XLarge",
      icon: "fa-regular fa-a",
      command: async () => await changeScale("18px"),
    },
  ];
}

function toggleThemesMenu(event: MouseEvent, key: string | undefined) {
  if (key) {
    switch (key) {
      case "themes":
        themesMenu.value.show(event);
        break;
      case "scale":
        if (themesMenu.value.visible) themesMenu.value.hide();
        break;
    }
  }
}
</script>

<style scoped>
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
</style>
