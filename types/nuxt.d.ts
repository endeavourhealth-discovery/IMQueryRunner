type RawResult<T> = {
  data: T | null;
  error: unknown;
};

type ApiFetch = {
  <T>(url: string, opts?: { raw?: false } & any): Promise<T>;
  <T>(url: string, opts: { raw: true } & any): Promise<RawResult<T>>;
};

declare module "#app" {
  interface NuxtApp {
    $apiFetch: ApiFetch;
  }
}

declare module "vue" {
  interface ComponentCustomProperties {
    $apiFetch: ApiFetch;
  }
}
