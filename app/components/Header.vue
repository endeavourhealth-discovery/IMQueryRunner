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
      {{user?.userName}}
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
          class="avatar-i con"
          alt="avatar icon"
          :src="user?.avatar"
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
            <span class="ml-2 cursor-pointer">{{ item.label }}</span>
          </div>
        </template>
      </TieredMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MenuItem } from "primevue/menuitem";
import { useUserStore } from "~/plugins/end-sec-ui";
import {useRouter} from "#app";

const userStore = useUserStore();

const loginItems: Ref<MenuItem[]> = ref([]);
const accountItems: Ref<MenuItem[]> = ref([]);
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)
const userMenu = ref();

onMounted(() => {
  setUserMenuItems();
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

function setUserMenuItems(): void {
  loginItems.value = [
    {
      label: "Login",
      icon: "fa-solid fa-fw fa-user",
      command: async () => {
        await globalThis.uiGuard.login()
      }
    },
  ];
  accountItems.value = [
    {
      label: "My Account",
      icon: "fa-solid fa-fw fa-cog",
      command: async () => {
        await globalThis.uiGuard.profile()
      }
    },
    {
      label: "Logout",
      icon: "fa-solid fa-fw fa-arrow-right-from-bracket",
      command: async () => {
        await globalThis.uiGuard.logout()
      }
    },
  ];
}

</script>

<style scoped></style>
