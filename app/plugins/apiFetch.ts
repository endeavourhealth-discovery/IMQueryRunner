type RawResult<T> = {
  data: T | null;
  error: unknown;
};

type FetchOptions = Parameters<typeof $fetch>[1];

type ApiFetchOptions = FetchOptions & {
  raw?: boolean;
};

type ApiFetch = {
  <T>(url: string, opts?: ApiFetchOptions & { raw?: false }): Promise<T>;
  <T>(
    url: string,
    opts: ApiFetchOptions & { raw: true },
  ): Promise<RawResult<T>>;
};

export default defineNuxtPlugin(() => {
  const apiFetch: ApiFetch = async <T>(
    url: string,
    options: ApiFetchOptions = {},
  ) => {
    const { raw, ...fetchOptions } = options;

    if (!raw) {
      return $fetch<T>(url, fetchOptions);
    }

    try {
      const data = await $fetch<T>(url, fetchOptions);

      return {
        data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  };

  return {
    provide: {
      apiFetch,
    },
  };
});
