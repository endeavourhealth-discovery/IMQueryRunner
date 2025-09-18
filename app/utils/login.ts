export async function login(successUrl: string) {
  const config = useRuntimeConfig().public;
  await navigateTo(
    `${config.casdoorUrl}/login/${
      config.casdoorOrganisationName
    }?redirect_uri=${encodeURIComponent(
      successUrl
    )}&response_type=code&client_id=${config.casdoorClientId}`,
    { external: true }
  );
}
